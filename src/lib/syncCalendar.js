import { parseICal, icalDateToDb } from './icalParser.js'

export function mapEventToRow(event) {
  const startBerlin = icalDateToDb(event.start)
  const endBerlin = icalDateToDb(event.end)
  return {
    google_event_id: event.uid,
    title: event.title,
    host_name: event.host,
    date: startBerlin.date,
    start_time: startBerlin.time,
    end_time: endBerlin.time,
    zoom_link: event.zoomLink,
    status: event.status === 'cancelled' ? 'cancelled' : 'scheduled',
  }
}

// Sessions die in DB existieren (mit google_event_id), aber nicht mehr im Feed
// auftauchen, sollen soft-gecancelt werden.
// Wichtig: Nur Sessions cancellen die im Feed-Zeitfenster liegen, sonst
// erwischen wir historische Events ausserhalb des standard ~30-Tage-Fensters.
export function computeCancellations(feedEvents, dbRows) {
  if (feedEvents.length === 0) return []

  const feedUids = new Set(feedEvents.map((e) => e.uid))
  const oldestFeedDateMs = Math.min(...feedEvents.map((e) => e.start.getTime()))
  const oldestFeedDate = new Date(oldestFeedDateMs).toISOString().slice(0, 10)

  return dbRows
    .filter(
      (row) =>
        !feedUids.has(row.google_event_id) &&
        row.date >= oldestFeedDate,
    )
    .map((row) => row.google_event_id)
}

export async function syncCalendar({ icalUrl, supabase, fetch: fetchFn = fetch }) {
  const response = await fetchFn(icalUrl)
  if (!response.ok) {
    throw new Error(`iCal fetch failed: ${response.status}`)
  }
  const text = await response.text()
  const { events } = parseICal(text)

  // Upsert all events into sessions table (matches by google_event_id)
  const rows = events.map(mapEventToRow)
  if (rows.length > 0) {
    const { error } = await supabase
      .from('sessions')
      .upsert(rows, { onConflict: 'google_event_id' })
    if (error) throw new Error(`Upsert failed: ${error.message ?? error}`)
  }

  // Read existing synced rows to figure out cancellations
  const { data: existing, error: selectError } = await supabase
    .from('sessions')
    .select('google_event_id, date, status')
  if (selectError) {
    throw new Error(`Select failed: ${selectError.message ?? selectError}`)
  }

  const syncedRows = (existing ?? []).filter((r) => r.google_event_id)
  const toCancel = computeCancellations(events, syncedRows)
  if (toCancel.length > 0) {
    const { error } = await supabase
      .from('sessions')
      .update({ status: 'cancelled' })
      .in('google_event_id', toCancel)
    if (error) throw new Error(`Cancel update failed: ${error.message ?? error}`)
  }

  // Refresh status based on current time
  const { error: rpcError } = await supabase.rpc('update_session_statuses')
  if (rpcError) {
    throw new Error(`Status RPC failed: ${rpcError.message ?? rpcError}`)
  }

  return {
    synced: rows.length,
    cancelled: toCancel.length,
    feedEventCount: events.length,
  }
}
