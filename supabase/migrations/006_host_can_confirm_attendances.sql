-- =============================================================================
-- Migration 006: Hosts duerfen Anwesenheiten ihrer Sessions verwalten
-- =============================================================================
-- Wird gebraucht damit das "Host bestaetigt Anwesenheit beim Check-Out"-Feature
-- funktioniert: der Host updated attendance-Rows von ANDEREN Usern.
-- Die bestehenden RLS-Policies erlaubten nur "eigene Rows aendern".
--
-- Plus: synchronisierte Sessions (von Google Cal) haben aktuell host_id=null,
-- weil der Sync nur host_name setzt. Wir versuchen host_id zu setzen wo der
-- Vorname / Display-Name passt.
-- =============================================================================

-- 1. Versuche host_id fuer synchronisierte Sessions zu setzen
--    Match: profile.display_name ist gleich host_name ODER beginnt mit host_name + " "
update public.sessions s
set host_id = p.id
from public.profiles p
where s.host_id is null
  and (
    lower(trim(p.display_name)) = lower(trim(s.host_name))
    or lower(p.display_name) like lower(trim(s.host_name)) || ' %'
  );

-- 2. RLS-Policy: Hosts duerfen Anwesenheiten fuer Sessions verwalten,
--    die sie selbst hosten (host_id = auth.uid())

create policy "Hosts koennen Anwesenheiten ihrer Sessions eintragen"
  on public.attendances for insert
  with check (
    exists (
      select 1 from public.sessions
      where sessions.id = attendances.session_id
        and sessions.host_id = auth.uid()
    )
  );

create policy "Hosts koennen Anwesenheiten ihrer Sessions aktualisieren"
  on public.attendances for update
  using (
    exists (
      select 1 from public.sessions
      where sessions.id = attendances.session_id
        and sessions.host_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.sessions
      where sessions.id = attendances.session_id
        and sessions.host_id = auth.uid()
    )
  );

-- 3. RLS-Policy: Admins duerfen alle Anwesenheiten verwalten
--    (Fallback fuer Sessions wo der Sync-Match nicht greift)

create policy "Admins koennen alle Anwesenheiten eintragen"
  on public.attendances for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins koennen alle Anwesenheiten aktualisieren"
  on public.attendances for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );
