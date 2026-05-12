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
