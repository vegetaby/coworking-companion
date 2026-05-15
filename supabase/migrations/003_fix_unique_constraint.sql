-- =============================================================================
-- Migration 003: Fix google_event_id unique constraint
-- =============================================================================
-- Die partial-unique-index aus 002 wird von Supabase-Client beim ON CONFLICT
-- nicht erkannt. Daher ersetzen wir sie durch eine echte UNIQUE-Constraint
-- (NULL-Werte sind in Postgres-UNIQUE ohnehin erlaubt, also kein Problem
-- fuer manuell angelegte Sessions ohne google_event_id).
-- =============================================================================

drop index if exists public.idx_sessions_google_event_id;

alter table public.sessions
  drop constraint if exists sessions_google_event_id_key;

alter table public.sessions
  add constraint sessions_google_event_id_key unique (google_event_id);
