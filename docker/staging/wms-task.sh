#!/bin/bash
# Runs an Apostrophe task (`node app <task> …`) with the site's database and
# session secret, for docker exec into the app service (m1-067, m1-068):
#   docker compose … exec app wms-task assurer-wp-import:run
set -euo pipefail
if [ "$#" -eq 0 ]; then
  echo "Usage: wms-task <module>:<task> [options]   e.g. wms-task assurer-seo:seed-redirects" >&2
  exit 2
fi
. /usr/local/lib/wms/app-env.sh
cd /app
exec node app "$@"
