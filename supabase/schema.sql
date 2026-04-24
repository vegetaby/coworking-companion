-- =============================================================================
-- CoWorking Space Companion -- Supabase Datenbankschema
-- =============================================================================
-- Dieses Schema definiert alle Tabellen, Sicherheitsrichtlinien (RLS),
-- Indizes und Trigger fuer die CoWorking-Space-Companion-App.
-- Zielgruppe: Deutsche Skool-Community fuer gemeinsame Fokus-Sessions.
-- =============================================================================

-- Erweiterungen aktivieren
create extension if not exists "uuid-ossp";

-- =============================================================================
-- 1. PROFILES -- Erweitert die Supabase auth.users Tabelle
-- =============================================================================
-- Jeder Nutzer erhaelt automatisch ein Profil bei der Registrierung.
-- Rollen: 'member' (Standard), 'host' (kann Sessions erstellen), 'admin'.

create table public.profiles (
  id            uuid        primary key references auth.users (id) on delete cascade,
  display_name  text,
  avatar_url    text,
  role          text        not null default 'member'
                            check (role in ('member', 'host', 'admin')),
  streak        integer     not null default 0,
  total_sessions integer    not null default 0,
  member_since  timestamptz not null default now(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table  public.profiles is 'Nutzerprofile -- erweitert auth.users um App-spezifische Felder';
comment on column public.profiles.role is 'Rolle des Nutzers: member, host oder admin';
comment on column public.profiles.streak is 'Aktuelle Streak (aufeinanderfolgende Teilnahmen)';
comment on column public.profiles.total_sessions is 'Gesamtanzahl besuchter Sessions';

-- =============================================================================
-- 2. SESSIONS -- CoWorking Fokus-Sessions
-- =============================================================================
-- Eine Session ist ein geplanter Fokus-Zeitraum (z.B. "2h Focus Session").

create table public.sessions (
  id             uuid        primary key default uuid_generate_v4(),
  title          text        not null,
  date           date        not null,
  start_time     time        not null,
  end_time       time        not null,
  host_id        uuid        not null references public.profiles (id) on delete cascade,
  host_name      text,
  status         text        not null default 'scheduled'
                             check (status in ('scheduled', 'live', 'past', 'cancelled')),
  zoom_link      text,
  max_attendees  integer     not null default 20,
  created_at     timestamptz not null default now()
);

comment on table  public.sessions is 'Geplante CoWorking Fokus-Sessions';
comment on column public.sessions.status is 'Status: scheduled, live, past oder cancelled';
comment on column public.sessions.zoom_link is 'Einladungslink fuer die Video-Konferenz';
comment on column public.sessions.max_attendees is 'Maximale Teilnehmerzahl (Standard: 20)';

-- =============================================================================
-- 3. SESSION_SIGNUPS -- Anmeldungen zu Sessions
-- =============================================================================
-- Speichert, welcher Nutzer sich fuer welche Session angemeldet hat.

create table public.session_signups (
  id            uuid        primary key default uuid_generate_v4(),
  session_id    uuid        not null references public.sessions (id) on delete cascade,
  user_id       uuid        not null references public.profiles (id) on delete cascade,
  signed_up_at  timestamptz not null default now(),

  unique (session_id, user_id)
);

comment on table public.session_signups is 'Anmeldungen: welcher Nutzer nimmt an welcher Session teil';

-- =============================================================================
-- 4. ATTENDANCES -- Teilnahme mit Check-in/Check-out Daten
-- =============================================================================
-- Wird beim Check-in erstellt und beim Check-out vervollstaendigt.
-- Enthaelt Ziele (vorher/nachher), Bewertung und Routinen-Status.

create table public.attendances (
  id              uuid        primary key default uuid_generate_v4(),
  session_id      uuid        not null references public.sessions (id) on delete cascade,
  user_id         uuid        not null references public.profiles (id) on delete cascade,
  goal_before     text,
  goal_after      text,
  rating          integer     check (rating >= 1 and rating <= 5),
  checked_in_at   timestamptz,
  checked_out_at  timestamptz,
  routine_states  jsonb       not null default '{}'::jsonb
);

comment on table  public.attendances is 'Teilnahme-Protokoll mit Check-in/Check-out und Zielen';
comment on column public.attendances.goal_before is 'Ziel das beim Check-in gesetzt wird';
comment on column public.attendances.goal_after is 'Reflexion/Ergebnis beim Check-out';
comment on column public.attendances.rating is 'Bewertung der Session (1-5 Sterne)';
comment on column public.attendances.routine_states is 'JSON mit Routinen-Status, z.B. {"Handy auf Flugmodus": true, "Wasser bereitstellen": false}';

-- =============================================================================
-- 5. ROUTINES -- Persoenliche Fokus-Routinen mit zeitlicher Verfolgung
-- =============================================================================
-- Jeder Nutzer kann eigene Routinen definieren, die vor einer Session
-- abgehakt werden koennen. Routinen koennen aktiviert/deaktiviert werden.

create table public.routines (
  id            uuid        primary key default uuid_generate_v4(),
  user_id       uuid        not null references public.profiles (id) on delete cascade,
  label         text        not null,
  active        boolean     not null default true,
  active_since  date        not null default current_date,
  active_until  date,
  sort_order    integer     not null default 0,
  created_at    timestamptz not null default now()
);

comment on table  public.routines is 'Persoenliche Fokus-Routinen pro Nutzer';
comment on column public.routines.label is 'Bezeichnung der Routine, z.B. "Handy auf Flugmodus"';
comment on column public.routines.active_until is 'NULL = Routine ist noch aktiv';
comment on column public.routines.sort_order is 'Reihenfolge in der Anzeige';

-- =============================================================================
-- 6. LEADERBOARD_CACHE -- Materialisierter Cache fuer Bestenliste
-- =============================================================================
-- Wird periodisch aktualisiert (z.B. per Cron/Edge-Function).
-- Vermeidet teure Live-Abfragen auf der Bestenliste.

create table public.leaderboard_cache (
  user_id         uuid        not null references public.profiles (id) on delete cascade,
  period          text        not null check (period in ('7d', '30d', 'allzeit')),
  sessions_count  integer     not null default 0,
  current_streak  integer     not null default 0,
  trend           text        not null default 'new'
                              check (trend in ('up', 'down', 'same', 'new')),
  rank            integer     not null default 0,
  updated_at      timestamptz not null default now(),

  primary key (user_id, period)
);

comment on table  public.leaderboard_cache is 'Zwischengespeicherte Bestenliste -- wird periodisch neu berechnet';
comment on column public.leaderboard_cache.period is 'Zeitraum: 7d, 30d oder allzeit';
comment on column public.leaderboard_cache.trend is 'Tendenz seit letzter Berechnung: up, down, same oder new';

-- =============================================================================
-- INDIZES -- Fuer haeufig abgefragte Spalten
-- =============================================================================

-- Sessions: Abfragen nach Datum und Status sind am haeufigsten
create index idx_sessions_date        on public.sessions (date);
create index idx_sessions_status      on public.sessions (status);
create index idx_sessions_host_id     on public.sessions (host_id);
create index idx_sessions_date_status on public.sessions (date, status);

-- Anmeldungen: Abfragen pro Session und pro Nutzer
create index idx_signups_session_id on public.session_signups (session_id);
create index idx_signups_user_id    on public.session_signups (user_id);

-- Teilnahmen: Abfragen pro Session und pro Nutzer
create index idx_attendances_session_id on public.attendances (session_id);
create index idx_attendances_user_id    on public.attendances (user_id);

-- Routinen: Aktive Routinen eines Nutzers
create index idx_routines_user_id    on public.routines (user_id);
create index idx_routines_active     on public.routines (user_id, active) where active = true;

-- Bestenliste: Nach Zeitraum und Rang sortiert
create index idx_leaderboard_period  on public.leaderboard_cache (period, rank);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) -- Sicherheitsrichtlinien
-- =============================================================================

-- RLS fuer alle Tabellen aktivieren
alter table public.profiles         enable row level security;
alter table public.sessions          enable row level security;
alter table public.session_signups   enable row level security;
alter table public.attendances       enable row level security;
alter table public.routines          enable row level security;
alter table public.leaderboard_cache enable row level security;

-- -------------------------------------------------------------------------
-- PROFILES: Jeder kann Profile lesen, nur eigenes Profil bearbeiten
-- -------------------------------------------------------------------------

create policy "Profile sind fuer alle sichtbar"
  on public.profiles for select
  using (true);

create policy "Nutzer koennen eigenes Profil aktualisieren"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Profil-Insert wird ueber den Trigger gesteuert (siehe unten)
create policy "Nutzer koennen eigenes Profil erstellen"
  on public.profiles for insert
  with check (auth.uid() = id);

-- -------------------------------------------------------------------------
-- SESSIONS: Alle koennen lesen, nur Hosts/Admins koennen verwalten
-- -------------------------------------------------------------------------

create policy "Sessions sind fuer alle sichtbar"
  on public.sessions for select
  using (true);

create policy "Hosts koennen eigene Sessions erstellen"
  on public.sessions for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role in ('host', 'admin')
    )
  );

create policy "Hosts koennen eigene Sessions bearbeiten"
  on public.sessions for update
  using (
    host_id = auth.uid()
    or exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role = 'admin'
    )
  );

create policy "Hosts koennen eigene Sessions loeschen"
  on public.sessions for delete
  using (
    host_id = auth.uid()
    or exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role = 'admin'
    )
  );

-- -------------------------------------------------------------------------
-- SESSION_SIGNUPS: Nutzer sehen alle Anmeldungen, verwalten nur eigene
-- -------------------------------------------------------------------------

create policy "Anmeldungen sind fuer alle sichtbar"
  on public.session_signups for select
  using (true);

create policy "Nutzer koennen sich selbst anmelden"
  on public.session_signups for insert
  with check (auth.uid() = user_id);

create policy "Nutzer koennen eigene Anmeldung zurueckziehen"
  on public.session_signups for delete
  using (auth.uid() = user_id);

-- -------------------------------------------------------------------------
-- ATTENDANCES: Nutzer sehen alle Teilnahmen, bearbeiten nur eigene
-- -------------------------------------------------------------------------

create policy "Teilnahmen sind fuer alle sichtbar"
  on public.attendances for select
  using (true);

create policy "Nutzer koennen eigene Teilnahme erstellen"
  on public.attendances for insert
  with check (auth.uid() = user_id);

create policy "Nutzer koennen eigene Teilnahme aktualisieren"
  on public.attendances for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- -------------------------------------------------------------------------
-- ROUTINES: Nur eigene Routinen sichtbar und verwaltbar
-- -------------------------------------------------------------------------

create policy "Nutzer sehen nur eigene Routinen"
  on public.routines for select
  using (auth.uid() = user_id);

create policy "Nutzer koennen eigene Routinen erstellen"
  on public.routines for insert
  with check (auth.uid() = user_id);

create policy "Nutzer koennen eigene Routinen bearbeiten"
  on public.routines for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Nutzer koennen eigene Routinen loeschen"
  on public.routines for delete
  using (auth.uid() = user_id);

-- -------------------------------------------------------------------------
-- LEADERBOARD_CACHE: Fuer alle lesbar, nur Service-Role kann schreiben
-- -------------------------------------------------------------------------

create policy "Bestenliste ist fuer alle sichtbar"
  on public.leaderboard_cache for select
  using (true);

-- Schreibzugriff erfolgt nur ueber Service-Role (Edge Functions / Cron).
-- Kein INSERT/UPDATE/DELETE Policy fuer authentifizierte Nutzer noetig.

-- =============================================================================
-- TRIGGER: Automatische Profilerstellung bei Registrierung
-- =============================================================================
-- Wenn sich ein neuer Nutzer ueber Supabase Auth registriert, wird
-- automatisch ein Eintrag in der profiles-Tabelle angelegt.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', '')
  );
  return new;
end;
$$;

comment on function public.handle_new_user() is 'Erstellt automatisch ein Profil wenn ein neuer Nutzer sich registriert';

-- Trigger auf auth.users -- wird bei jeder neuen Registrierung ausgeloest
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- =============================================================================
-- TRIGGER: updated_at automatisch aktualisieren
-- =============================================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

comment on function public.set_updated_at() is 'Setzt updated_at auf den aktuellen Zeitstempel bei jeder Aenderung';

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();
