-- =============================================================================
-- Seed-Daten + kleine Schema-Ergaenzung
-- =============================================================================
-- Einmalig im Supabase-Dashboard unter "SQL Editor" ausfuehren.
-- Macht Marcel zum Admin, fuegt Beispiel-Sessions ein und meldet ihn fuer
-- 2 davon an, damit "Meine Sessions" sofort etwas anzeigt.
-- =============================================================================

-- Marcel zum Admin machen
update public.profiles
set role = 'admin'
where id = '535675aa-76aa-4140-ad8b-97c6d9a6e2ff';

-- Eindeutigkeit fuer Attendances pro (User, Session) -- damit upsert
-- "Goal setzen" / "Check-in" idempotent ist.
alter table public.attendances
  drop constraint if exists attendances_user_session_unique,
  add  constraint attendances_user_session_unique unique (user_id, session_id);

-- Beispiel-Sessions: vergangen, live, geplant
insert into public.sessions (title, date, start_time, end_time, host_id, host_name, status, zoom_link, max_attendees)
values
  ('1h Focus Session', current_date - 1, '06:00', '07:00', '535675aa-76aa-4140-ad8b-97c6d9a6e2ff', 'Marcel', 'past',      'https://zoom.us/j/coworking', 20),
  ('2h Focus Session', current_date,     '10:00', '12:00', '535675aa-76aa-4140-ad8b-97c6d9a6e2ff', 'Marcel', 'live',      'https://zoom.us/j/coworking', 20),
  ('2h Focus Session', current_date + 1, '14:00', '16:00', '535675aa-76aa-4140-ad8b-97c6d9a6e2ff', 'Marcel', 'scheduled', 'https://zoom.us/j/coworking', 20),
  ('1h Focus Session', current_date + 2, '09:00', '10:00', '535675aa-76aa-4140-ad8b-97c6d9a6e2ff', 'Marcel', 'scheduled', 'https://zoom.us/j/coworking', 20),
  ('2h Focus Session', current_date + 3, '10:00', '12:00', '535675aa-76aa-4140-ad8b-97c6d9a6e2ff', 'Marcel', 'scheduled', 'https://zoom.us/j/coworking', 20)
on conflict do nothing;

-- Marcel fuer die naechsten 2 Sessions anmelden
insert into public.session_signups (user_id, session_id)
select '535675aa-76aa-4140-ad8b-97c6d9a6e2ff', s.id
from public.sessions s
where s.date >= current_date
  and s.host_id = '535675aa-76aa-4140-ad8b-97c6d9a6e2ff'
order by s.date, s.start_time
limit 2
on conflict do nothing;

-- Eine vergangene Teilnahme mit Bewertung (zeigt sich in "Letzte Sessions")
insert into public.attendances (user_id, session_id, goal_before, goal_after, rating, checked_in_at, checked_out_at, routine_states)
select
  '535675aa-76aa-4140-ad8b-97c6d9a6e2ff',
  s.id,
  'Newsletter-Entwurf fertig',
  'Entwurf steht, Korrektur morgen',
  4,
  (s.date::timestamp + s.start_time),
  (s.date::timestamp + s.end_time),
  '{"Handy auf Flugmodus": true, "Wasser bereit": true, "Tabs schliessen": false}'::jsonb
from public.sessions s
where s.status = 'past'
limit 1
on conflict (user_id, session_id) do nothing;

-- Beispiel-Routinen
insert into public.routines (user_id, label, sort_order)
values
  ('535675aa-76aa-4140-ad8b-97c6d9a6e2ff', 'Handy auf Flugmodus', 0),
  ('535675aa-76aa-4140-ad8b-97c6d9a6e2ff', 'Wasser bereit', 1),
  ('535675aa-76aa-4140-ad8b-97c6d9a6e2ff', 'Tabs schliessen', 2),
  ('535675aa-76aa-4140-ad8b-97c6d9a6e2ff', 'Ziel notieren', 3)
on conflict do nothing;

-- Verifikation
select 'Sessions:'        as label, count(*) from public.sessions
union all select 'Signups:',          count(*) from public.session_signups
union all select 'Attendances:',      count(*) from public.attendances
union all select 'Routines:',         count(*) from public.routines
union all select 'Marcel ist Admin:', case when (select role from public.profiles where id = '535675aa-76aa-4140-ad8b-97c6d9a6e2ff') = 'admin' then 1 else 0 end;
