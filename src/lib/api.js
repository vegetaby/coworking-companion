import { supabase } from './supabase'

// ----- SESSIONS -----

export async function fetchSessions() {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .order('date', { ascending: true })
    .order('start_time', { ascending: true })
  if (error) throw error
  return data
}

// Triggert die Server-seitige Statuslogik (scheduled -> live -> past)
// damit der Realdaten-Status passt, auch wenn der Cron nicht lief.
export async function updateSessionStatuses(client = supabase) {
  const { error } = await client.rpc('update_session_statuses')
  if (error) throw new Error(error.message ?? String(error))
}

// ----- SIGNUPS -----

export async function fetchMySignups(userId) {
  const { data, error } = await supabase
    .from('session_signups')
    .select('session_id')
    .eq('user_id', userId)
  if (error) throw error
  return new Set(data.map(r => r.session_id))
}

export async function signUpForSession(userId, sessionId) {
  const { error } = await supabase
    .from('session_signups')
    .insert({ user_id: userId, session_id: sessionId })
  if (error) throw error
}

export async function cancelSignup(userId, sessionId) {
  const { error } = await supabase
    .from('session_signups')
    .delete()
    .eq('user_id', userId)
    .eq('session_id', sessionId)
  if (error) throw error
}

// ----- ATTENDANCES -----

export async function fetchMyAttendances(userId) {
  const { data, error } = await supabase
    .from('attendances')
    .select('*, session:sessions(*)')
    .eq('user_id', userId)
    .order('checked_in_at', { ascending: false, nullsFirst: false })
  if (error) throw error
  return data
}

export async function upsertAttendanceGoal(userId, sessionId, goalText) {
  const { error } = await supabase
    .from('attendances')
    .upsert(
      { user_id: userId, session_id: sessionId, goal_before: goalText },
      { onConflict: 'user_id,session_id' }
    )
  if (error) throw error
}

export async function checkInAttendance(userId, sessionId, { goalBefore, routineStates }) {
  const { error } = await supabase
    .from('attendances')
    .upsert(
      {
        user_id: userId,
        session_id: sessionId,
        goal_before: goalBefore,
        routine_states: routineStates ?? {},
        checked_in_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,session_id' }
    )
  if (error) throw error
}

export async function checkOutAttendance(userId, sessionId, { goalAfter, rating }) {
  const { error } = await supabase
    .from('attendances')
    .update({
      goal_after: goalAfter,
      rating,
      checked_out_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('session_id', sessionId)
  if (error) throw error
}

// Beendet einen vergessenen Check-Out mit minimaler Information: setzt nur
// checked_out_at = jetzt, ohne goal_after oder rating. Wird vom
// UnfinishedCheckoutModal aufgerufen, wenn der User "Ich weiss es nicht mehr"
// klickt — wir wollen die Attendance-Zeile schliessen, damit sie nicht ewig
// als pending taucht, aber nicht so tun als haette der User reflektiert.
export async function dismissPendingCheckout(userId, sessionId, client = supabase) {
  if (!userId) throw new Error('dismissPendingCheckout: userId fehlt')
  if (!sessionId) throw new Error('dismissPendingCheckout: sessionId fehlt')
  const { error } = await client
    .from('attendances')
    .update({ checked_out_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('session_id', sessionId)
  if (error) throw new Error(error.message ?? String(error))
}

// Host bestaetigt fuer eine Liste von Usern, ob sie anwesend waren oder nicht.
// confirmations: { [userId]: boolean } — true = anwesend, false = no-show.
// Wir upserten pro User, damit auch User ohne bestehende attendance-Row eine
// bekommen (z.B. Angemeldete, die nie eingecheckt haben).
export async function confirmAttendance(hostUserId, sessionId, confirmations, client = supabase) {
  if (!hostUserId) throw new Error('confirmAttendance: hostUserId fehlt')
  if (!sessionId) throw new Error('confirmAttendance: sessionId fehlt')
  const entries = Object.entries(confirmations || {})
  if (entries.length === 0) return
  const rows = entries.map(([userId, present]) => ({
    user_id: userId,
    session_id: sessionId,
    host_confirmed_present: !!present,
  }))
  const { error } = await client
    .from('attendances')
    .upsert(rows, { onConflict: 'user_id,session_id' })
  if (error) throw new Error(error.message ?? String(error))
}

// Liest alle Anmeldungen fuer eine Session inkl. Profil-Daten (display_name),
// damit das Host-Bestaetigungs-UI Namen statt User-IDs zeigen kann.
export async function fetchSessionSignupsWithProfiles(sessionId, client = supabase) {
  if (!sessionId) throw new Error('fetchSessionSignupsWithProfiles: sessionId fehlt')
  const { data, error } = await client
    .from('session_signups')
    .select('user_id, profile:profiles(id, display_name)')
    .eq('session_id', sessionId)
  if (error) throw new Error(error.message ?? String(error))
  return data ?? []
}

// Ruft die SQL-Function get_user_streak() ab. Liefert die Anzahl
// aufeinanderfolgender Wochen mit mindestens einem Check-In. Bei Fehler oder
// fehlender userId liefern wir 0 — das Dashboard soll niemals wegen Streak
// crashen.
export async function fetchUserStreak(userId, client = supabase) {
  if (!userId) return 0
  try {
    const { data, error } = await client.rpc('get_user_streak', { p_user_id: userId })
    if (error) {
      console.warn('fetchUserStreak: RPC error, returning 0:', error)
      return 0
    }
    return typeof data === 'number' ? data : 0
  } catch (err) {
    console.warn('fetchUserStreak: unexpected error, returning 0:', err)
    return 0
  }
}

// Offene Check-Outs der letzten 7 Tage: User hat eingecheckt aber nicht ausgecheckt.
// Wird nach Login gepruft, damit der User vergessene Sessions nachholen kann.
export async function fetchPendingCheckouts(userId, client = supabase) {
  if (!userId) return []
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10)
  const { data, error } = await client
    .from('attendances')
    .select('*, session:sessions(*)')
    .eq('user_id', userId)
    .not('checked_in_at', 'is', null)
    .is('checked_out_at', null)
    .gte('session.date', sevenDaysAgo)
    .order('checked_in_at', { ascending: false })
  if (error) throw new Error(error.message ?? String(error))
  return data ?? []
}

// ----- ROUTINES -----

export async function fetchMyRoutines(userId) {
  const { data, error } = await supabase
    .from('routines')
    .select('*')
    .eq('user_id', userId)
    .order('sort_order', { ascending: true })
  if (error) throw error
  return data
}

// Legt eine neue Routine fuer den Nutzer an. sort_order steuert die Reihenfolge
// in der UI. Label wird getrimmt; leere Labels werden abgelehnt damit die DB
// keinen Schrott bekommt.
export async function createRoutine(userId, label, sortOrder = 0, client = supabase) {
  if (!userId) throw new Error('createRoutine: userId fehlt')
  const trimmed = typeof label === 'string' ? label.trim() : ''
  if (!trimmed) throw new Error('createRoutine: label darf nicht leer sein')
  const { data, error } = await client
    .from('routines')
    .insert({
      user_id: userId,
      label: trimmed,
      sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
    })
    .select()
    .single()
  if (error) throw new Error(error.message ?? String(error))
  return data
}

// Patcht beliebige Felder der Routine (label, active, sort_order, ...).
// Wir vertrauen dem Caller, dass das Patch-Objekt nur erlaubte Felder enthaelt;
// RLS verhindert Cross-User-Updates auf DB-Ebene.
export async function updateRoutine(routineId, patch, client = supabase) {
  if (!routineId) throw new Error('updateRoutine: routineId fehlt')
  const { data, error } = await client
    .from('routines')
    .update(patch)
    .eq('id', routineId)
    .select()
    .single()
  if (error) throw new Error(error.message ?? String(error))
  return data
}

// Loescht die Routine. Hard-Delete ist okay weil routine_states in attendances
// als JSON gespeichert sind (Label-basiert, nicht foreign-key).
export async function deleteRoutine(routineId, client = supabase) {
  if (!routineId) throw new Error('deleteRoutine: routineId fehlt')
  const { error } = await client
    .from('routines')
    .delete()
    .eq('id', routineId)
  if (error) throw new Error(error.message ?? String(error))
}

// ----- FEATURE FLAGS -----

// Liest alle Feature-Flags. Reihenfolge nach key, damit die Admin-UI stabil
// aussieht. RLS erlaubt SELECT fuer alle Authenticated.
export async function fetchFeatureFlags(client = supabase) {
  const { data, error } = await client
    .from('feature_flags')
    .select('key, enabled, label, description')
    .order('key', { ascending: true })
  if (error) throw new Error(error.message ?? String(error))
  return data ?? []
}

// Setzt den enabled-Wert fuer einen Flag-Key. Schreiben ist per RLS auf Admins
// beschraenkt; der Caller muss sich nicht selbst um die Rolle kuemmern.
export async function updateFeatureFlag(key, enabled, client = supabase) {
  if (!key) throw new Error('updateFeatureFlag: key fehlt')
  const { error } = await client
    .from('feature_flags')
    .update({ enabled: !!enabled, updated_at: new Date().toISOString() })
    .eq('key', key)
  if (error) throw new Error(error.message ?? String(error))
}
