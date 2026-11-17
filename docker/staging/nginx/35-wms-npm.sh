#!/bin/sh
# NPM mode (m1-062, D-DB-17 option B): renders the internal port 8080 server
# when ASSURER_UPSTREAM_PROXY_IP is set (compose.npm.yaml). Without it, the
# stack runs standalone and nothing is rendered. A failure here stops nginx
# from starting.
set -eu

[ -n "${ASSURER_UPSTREAM_PROXY_IP:-}" ] || exit 0

# One IPv4 address, never a range: real_ip must trust exactly one sender.
octet='(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])'
if [ "$(printf '%s\n' "$ASSURER_UPSTREAM_PROXY_IP" | wc -l)" -ne 1 ] \
  || ! printf '%s\n' "$ASSURER_UPSTREAM_PROXY_IP" | grep -Eqx "($octet\.){3}$octet"; then
  echo "[wms-npm] ASSURER_UPSTREAM_PROXY_IP must be one IPv4 address, got: $ASSURER_UPSTREAM_PROXY_IP" >&2
  exit 1
fi

envsubst '${ASSURER_DOMAIN} ${ASSURER_UPSTREAM_PROXY_IP} ${ASSURER_MAX_BODY} ${ASSURER_RATE_BURST}' \
  < /etc/nginx/wms-npm/wms-npm.conf.template \
  > /etc/nginx/conf.d/wms-npm.conf
echo "[wms-npm] NPM mode: port 8080, X-Real-IP trusted from $ASSURER_UPSTREAM_PROXY_IP only"
