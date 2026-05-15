-- =============================================================================
-- Migration 004: Feature Flags
-- =============================================================================
-- Admin steuert ueber diese Tabelle, welche Sidebar-Eintraege (und bei Bedarf
-- spaeter weitere Features) fuer alle eingeloggten User sichtbar sind.
-- Lesen ist fuer alle Authenticated erlaubt, Schreiben nur fuer Admins.
-- =============================================================================

create table if not exists public.feature_flags (
  key         text primary key,
  enabled     boolean not null default false,
  label       text not null,           -- menschenlesbarer Anzeigename fuer Admin-UI
  description text,                    -- optionaler Hilfetext
  updated_at  timestamptz not null default now(),
  updated_by  uuid references public.profiles(id)
);

alter table public.feature_flags enable row level security;

create policy "Flags sind fuer alle Eingeloggten sichtbar"
  on public.feature_flags for select
  to authenticated
  using (true);

create policy "Admins koennen Flags aendern"
  on public.feature_flags for update
  to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Admins koennen Flags anlegen"
  on public.feature_flags for insert
  to authenticated
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- Seed-Daten
insert into public.feature_flags (key, enabled, label, description) values
  ('nav_leaderboard', false, 'Leaderboard',     'Sidebar-Eintrag fuer die Bestenliste'),
  ('nav_analyse',     false, 'Analyse',         'Sidebar-Eintrag fuer Analysen und Charts'),
  ('nav_routinen',    true,  'Fokus-Routinen',  'Sidebar-Eintrag fuer Fokus-Routinen')
on conflict (key) do nothing;
