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

// ============================================
// Push 5: Echte Counts statt Mock-Daten
// ============================================
// Liefert die wichtigsten Aggregat-Zahlen fuer Admin-Dashboard + Landing-Stats.
// Komplexere Auswertungen (weekly trend, top members, no-show-rate, inactive)
// bleiben vorerst Mock — folgen in einem separaten Push wenn dafuer Bedarf.
export async function fetchAdminCounts(client = supabase) {
  // Wir nutzen HEAD + count: 'exact' damit nur die Zahl uebertragen wird,
  // nicht die ganzen Zeilen.
  const [sessionsRes, signupsRes, attendancesRes, profilesRes] = await Promise.all([
    client.from('sessions').select('*', { count: 'exact', head: true }),
    client.from('session_signups').select('*', { count: 'exact', head: true }),
    client.from('attendances').select('*', { count: 'exact', head: true }),
    client.from('profiles').select('*', { count: 'exact', head: true }),
  ])

  const totalSessions = sessionsRes.count ?? 0
  const totalSignups = signupsRes.count ?? 0
  const totalAttendances = attendancesRes.count ?? 0
  const totalMembers = profilesRes.count ?? 0
  const avgPerSession = totalSessions > 0
    ? Math.round((totalSignups / totalSessions) * 10) / 10
    : 0
  // No-Show-Rate: (Signups ohne entsprechenden Attendance) / Signups
  // Approximation: 1 - (attendances / signups). Korrekt waere ein JOIN, aber
  // fuer KPIs reicht das.
  const noShowRate = totalSignups > 0
    ? Math.round(((1 - totalAttendances / totalSignups) * 100) * 10) / 10
    : 0

  return {
    totalSessions,
    totalSignups,
    totalAttendances,
    totalMembers,
    avgPerSession,
    noShowRate,
  }
}

// Lite-Variante fuer die oeffentliche Landing-Page: nur die 3 Zahlen,
// die wir im "Stats-Bar" zeigen. anon darf SELECT auf sessions, signups,
// profiles (siehe Migration 007).
//
// Display-Logik: wir runden auf den naechsten Bucket runter (Floor) und
// zeigen "300+", "1.000+", "50+" — damit die Zahlen marketing-tauglich
// sind UND mitwachsen wenn echte Aktivitaet zunimmt.
//   - Sessions:    Bucket 100, Min 300 (4 Sessions/Woche x ~30 Wochen)
//   - Teilnahmen:  Bucket 100, Min 1000
//   - Members:     Bucket 10,  Min 50
const _floorBucket = (n, bucket, min) => {
  if (!n || n < min) return min
  return Math.floor(n / bucket) * bucket
}

export async function fetchPublicStats(client = supabase) {
  try {
    const [sessions, signups, members] = await Promise.all([
      client.from('sessions').select('*', { count: 'exact', head: true }),
      client.from('session_signups').select('*', { count: 'exact', head: true }),
      client.from('profiles').select('*', { count: 'exact', head: true }),
    ])
    const rawSessions = sessions.count ?? 0
    const rawSignups = signups.count ?? 0
    const rawMembers = members.count ?? 0
    return {
      sessions: rawSessions,
      signups: rawSignups,
      members: rawMembers,
      sessionsDisplay: _floorBucket(rawSessions, 100, 300),
      signupsDisplay: _floorBucket(rawSignups, 100, 1000),
      membersDisplay: _floorBucket(rawMembers, 10, 50),
    }
  } catch (err) {
    console.warn('[Stats] fetchPublicStats fehlgeschlagen', err)
    return null
  }
}


// Liefert vergangene Sessions des aktuellen Hosts, bei denen noch nicht
// alle Anmeldungen via host_confirmed_present markiert sind.
// Schema:
//   - sessions(host_id, date, end_time, ...)
//   - session_signups(user_id, session_id, profile->display_name)
//   - attendances(user_id, session_id, host_confirmed_present)
// Wir geben pro pending Session: { sessionId, title, date, time, host_name, signedUp[], confirmed[] }.
export async function fetchPendingHostConfirmations(hostUserId, client = supabase) {
  if (!hostUserId) return []
  const todayIso = new Date().toISOString().slice(0, 10)
  // 1. Vergangene Sessions des Hosts
  const { data: sessions, error: sErr } = await client
    .from('sessions')
    .select('id, title, date, start_time, end_time, host_name')
    .eq('host_id', hostUserId)
    .lte('date', todayIso)
    .order('date', { ascending: false })
    .limit(20)
  if (sErr) { console.warn('[Pending] sessions query failed', sErr); return [] }
  if (!sessions || sessions.length === 0) return []

  // 2. Fuer jede Session: signups holen + attendances pruefen
  const result = []
  for (const s of sessions) {
    const [signupsRes, attendancesRes] = await Promise.all([
      client
        .from('session_signups')
        .select('user_id, profiles:profiles!session_signups_user_id_fkey(display_name)')
        .eq('session_id', s.id),
      client
        .from('attendances')
        .select('user_id, host_confirmed_present')
        .eq('session_id', s.id),
    ])
    const signups = signupsRes.data || []
    if (signups.length === 0) continue
    const attendances = attendancesRes.data || []
    const confirmedIds = new Set(
      attendances.filter(a => a.host_confirmed_present === true || a.host_confirmed_present === false).map(a => a.user_id),
    )
    // Wenn ALLE signups schon eine Confirmation haben (true ODER false), ist die Session erledigt
    if (signups.every(sg => confirmedIds.has(sg.user_id))) continue

    result.push({
      sessionId: s.id,
      session: `${s.title} – ${s.host_name || 'Host'}`,
      date: s.date,
      time: (s.start_time || '00:00').slice(0, 5),
      signedUp: signups.map(sg => sg.profiles?.display_name || `User-${sg.user_id?.slice(0, 6) || '?'}`),
      signupUserIds: signups.map(sg => sg.user_id),
      confirmed: attendances
        .filter(a => a.host_confirmed_present === true)
        .map(a => {
          const sg = signups.find(x => x.user_id === a.user_id)
          return sg?.profiles?.display_name || `User-${a.user_id?.slice(0, 6) || '?'}`
        }),
    })
  }
  return result
}

// ============================================
// Push 5b: Komplexe Admin-Aggregate (statt Mock)
// ============================================

// Weekly Trend: Anzahl Sessions pro KW, letzte 5 KW.
// Da Postgres in PostgREST keine Window-Functions exposed werden,
// holen wir die Sessions clientseitig und gruppieren in JS.
export async function fetchWeeklyTrend(client = supabase) {
  const today = new Date()
  const fiveWeeksAgo = new Date(today)
  fiveWeeksAgo.setDate(today.getDate() - 35)
  const fromIso = fiveWeeksAgo.toISOString().slice(0, 10)
  const { data, error } = await client
    .from('sessions')
    .select('date')
    .gte('date', fromIso)
    .order('date', { ascending: true })
  if (error || !data) return []
  const buckets = {}
  for (const s of data) {
    const d = new Date(s.date + 'T00:00:00')
    // ISO-Woche
    const target = new Date(d.getFullYear(), d.getMonth(), d.getDate())
    const dayNum = (target.getDay() + 6) % 7
    target.setDate(target.getDate() - dayNum + 3)
    const firstThursday = new Date(target.getFullYear(), 0, 4)
    const week = 1 + Math.round(((target - firstThursday) / 86400000 - 3 + ((firstThursday.getDay() + 6) % 7)) / 7)
    const key = `KW ${week}`
    buckets[key] = (buckets[key] || 0) + 1
  }
  const keys = Object.keys(buckets).slice(-5)
  return keys.map(k => ({ week: k, count: buckets[k] }))
}

// Top Members: Anzahl Attendances pro User, last 90 Tage. JOIN profile.
export async function fetchTopMembers(client = supabase, limit = 5) {
  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
  const fromIso = ninetyDaysAgo.toISOString().slice(0, 10)
  // Schritt 1: alle attendances mit session_id holen, dann JOIN session.date filtern.
  // Einfacher: alle attendances holen + count per user_id im Client.
  const { data: atts, error } = await client
    .from('attendances')
    .select('user_id, sessions:sessions!attendances_session_id_fkey(date)')
  if (error || !atts) return []
  const counts = {}
  for (const a of atts) {
    const date = a.sessions?.date
    if (!date || date < fromIso) continue
    counts[a.user_id] = (counts[a.user_id] || 0) + 1
  }
  const userIds = Object.keys(counts)
  if (userIds.length === 0) return []
  const { data: profiles } = await client
    .from('profiles')
    .select('id, display_name')
    .in('id', userIds)
  const nameById = Object.fromEntries((profiles || []).map(p => [p.id, p.display_name || 'User']))
  return userIds
    .map(id => ({ name: nameById[id] || 'User', sessions: counts[id] }))
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, limit)
}

// No-Show Tracking: User mit signups OHNE entsprechende attendance.
// (signups.count - attendances.count) pro User, ORDER BY desc.
export async function fetchNoShows(client = supabase, limit = 4) {
  const [signupsRes, attsRes] = await Promise.all([
    client.from('session_signups').select('user_id, session_id'),
    client.from('attendances').select('user_id, session_id'),
  ])
  if (signupsRes.error || attsRes.error) return []
  const signups = signupsRes.data || []
  const atts = new Set((attsRes.data || []).map(a => `${a.user_id}|${a.session_id}`))
  const noShowByUser = {}
  for (const s of signups) {
    if (!atts.has(`${s.user_id}|${s.session_id}`)) {
      noShowByUser[s.user_id] = (noShowByUser[s.user_id] || 0) + 1
    }
  }
  const userIds = Object.keys(noShowByUser)
  if (userIds.length === 0) return []
  const { data: profiles } = await client
    .from('profiles')
    .select('id, display_name')
    .in('id', userIds)
  const nameById = Object.fromEntries((profiles || []).map(p => [p.id, p.display_name || 'User']))
  // Plus: total signups per user fuer percent
  const totalSignupsByUser = {}
  for (const s of signups) {
    totalSignupsByUser[s.user_id] = (totalSignupsByUser[s.user_id] || 0) + 1
  }
  return userIds
    .map(id => {
      const total = totalSignupsByUser[id] || 1
      const noShows = noShowByUser[id]
      return {
        name: nameById[id] || 'User',
        noShows,
        totalSessions: total,
        rate: `${Math.round((noShows / total) * 100)}%`,
      }
    })
    .sort((a, b) => b.noShows - a.noShows)
    .slice(0, limit)
}

// Inactive Members: Profile mit letzter Attendance > 30 Tagen ODER nie.
export async function fetchInactiveMembers(client = supabase, limit = 4) {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const cutoffIso = thirtyDaysAgo.toISOString().slice(0, 10)
  const [profilesRes, attsRes] = await Promise.all([
    client.from('profiles').select('id, display_name'),
    client
      .from('attendances')
      .select('user_id, sessions:sessions!attendances_session_id_fkey(date)'),
  ])
  if (profilesRes.error) return []
  const profiles = profilesRes.data || []
  const atts = attsRes.data || []
  const lastSeenByUser = {}
  for (const a of atts) {
    const d = a.sessions?.date
    if (!d) continue
    if (!lastSeenByUser[a.user_id] || d > lastSeenByUser[a.user_id]) {
      lastSeenByUser[a.user_id] = d
    }
  }
  return profiles
    .map(p => ({
      name: p.display_name || 'User',
      lastSeen: lastSeenByUser[p.id] || null,
      sessions: atts.filter(a => a.user_id === p.id).length,
    }))
    .filter(p => !p.lastSeen || p.lastSeen < cutoffIso)
    .sort((a, b) => (b.lastSeen || '0').localeCompare(a.lastSeen || '0'))
    .slice(0, limit)
}

// "Anmeldungen vs. Teilnahmen" — letzte 6 Sessions mit signup/att-Zahlen.
export async function fetchSessionAttendanceStats(client = supabase, limit = 6) {
  const todayIso = new Date().toISOString().slice(0, 10)
  const { data: sessions, error } = await client
    .from('sessions')
    .select('id, title, host_name, date')
    .lt('date', todayIso)
    .order('date', { ascending: false })
    .limit(limit)
  if (error || !sessions) return []
  const sessionIds = sessions.map(s => s.id)
  if (sessionIds.length === 0) return []
  const [signupsRes, attsRes] = await Promise.all([
    client.from('session_signups').select('session_id, user_id').in('session_id', sessionIds),
    client.from('attendances').select('session_id, user_id').in('session_id', sessionIds),
  ])
  const signupsBySession = {}
  for (const s of (signupsRes.data || [])) {
    if (!signupsBySession[s.session_id]) signupsBySession[s.session_id] = new Set()
    signupsBySession[s.session_id].add(s.user_id)
  }
  const attsBySession = {}
  for (const a of (attsRes.data || [])) {
    if (!attsBySession[a.session_id]) attsBySession[a.session_id] = new Set()
    attsBySession[a.session_id].add(a.user_id)
  }
  const allUserIds = new Set()
  Object.values(signupsBySession).forEach(set => set.forEach(id => allUserIds.add(id)))
  Object.values(attsBySession).forEach(set => set.forEach(id => allUserIds.add(id)))
  const { data: profiles } = allUserIds.size > 0
    ? await client.from('profiles').select('id, display_name').in('id', Array.from(allUserIds))
    : { data: [] }
  const nameById = Object.fromEntries((profiles || []).map(p => [p.id, p.display_name || 'User']))
  return sessions.map(s => {
    const signedUp = Array.from(signupsBySession[s.id] || new Set())
    const attended = Array.from(attsBySession[s.id] || new Set())
    const noShows = signedUp.filter(uid => !attended.includes(uid)).map(uid => nameById[uid] || 'User')
    return {
      title: s.title,
      host: s.host_name,
      date: s.date,
      signedUp: signedUp.length,
      attended: attended.length,
      noShows,
    }
  })
}

// Zeitslot-Analyse: aggregiert sessions/attendances pro Start-Time-Bucket.
const SLOT_BUCKETS = [
  { label: '06:00 Früh', match: t => t.startsWith('06:') },
  { label: '10:00 Vormittag', match: t => t.startsWith('10:') },
  { label: '14:00/14:30 Nachmittag', match: t => t.startsWith('14:') },
]
export async function fetchSlotStats(client = supabase) {
  const { data: sessions } = await client
    .from('sessions')
    .select('id, start_time')
  if (!sessions) return []
  const [signupsRes, attsRes] = await Promise.all([
    client.from('session_signups').select('session_id'),
    client.from('attendances').select('session_id'),
  ])
  const signupCounts = {}
  for (const s of (signupsRes.data || [])) {
    signupCounts[s.session_id] = (signupCounts[s.session_id] || 0) + 1
  }
  const attCounts = {}
  for (const a of (attsRes.data || [])) {
    attCounts[a.session_id] = (attCounts[a.session_id] || 0) + 1
  }
  return SLOT_BUCKETS.map(b => {
    const matched = sessions.filter(s => s.start_time && b.match(s.start_time))
    const sessionCount = matched.length
    if (sessionCount === 0) {
      return { slot: b.label, avgSignups: 0, avgAttended: 0, sessions: 0, trend: 'same' }
    }
    const totalSignups = matched.reduce((sum, s) => sum + (signupCounts[s.id] || 0), 0)
    const totalAtts = matched.reduce((sum, s) => sum + (attCounts[s.id] || 0), 0)
    return {
      slot: b.label,
      avgSignups: Math.round((totalSignups / sessionCount) * 10) / 10,
      avgAttended: Math.round((totalAtts / sessionCount) * 10) / 10,
      sessions: sessionCount,
      trend: 'same',
    }
  })
}

// Leaderboard: Attendances pro User in einem Zeitraum.
export async function fetchLeaderboard(client = supabase, period = '7d', limit = 8) {
  const now = new Date()
  let fromIso = null
  if (period === '7d') {
    const from = new Date(now); from.setDate(now.getDate() - 7)
    fromIso = from.toISOString().slice(0, 10)
  } else if (period === '30d') {
    const from = new Date(now); from.setDate(now.getDate() - 30)
    fromIso = from.toISOString().slice(0, 10)
  }
  // allzeit -> kein Filter
  const { data: atts } = await client
    .from('attendances')
    .select('user_id, sessions:sessions!attendances_session_id_fkey(date)')
  if (!atts) return []
  const counts = {}
  for (const a of atts) {
    const d = a.sessions?.date
    if (!d) continue
    if (fromIso && d < fromIso) continue
    counts[a.user_id] = (counts[a.user_id] || 0) + 1
  }
  const userIds = Object.keys(counts)
  if (userIds.length === 0) return []
  const { data: profiles } = await client
    .from('profiles')
    .select('id, display_name')
    .in('id', userIds)
  const nameById = Object.fromEntries((profiles || []).map(p => [p.id, p.display_name || 'User']))
  return userIds
    .map(id => ({ name: nameById[id] || 'User', sessions: counts[id], streak: 0, trend: 'same' }))
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, limit)
    .map((r, i) => ({ ...r, rank: i + 1 }))
}

// Public Sessions fuer die Landing-Page (anon erlaubt seit Migration 007).
// Liefert die naechsten 4 nicht-vergangenen Sessions.
export async function fetchPublicSessions(client = supabase, limit = 4) {
  const todayIso = new Date().toISOString().slice(0, 10)
  const { data, error } = await client
    .from('sessions')
    .select('id, title, date, start_time, end_time, host_name')
    .gte('date', todayIso)
    .order('date', { ascending: true })
    .order('start_time', { ascending: true })
    .limit(limit * 2) // ein bisschen Puffer falls heute schon vorbei
  if (error || !data) return []
  return data.slice(0, limit)
}
