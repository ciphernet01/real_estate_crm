#!/usr/bin/env bash
set -euo pipefail

API_BASE="${API_BASE:-http://localhost:4000/api}"
EMAIL="${EMAIL:-admin@crm.local}"
PASSWORD="${PASSWORD:-Admin@123}"

echo "Running CRM UAT smoke checks against ${API_BASE}"

assert_ok() {
  local label="$1"
  local condition="$2"
  if [[ "$condition" != "true" ]]; then
    echo "FAILED: ${label}"
    exit 1
  fi
  echo "PASS: ${label}"
}

health_json="$(curl -fsS "${API_BASE}/health")"
health_ok="$(python3 -c 'import json,sys; print("true" if json.loads(sys.argv[1]).get("ok") else "false")' "$health_json")"
assert_ok "Health endpoint" "$health_ok"

deep_json="$(curl -fsS "${API_BASE}/health/deep")"
deep_ok="$(python3 -c 'import json,sys; print("true" if json.loads(sys.argv[1]).get("ok") else "false")' "$deep_json")"
assert_ok "Deep health endpoint" "$deep_ok"

login_json="$(curl -fsS -X POST "${API_BASE}/auth/login" -H "Content-Type: application/json" -d "{\"email\":\"${EMAIL}\",\"password\":\"${PASSWORD}\"}")"
token="$(python3 -c 'import json,sys; print(json.loads(sys.argv[1]).get("token",""))' "$login_json")"
if [[ -z "$token" ]]; then
  echo "FAILED: Login token"
  exit 1
fi
echo "PASS: Login token"

auth_header=( -H "Authorization: Bearer ${token}" )

check_data() {
  local label="$1"
  local endpoint="$2"
  local json
  json="$(curl -fsS "${API_BASE}${endpoint}" "${auth_header[@]}")"
  local has_data
  has_data="$(python3 -c 'import json,sys; print("true" if "data" in json.loads(sys.argv[1]) else "false")' "$json")"
  assert_ok "$label" "$has_data"
}

check_data "Reports overview" "/reports/overview"
check_data "Integration status" "/integrations/status"
check_data "Leads list" "/leads"
check_data "Properties list" "/properties"
check_data "Clients list" "/clients"
check_data "Deals list" "/deals"
check_data "Pending notifications" "/communications/notifications/pending?windowHours=24"

echo "All smoke checks passed."
