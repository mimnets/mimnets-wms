#!/bin/bash
# The pbm service (m1-068): pbm-agent for the mongo service, as the pbm user.
# It is the container's only process, so Docker restarts it if it stops.
set -euo pipefail
. /usr/local/lib/wms/pbm-env.sh
echo "[wms] Starting pbm-agent"
exec pbm-agent
