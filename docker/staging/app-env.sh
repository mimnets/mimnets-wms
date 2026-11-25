# Sourced by wms-app and wms-task (m1-068): the app's database address
# and session secret, from the read-only /secrets volume (app-secrets). They
# go through the environment, not the arguments.
APOS_DB_URI="mongodb://wmsApp:$(cat /secrets/mongo-password)@mongo:27017/wms?replicaSet=rs0&authSource=wms&tls=true&tlsCAFile=/secrets/ca.pem"
APOS_SESSION_SECRET="$(cat /secrets/session-secret)"
export APOS_DB_URI APOS_SESSION_SECRET
# AI-assisted design (m1-088, ADR-0005): optional. Without the file the
# feature stays off. The owner adds the key (staging runbook §6).
if [ -s /secrets/anthropic-key ]; then
  APOS_ANTHROPIC_KEY="$(cat /secrets/anthropic-key)"
  export APOS_ANTHROPIC_KEY
fi
