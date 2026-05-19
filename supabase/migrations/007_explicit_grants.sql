-- =============================================================================
-- Migration 007: Explicit Grants fuer Data API (PostgREST + supabase-js)
-- =============================================================================
-- Kontext: Ab 30. Oktober 2026 setzt Supabase fuer alle Projekte keine
-- automatischen Tabellen-Grants mehr fuer die Rollen anon/authenticated/
-- service_role. Bestehende Grants bleiben unveraendert, aber wir machen
-- sie hier explizit, damit
--   1) der Code-Review nachvollziehbar ist (was kann welche Rolle?),
--   2) ein Re-Setup auf einem neuen Projekt (z. B. Staging) auch nach
--      Oktober ohne Aufwand laeuft,
--   3) wir ein klares Pattern fuer zukuenftige Tabellen haben.
--
-- Wichtig: RLS-Policies (Row Level Security) bleiben die eigentliche
-- Schutzgrenze. Die GRANTs hier sagen nur "darf die Rolle ueberhaupt
-- Anfragen an die Tabelle stellen". Die Policies entscheiden dann
-- zeilenweise, welche Zeilen sie zurueckgegeben/aendern darf.
--
-- Idempotent: GRANT-Statements koennen mehrfach ausgefuehrt werden,
-- Postgres ignoriert Duplikate.
-- =============================================================================

-- 1. Schema-Usage --------------------------------------------------------------
-- Damit Rollen Tabellen im public-Schema "sehen" duerfen.
grant usage on schema public to anon, authenticated, service_role;

-- 2. Lese-Tabellen (oeffentlich sichtbar dank RLS-Policies "fuer alle") --------
-- profiles, sessions, session_signups, attendances, leaderboard_cache:
-- via RLS-Policy "fuer alle sichtbar" -> anon darf SELECT
grant select on public.profiles            to anon, authenticated;
grant select on public.sessions            to anon, authenticated;
grant select on public.session_signups     to anon, authenticated;
grant select on public.attendances         to anon, authenticated;
grant select on public.leaderboard_cache   to anon, authenticated;

-- 3. Schreib-Tabellen fuer eingeloggte User ------------------------------------
-- INSERT/UPDATE/DELETE werden durch RLS gefiltert (Nutzer betrifft nur eigene
-- Zeilen). authenticated braucht volle DML-Rechte; RLS schraenkt dann ein.
grant insert, update, delete on public.profiles        to authenticated;
grant insert, update         on public.sessions        to authenticated; -- delete: nur Hosts via RLS
grant insert, delete         on public.session_signups to authenticated; -- update macht semantisch keinen Sinn
grant insert, update         on public.attendances     to authenticated;

-- 4. Eigene Daten der User (Routinen) ------------------------------------------
grant select, insert, update, delete on public.routines to authenticated;

-- 5. Admin-Only-Tabellen (Feature-Flags) ---------------------------------------
-- authenticated darf SELECT (Sichtbarkeit der UI),
-- write nur ueber Admins via RLS-Policies aus Migration 004.
grant select               on public.feature_flags to authenticated;
grant insert, update       on public.feature_flags to authenticated; -- RLS filtert auf is_admin()

-- 6. service_role bekommt vollen Zugriff auf alle Tabellen ---------------------
-- (fuer Edge Functions, Backups, Admin-Skripte)
grant select, insert, update, delete on public.profiles          to service_role;
grant select, insert, update, delete on public.sessions          to service_role;
grant select, insert, update, delete on public.session_signups   to service_role;
grant select, insert, update, delete on public.attendances       to service_role;
grant select, insert, update, delete on public.routines          to service_role;
grant select, insert, update, delete on public.leaderboard_cache to service_role;
grant select, insert, update, delete on public.feature_flags     to service_role;

-- 7. Sequences (auto-increment fuer bigserial-Tabellen) ------------------------
-- Falls eine Tabelle auto-id nutzt, braucht der Insertierende USAGE auf der
-- Sequence. Schadet nicht, das pauschal zu setzen.
grant usage, select on all sequences in schema public to authenticated, service_role;

-- 8. Default-Privileges fuer NEUE Tabellen -------------------------------------
-- Damit wir ab jetzt nicht jede neue Tabelle einzeln GRANTen muessen,
-- definieren wir Default-Privileges fuer alles was die postgres-Rolle
-- ab jetzt im public-Schema anlegt.
-- ACHTUNG: ALTER DEFAULT PRIVILEGES wirkt nur fuer Tabellen die NACH dieser
-- Migration erstellt werden, nicht rueckwirkend. Deshalb oben die expliziten
-- Grants fuer die schon bestehenden Tabellen.
alter default privileges in schema public
  grant select on tables to anon;

alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;

alter default privileges in schema public
  grant select, insert, update, delete on tables to service_role;

alter default privileges in schema public
  grant usage, select on sequences to authenticated, service_role;

-- =============================================================================
-- Verifikation (optional, nicht beim Migrate ausgefuehrt):
-- =============================================================================
-- select table_name, grantee, privilege_type
--   from information_schema.role_table_grants
--   where table_schema = 'public'
--   order by table_name, grantee;
-- =============================================================================
