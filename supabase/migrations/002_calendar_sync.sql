-- =============================================================================
-- Migration 002: Calendar Sync + Streaks + Status-Automation
-- =============================================================================
-- Erweitert das initiale Schema um:
--   1. google_event_id Spalte fuer Sync-Anker
--   2. update_session_statuses() Function (scheduled -> live -> past)
--   3. get_user_streak() und get_slot_streaks() Functions
--   4. sessions_with_counts View
--   5. unique-Constraint auf attendances (user_id, session_id)
--
-- Idempotent: kann mehrfach ausgefuehrt werden.
-- =============================================================================

-- 1. google_event_id ------------------------------------------------------------

alter table public.sessions
  add column if not exists google_event_id text;

create unique index if not exists idx_sessions_google_event_id
  on public.sessions (google_event_id)
  where google_event_id is not null;

-- 2. Eindeutigkeit fuer attendances (1 Eintrag pro User+Session) ---------------

alter table public.attendances
  drop constraint if exists attendances_user_session_unique;

alter table public.attendances
  add constraint attendances_user_session_unique unique (user_id, session_id);

-- 3. update_session_statuses() -------------------------------------------------
-- Schaltet Sessions automatisch zwischen scheduled / live / past.
-- date + start_time / end_time sind in Europe/Berlin Lokalzeit gespeichert.

create or replace function public.update_session_statuses()
returns void
language plpgsql
security definer
as $$
begin
  -- scheduled -> live
  update public.sessions
  set status = 'live'
  where status = 'scheduled'
    and (date + start_time) at time zone 'Europe/Berlin' <= now()
    and (date + end_time)   at time zone 'Europe/Berlin' >  now();

  -- live -> past
  update public.sessions
  set status = 'past'
  where status = 'live'
    and (date + end_time) at time zone 'Europe/Berlin' <= now();
end;
$$;

comment on function public.update_session_statuses() is
  'Aktualisiert Session-Status basierend auf aktueller Uhrzeit. Wird nach jedem Sync aufgerufen.';

-- 4. get_user_streak() ---------------------------------------------------------
-- Liefert die Anzahl aufeinanderfolgender Wochen mit mindestens einem Check-In.

create or replace function public.get_user_streak(p_user_id uuid)
returns integer
language plpgsql
stable
as $$
declare
  streak         integer := 0;
  week_cursor    date := date_trunc('week', current_date)::date;
  has_attendance boolean;
begin
  loop
    select exists(
      select 1
      from public.attendances a
      join public.sessions s on s.id = a.session_id
      where a.user_id = p_user_id
        and a.checked_in_at is not null
        and s.date >= week_cursor
        and s.date <  week_cursor + interval '7 days'
    ) into has_attendance;

    exit when not has_attendance;
    streak      := streak + 1;
    week_cursor := week_cursor - interval '7 days';
  end loop;

  return streak;
end;
$$;

comment on function public.get_user_streak(uuid) is
  'Aufeinanderfolgende Wochen mit mind. einem Check-In, rueckwaerts ab dieser Woche.';

-- 5. get_slot_streaks() --------------------------------------------------------
-- Liefert pro Wochentag-Slot-Kombination die aktuelle Streak-Laenge.
-- "Slot" = gleicher Wochentag + gleiche Start-Uhrzeit (z.B. Mi 06:00 = Frueh-Slot)

create or replace function public.get_slot_streaks(p_user_id uuid)
returns table(
  day_name       text,
  slot_time      time,
  slot_label     text,
  current_streak integer
)
language plpgsql
stable
as $$
begin
  return query
  with user_session_slots as (
    select
      extract(dow from s.date)::int            as dow,
      s.start_time                              as stime,
      s.date                                    as session_date,
      date_trunc('week', s.date::timestamp)::date as week_start,
      row_number() over (
        partition by extract(dow from s.date), s.start_time
        order by s.date desc
      )                                         as rn
    from public.attendances a
    join public.sessions s on s.id = a.session_id
    where a.user_id = p_user_id
      and a.checked_in_at is not null
  ),
  grouped as (
    select
      dow,
      stime,
      week_start - (rn * interval '7 days') as grp
    from user_session_slots
  ),
  counted as (
    select
      dow,
      stime,
      grp,
      count(*) as streak_len
    from grouped
    group by dow, stime, grp
  ),
  best_streaks as (
    select distinct on (dow, stime)
      dow,
      stime,
      streak_len
    from counted
    order by dow, stime, streak_len desc
  )
  select
    (array['So','Mo','Di','Mi','Do','Fr','Sa'])[bs.dow + 1] as day_name,
    bs.stime as slot_time,
    (array['So','Mo','Di','Mi','Do','Fr','Sa'])[bs.dow + 1] || ' ' ||
      case
        when extract(hour from bs.stime) < 9  then to_char(bs.stime, 'HH24') || ' Uhr'
        when extract(hour from bs.stime) < 13 then 'Vormittag'
        else 'Nachmittag'
      end                  as slot_label,
    bs.streak_len::integer as current_streak
  from best_streaks bs
  order by bs.streak_len desc, bs.dow, bs.stime;
end;
$$;

comment on function public.get_slot_streaks(uuid) is
  'Streak pro Slot (Wochentag + Uhrzeit). Beispiel: 4x Mi 06:00 Uhr in Folge.';

-- 6. sessions_with_counts View -------------------------------------------------
-- Sessions inkl. Anmelde-Zahl und Check-In-Zahl, joined aus signups+attendances.

create or replace view public.sessions_with_counts as
select
  s.*,
  coalesce(signup_counts.cnt, 0)::integer as signup_count,
  coalesce(checkin_counts.cnt, 0)::integer as checkedin_count
from public.sessions s
left join (
  select session_id, count(*) as cnt
  from public.session_signups
  group by session_id
) signup_counts on signup_counts.session_id = s.id
left join (
  select session_id, count(*) as cnt
  from public.attendances
  where checked_in_at is not null
  group by session_id
) checkin_counts on checkin_counts.session_id = s.id;

comment on view public.sessions_with_counts is
  'Sessions mit Live-Counts. Liest sich wie sessions, plus signup_count und checkedin_count.';

-- 7. Marcel zum Admin machen (kann auch separat in seed.sql laufen) ------------
-- Wird hier defensiv ergaenzt, ist idempotent.

update public.profiles
set role = 'admin'
where id = '535675aa-76aa-4140-ad8b-97c6d9a6e2ff'
  and role != 'admin';
