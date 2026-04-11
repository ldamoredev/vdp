#!/usr/bin/env bash

set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:4000}"
PASSWORD="${PASSWORD:-12345678}"
EMAIL="${EMAIL:-streama.$(date +%s)@example.com}"
DISPLAY_NAME="${DISPLAY_NAME:-Stream A Smoke}"
ACCOUNT_NAME="${ACCOUNT_NAME:-Smoke Cash ARS}"
CATEGORY_NAME="${CATEGORY_NAME:-Delivery Smoke}"
SESSION_TOKEN=""

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

iso_days_ago() {
  local days="$1"

  if date -v-"${days}"d +%F >/dev/null 2>&1; then
    date -v-"${days}"d +%F
  else
    date -d "${days} days ago" +%F
  fi
}

post_public_json() {
  local url="$1"
  local payload="$2"

  curl -fsS \
    -H 'content-type: application/json' \
    -d "$payload" \
    "$url"
}

post_json() {
  local url="$1"
  local payload="$2"

  if [[ -z "$SESSION_TOKEN" ]]; then
    echo "SESSION_TOKEN is not set" >&2
    exit 1
  fi

  curl -fsS \
    -H "x-session-token: $SESSION_TOKEN" \
    -H 'content-type: application/json' \
    -d "$payload" \
    "$url"
}

stream_chat() {
  local url="$1"
  local payload="$2"
  local outfile="$3"

  if [[ -z "$SESSION_TOKEN" ]]; then
    echo "SESSION_TOKEN is not set" >&2
    exit 1
  fi

  curl -fsS -N \
    -H "x-session-token: $SESSION_TOKEN" \
    -H 'content-type: application/json' \
    -d "$payload" \
    "$url" > "$outfile"
}

require_command curl
require_command jq

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

WALLET_ANOMALY_OUT="$TMP_DIR/wallet-anomaly.sse"
WALLET_TRENDS_OUT="$TMP_DIR/wallet-trends.sse"
TASKS_CONTEXT_OUT="$TMP_DIR/tasks-context.sse"
WALLET_CONTEXT_OUT="$TMP_DIR/wallet-context.sse"
INSIGHTS_OUT="$TMP_DIR/insights.sse"

TODAY="$(date +%F)"
DATE_1="$(iso_days_ago 28)"
DATE_2="$(iso_days_ago 21)"
DATE_3="$(iso_days_ago 14)"
DATE_4="$(iso_days_ago 7)"

echo "==> Registering smoke-test user: $EMAIL"
post_public_json "$BASE_URL/api/auth/register" "$(jq -nc \
  --arg email "$EMAIL" \
  --arg displayName "$DISPLAY_NAME" \
  --arg password "$PASSWORD" \
  '{email: $email, displayName: $displayName, password: $password}')" >/dev/null

echo "==> Logging in"
LOGIN_RESPONSE="$(
  post_public_json "$BASE_URL/api/auth/login" "$(jq -nc \
    --arg email "$EMAIL" \
    --arg password "$PASSWORD" \
    '{email: $email, password: $password}')"
)"
SESSION_TOKEN="$(echo "$LOGIN_RESPONSE" | jq -r '.sessionToken')"

if [[ -z "$SESSION_TOKEN" || "$SESSION_TOKEN" == "null" ]]; then
  echo "Login did not return a sessionToken" >&2
  echo "$LOGIN_RESPONSE" | jq . >&2
  exit 1
fi

echo "==> Creating wallet account"
ACCOUNT_ID="$(
  post_json "$BASE_URL/api/v1/wallet/accounts" "$(jq -nc \
    --arg name "$ACCOUNT_NAME" \
    '{name: $name, currency: "ARS", type: "cash", initialBalance: "50000"}')" \
    | jq -r '.id'
)"

echo "==> Creating expense category"
CATEGORY_ID="$(
  post_json "$BASE_URL/api/v1/wallet/categories" "$(jq -nc \
    --arg name "$CATEGORY_NAME" \
    '{name: $name, type: "expense", icon: "fork-knife"}')" \
    | jq -r '.id'
)"

echo "==> Creating tasks for cross-domain context"
post_json "$BASE_URL/api/v1/tasks" '{"title":"Pagar tarjeta","priority":2,"domain":"wallet"}' >/dev/null
post_json "$BASE_URL/api/v1/tasks" '{"title":"Revisar presupuesto del mes","priority":2,"domain":"wallet"}' >/dev/null
post_json "$BASE_URL/api/v1/tasks" '{"title":"Llamar al banco","priority":2}' >/dev/null

echo "==> Seeding four weekly baseline transactions"
for tx_date in "$DATE_1" "$DATE_2" "$DATE_3" "$DATE_4"; do
  post_json "$BASE_URL/api/v1/wallet/transactions" "$(jq -nc \
    --arg accountId "$ACCOUNT_ID" \
    --arg categoryId "$CATEGORY_ID" \
    --arg date "$tx_date" \
    '{
      accountId: $accountId,
      categoryId: $categoryId,
      type: "expense",
      amount: "1000",
      currency: "ARS",
      description: "Delivery baseline",
      date: $date,
      tags: []
    }')" >/dev/null
done

echo "==> Subscribing to insights SSE"
curl -fsS -N \
  -H "x-session-token: $SESSION_TOKEN" \
  "$BASE_URL/api/v1/tasks/insights/stream" > "$INSIGHTS_OUT" &
INSIGHTS_PID=$!
trap 'kill "$INSIGHTS_PID" >/dev/null 2>&1 || true; rm -rf "$TMP_DIR"' EXIT
sleep 1

echo "==> Creating current-week spike transaction"
SPIKE_RESPONSE="$(
  post_json "$BASE_URL/api/v1/wallet/transactions" "$(jq -nc \
    --arg accountId "$ACCOUNT_ID" \
    --arg categoryId "$CATEGORY_ID" \
    --arg date "$TODAY" \
    '{
      accountId: $accountId,
      categoryId: $categoryId,
      type: "expense",
      amount: "3000",
      currency: "ARS",
      description: "Delivery spike",
      date: $date,
      tags: []
    }')"
)"
echo "$SPIKE_RESPONSE" | jq '{id, amount, date, categoryId}'

sleep 2
kill "$INSIGHTS_PID" >/dev/null 2>&1 || true

echo "==> Verifying wallet insight SSE event"
grep -q 'wallet-insight' "$INSIGHTS_OUT"

echo "==> Asking wallet agent about anomalies"
stream_chat "$BASE_URL/api/v1/wallet/agent/chat" \
  '{"message":"Hay algun gasto raro esta semana?"}' \
  "$WALLET_ANOMALY_OUT"
grep -q 'get_spending_anomalies' "$WALLET_ANOMALY_OUT"

echo "==> Asking wallet agent about trends"
stream_chat "$BASE_URL/api/v1/wallet/agent/chat" \
  '{"message":"Como viene delivery contra mis semanas anteriores?"}' \
  "$WALLET_TRENDS_OUT"
grep -q 'get_category_trends' "$WALLET_TRENDS_OUT"

echo "==> Asking tasks agent to use wallet context"
stream_chat "$BASE_URL/api/v1/tasks/agent/chat" \
  '{"message":"Con lo que gaste hoy, que deberia priorizar?"}' \
  "$TASKS_CONTEXT_OUT"
grep -q 'get_wallet_context' "$TASKS_CONTEXT_OUT"

echo "==> Asking wallet agent to use tasks context"
stream_chat "$BASE_URL/api/v1/wallet/agent/chat" \
  '{"message":"Ves alguna relacion entre mis gastos y mis tareas pendientes?"}' \
  "$WALLET_CONTEXT_OUT"
grep -q 'get_tasks_context' "$WALLET_CONTEXT_OUT"

echo
echo "Stream A smoke test passed."
echo "User: $EMAIL"
echo "Dates used: $DATE_1, $DATE_2, $DATE_3, $DATE_4, $TODAY"
echo "Artifacts:"
echo "  $INSIGHTS_OUT"
echo "  $WALLET_ANOMALY_OUT"
echo "  $WALLET_TRENDS_OUT"
echo "  $TASKS_CONTEXT_OUT"
echo "  $WALLET_CONTEXT_OUT"
