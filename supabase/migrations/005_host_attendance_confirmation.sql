-- =============================================================================
-- Migration 005: Host bestaetigt Anwesenheit beim Check-Out
-- =============================================================================
-- Beim Check-Out durch den Host (session.host_id == auth.uid()) kann der Host
-- pro angemeldetem User markieren, ob die Person tatsaechlich anwesend war.
-- null  = noch nicht vom Host bestaetigt
-- true  = Host hat User als anwesend markiert
-- false = Host hat User als no-show markiert
-- =============================================================================

alter table public.attendances
  add column if not exists host_confirmed_present boolean;

comment on column public.attendances.host_confirmed_present is
  'Host hat bestaetigt ob User physisch anwesend war. null = noch nicht bestaetigt, true = anwesend, false = no-show';
