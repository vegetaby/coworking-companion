#!/usr/bin/env bash
set -euo pipefail

# Aktiviert den Email/Passwort Provider in Supabase via Management API.
#
# Voraussetzung: SUPABASE_ACCESS_TOKEN als ENV-Variable.
#   Token erstellen: https://supabase.com/dashboard/account/tokens
#
# Aufruf:
#   SUPABASE_ACCESS_TOKEN=sbp_xxx ./scripts/enable-email-provider.sh

PROJECT_REF="${PROJECT_REF:-lfujrpzaenfptyehcwwd}"

if [[ -z "${SUPABASE_ACCESS_TOKEN:-}" ]]; then
  echo "FEHLER: SUPABASE_ACCESS_TOKEN ist nicht gesetzt." >&2
  echo "Token erstellen: https://supabase.com/dashboard/account/tokens" >&2
  exit 1
fi

API="https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth"

echo ">> Aktueller Auth-Config Status:"
curl -fsSL -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" "${API}" \
  | python3 -c 'import json,sys;d=json.load(sys.stdin);print(json.dumps({k:d.get(k) for k in ["external_email_enabled","mailer_autoconfirm","disable_signup","site_url"]},indent=2))'

echo
echo ">> Aktiviere Email-Provider..."
curl -fsSL -X PATCH "${API}" \
  -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "external_email_enabled": true,
    "mailer_autoconfirm": false,
    "disable_signup": false
  }' \
  | python3 -c 'import json,sys;d=json.load(sys.stdin);print(json.dumps({k:d.get(k) for k in ["external_email_enabled","mailer_autoconfirm","disable_signup"]},indent=2))'

echo
echo ">> Fertig. Email-Provider ist aktiv."
