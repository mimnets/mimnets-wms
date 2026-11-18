#!/bin/sh
# NPM mode (m1-062, D-DB-17 option B): renders the internal port 8080 server
# when WMS_UPSTREAM_PROXY_IP is set (compose.npm.yaml). Without it, the
# stack runs standalone and nothing is rendered. A failure here stops nginx
# from starting.
set -eu

[ -n "${WMS_UPSTREAM_PROXY_IP:-}" ] || exit 0

# One IPv4 address, never a range: real_ip must trust exactly one sender.
octet='(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])'
if [ "$(printf '%s\n' "$WMS_UPSTREAM_PROXY_IP" | wc -l)" -ne 1 ] \
  || ! printf '%s\n' "$WMS_UPSTREAM_PROXY_IP" | grep -Eqx "($octet\.){3}$octet"; then
  echo "[wms-npm] WMS_UPSTREAM_PROXY_IP must be one IPv4 address, got: $WMS_UPSTREAM_PROXY_IP" >&2
  exit 1
fi

envsubst '${WMS_DOMAIN} ${WMS_UPSTREAM_PROXY_IP} ${WMS_MAX_BODY} ${WMS_RATE_BURST}' \
  < /etc/nginx/wms-npm/wms-npm.conf.template \
  > /etc/nginx/conf.d/wms-npm.conf
echo "[wms-npm] NPM mode: port 8080, X-Real-IP trusted from $WMS_UPSTREAM_PROXY_IP only"
