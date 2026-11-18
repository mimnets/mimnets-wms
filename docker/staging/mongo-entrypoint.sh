#!/bin/bash
# The mongo service (m1-068, D-DB-20): MongoDB 8.0 with TLS and member
# authentication, as a one-member replica set named mongo:27017. At every
# start it checks the database itself and adds what is missing: the replica
# set, the user administrator, the app user and the PBM user; it also moves
# the site database from its name before m1-078 (move_old_database). The secrets come
# from the setup job, in the read-only /secrets volume.
#
# WMS_RESTORE=1 (restore drill): no app user, because `pbm restore` brings
# it back with the backup.
#
# Guides: docs/runbooks/staging-container.md, docs/runbooks/pbm-backup-and-restore.md
set -euo pipefail

SECRETS=/secrets
TLS="$SECRETS/tls"
DB_NAME=wms
MEMBER=mongo:27017
CACHE_GB="${WMS_MONGO_CACHE_GB:-1}"
# Removed at every start; written when the checks below are done. The health
# check needs it, so the app and PBM start only after their users exist.
READY=/tmp/wms-mongo-ready

log() {
  echo "[wms] $*"
}

mongosh_local() {
  mongosh --quiet --tls --tlsCAFile "$TLS/ca.pem" --host localhost --port 27017 "$@"
}

# Runs the script on standard input with --file, so that an error stops this
# entrypoint (piped input would not). The file holds passwords, so it is
# private and removed at once; they never go into the arguments. Only the
# script's own "[wms] ..." lines reach the log.
run_js() {
  local file status=0
  file="$(umask 077; mktemp /tmp/wms-XXXXXX.js)"
  cat > "$file"
  mongosh_local --file "$file" | { grep '^\[wms\]' || true; } || status=$?
  rm -f "$file"
  return "$status"
}

# As run_js, logged in as the user administrator.
mongosh_admin() {
  { printf 'db.getSiblingDB("admin").auth("siteAdmin", "%s");\n' "$(cat "$SECRETS/mongo-admin-password")"; cat; } | run_js
}

wait_for_primary() {
  until [ "$(mongosh_local --eval 'db.hello().isWritablePrimary' 2> /dev/null)" = "true" ]; do
    kill -0 "$mongod_pid" 2> /dev/null || { log "MongoDB stopped"; exit 1; }
    sleep 1
  done
}

# The replica set and the first user. The first user is created through
# MongoDB's localhost exception, which closes once that user exists.
ensure_replica_set_and_admin() {
  if [ -z "$(mongosh_local --eval 'db.hello().setName || ""')" ]; then
    log "Creating the replica set ($MEMBER)"
    mongosh_local --eval "rs.initiate({ _id: 'rs0', members: [ { _id: 0, host: '$MEMBER' } ] })" > /dev/null
  fi
  wait_for_primary
  run_js <<EOF
const admin = db.getSiblingDB("admin");
let known = false;
try { known = admin.auth("siteAdmin", "$(cat "$SECRETS/mongo-admin-password")").ok === 1; } catch (e) {}
if (!known) {
  print("[wms] Creating the user administrator");
  admin.createUser({
    user: "siteAdmin",
    pwd: "$(cat "$SECRETS/mongo-admin-password")",
    roles: [ "userAdminAnyDatabase", "clusterAdmin" ]
  });
}
EOF
}

# Rename stage 5 (m1-078, D-GIT-80): the site database was `assurer` with the
# app user `assurerApp`. Moves every collection to `wms` (renameCollection
# across databases copies documents and indexes) and drops the old user. Runs
# at every start, before the health check passes, so the app never meets an
# empty `wms` while `assurer` holds the site: after deploy.sh copied the old
# volumes, and after restoring a PBM backup from before m1-078 on a running
# site (drop `wms` first, then restart mongo).
# Does nothing when `assurer` has no collections; when both
# databases have some, MongoDB runs but never becomes ready, because only a
# person can tell which one is the site.
# The user administrator cannot read data, so it holds readWriteAnyDatabase
# only while `assurer` exists, for the move.
move_old_database() {
  mongosh_admin <<'EOF'
const admin = db.getSiblingDB("admin");
const from = db.getSiblingDB("assurer");
const to = db.getSiblingDB("wms");
// listDatabases needs no data access (clusterAdmin); MongoDB lists a database only while it has collections.
const listed = admin.runCommand({ listDatabases: 1, nameOnly: true }).databases.map((d) => d.name);
if (listed.includes("assurer")) {
  admin.grantRolesToUser("siteAdmin", [ "readWriteAnyDatabase" ]);
  try {
    const names = from.getCollectionNames().filter((name) => !name.startsWith("system."));
    if (to.getCollectionNames().length) {
      throw new Error("[wms] Both databases assurer and wms have collections; nothing moved. See the PBM runbook, rename stage 5");
    }
    const count = (d) => d.getCollectionNames().reduce((n, c) => n + d.getCollection(c).countDocuments({}), 0);
    const before = count(from);
    for (const name of names) {
      const result = admin.runCommand({ renameCollection: `assurer.${name}`, to: `wms.${name}` });
      if (result.ok !== 1) {
        throw new Error(`[wms] Moving assurer.${name} failed: ${result.errmsg}`);
      }
    }
    const after = count(to);
    print(`[wms] Moved ${names.length} collections from assurer to wms: ${before} documents before, ${after} after`);
    if (before !== after) {
      throw new Error("[wms] Document counts differ after the move");
    }
  } finally {
    admin.revokeRolesFromUser("siteAdmin", [ "readWriteAnyDatabase" ]);
  }
}
if (from.getUser("assurerApp")) {
  from.dropUser("assurerApp");
  print("[wms] Dropped the old app user assurerApp");
}
EOF
}

ensure_app_user() {
  mongosh_admin <<EOF
const site = db.getSiblingDB("$DB_NAME");
if (!site.getUser("wmsApp")) {
  site.createUser({
    user: "wmsApp",
    pwd: "$(cat "$SECRETS/mongo-app-password")",
    roles: [ { role: "readWrite", db: "$DB_NAME" } ]
  });
}
EOF
}

# The pbm user's roles, from Percona's documentation. pbmAnyAction can do
# anything in MongoDB (D-DB-12, accepted by the owner).
ensure_pbm_user() {
  mongosh_admin <<EOF
const admin = db.getSiblingDB("admin");
if (!admin.getRole("pbmAnyAction")) {
  admin.createRole({
    role: "pbmAnyAction",
    privileges: [ { resource: { anyResource: true }, actions: [ "anyAction" ] } ],
    roles: []
  });
}
if (!admin.getUser("pbm")) {
  admin.createUser({
    user: "pbm",
    pwd: "$(cat "$SECRETS/mongo-pbm-password")",
    roles: [
      { db: "admin", role: "readWrite", collection: "" },
      { db: "admin", role: "backup" },
      { db: "admin", role: "clusterMonitor" },
      { db: "admin", role: "restore" },
      { db: "admin", role: "pbmAnyAction" }
    ]
  });
}
EOF
}

mongod_pid=

shutdown() {
  log "Stopping MongoDB"
  rm -f "$READY"
  kill -TERM "$mongod_pid" 2> /dev/null || true
  wait "$mongod_pid" 2> /dev/null || true
  exit 0
}
trap shutdown TERM INT

for file in mongo-keyfile mongo-admin-password mongo-app-password mongo-pbm-password tls/mongod.pem tls/ca.pem; do
  [ -s "$SECRETS/$file" ] || { log "Missing $SECRETS/$file: the setup job has not run"; exit 1; }
done
rm -f "$READY"
chown -R mongodb:mongodb /data/db

wms-run-as mongodb mongod --config /etc/wms/mongod.conf --wiredTigerCacheSizeGB "$CACHE_GB" &
mongod_pid=$!

until mongosh_local --eval 'db.hello().ok' > /dev/null 2>&1; do
  kill -0 "$mongod_pid" 2> /dev/null || { log "MongoDB did not start"; exit 1; }
  sleep 1
done

ensure_replica_set_and_admin
if [ "${WMS_RESTORE:-0}" != 1 ]; then
  if ! move_old_database; then
    # MongoDB stays up, never ready: the health check fails and the app waits,
    # while a person decides (staging runbook §12.6).
    log "Not ready: the site database needs a decision (staging runbook §12.6). The app waits."
    wait "$mongod_pid" || true
    exit 1
  fi
  ensure_app_user
fi
ensure_pbm_user
# The certificate MongoDB loaded at this start, for deploy.sh (setup.sh).
cp "$TLS/serial" /tmp/wms-tls-serial 2> /dev/null || true
touch "$READY"
if [ "${WMS_RESTORE:-0}" = 1 ]; then
  log "MongoDB ready for a restore (cache ${CACHE_GB} GB); no app user"
else
  log "MongoDB ready (cache ${CACHE_GB} GB)"
fi

wait "$mongod_pid" || true
log "MongoDB stopped; stopping the container"
exit 1
