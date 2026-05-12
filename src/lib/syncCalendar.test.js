import { describe, it, expect, vi } from 'vitest'
import { mapEventToRow, computeCancellations, syncCalendar } from './syncCalendar'

describe('mapEventToRow', () => {
  const event = {
    uid: 'evt-1@google.com',
    title: '1h Focus Session',
    host: 'Britta',
    start: new Date('2026-05-08T04:00:00.000Z'),
    end: new Date('2026-05-08T05:00:00.000Z'),
    summary: '🎯 1h Focus Session - Britta',
    description: 'Some desc',
    zoomLink: 'https://us06web.zoom.us/j/123',
    status: 'confirmed',
  }

  it('maps a confirmed event into a sessions row', () => {
    expect(mapEventToRow(event)).toEqual({
      google_event_id: 'evt-1@google.com',
      title: '1h Focus Session',
      host_name: 'Britta',
      date: '2026-05-08',
      start_time: '06:00:00',
      end_time: '07:00:00',
      zoom_link: 'https://us06web.zoom.us/j/123',
      status: 'scheduled',
    })
  })

  it('sets status=cancelled for cancelled events', () => {
    const row = mapEventToRow({ ...event, status: 'cancelled' })
    expect(row.status).toBe('cancelled')
  })

  it('leaves zoom_link null when none', () => {
    const row = mapEventToRow({ ...event, zoomLink: null })
    expect(row.zoom_link).toBeNull()
  })
})

describe('computeCancellations', () => {
  it('returns ids that exist in DB but not in feed (within feed-window)', () => {
    const feedEvents = [
      { uid: 'a', start: new Date('2026-05-01T08:00:00Z') },
      { uid: 'b', start: new Date('2026-05-05T08:00:00Z') },
    ]
    const dbRows = [
      { google_event_id: 'a', date: '2026-05-01' },
      { google_event_id: 'b', date: '2026-05-05' },
      { google_event_id: 'c', date: '2026-05-03' }, // in window, not in feed → cancel
    ]
    expect(computeCancellations(feedEvents, dbRows)).toEqual(['c'])
  })

  it('does NOT cancel rows older than the oldest feed event (out of window)', () => {
    const feedEvents = [{ uid: 'a', start: new Date('2026-05-01T08:00:00Z') }]
    const dbRows = [
      { google_event_id: 'a', date: '2026-05-01' },
      { google_event_id: 'historic', date: '2026-01-01' }, // way before window
    ]
    expect(computeCancellations(feedEvents, dbRows)).toEqual([])
  })

  it('returns empty array when nothing to cancel', () => {
    const feedEvents = [
      { uid: 'a', start: new Date('2026-05-01T08:00:00Z') },
      { uid: 'b', start: new Date('2026-05-05T08:00:00Z') },
    ]
    const dbRows = [
      { google_event_id: 'a', date: '2026-05-01' },
      { google_event_id: 'b', date: '2026-05-05' },
    ]
    expect(computeCancellations(feedEvents, dbRows)).toEqual([])
  })
})

describe('syncCalendar', () => {
  const SAMPLE_ICAL = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:20260508T040000Z
DTEND:20260508T050000Z
UID:new-1@google.com
SUMMARY:🎯 1h Focus Session - Britta
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`

  function makeSupabaseStub() {
    const calls = []
    const stub = {
      _calls: calls,
      from: (table) => ({
        select: () => ({ data: [], error: null }),
        upsert: (rows, opts) => {
          calls.push({ op: 'upsert', table, rows, opts })
          return Promise.resolve({ error: null })
        },
        update: (patch) => ({
          in: (col, vals) => {
            calls.push({ op: 'update', table, patch, col, vals })
            return Promise.resolve({ error: null })
          },
        }),
      }),
      rpc: (fn) => {
        calls.push({ op: 'rpc', fn })
        return Promise.resolve({ error: null })
      },
    }
    return stub
  }

  it('fetches feed, upserts events, calls status RPC', async () => {
    const supabase = makeSupabaseStub()
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(SAMPLE_ICAL),
    })

    const result = await syncCalendar({
      icalUrl: 'https://example.test/cal.ics',
      supabase,
      fetch: fetchFn,
    })

    expect(fetchFn).toHaveBeenCalledWith('https://example.test/cal.ics')
    expect(result.synced).toBe(1)

    const upsertCall = supabase._calls.find((c) => c.op === 'upsert')
    expect(upsertCall.table).toBe('sessions')
    expect(upsertCall.rows[0].google_event_id).toBe('new-1@google.com')
    expect(upsertCall.opts).toEqual({ onConflict: 'google_event_id' })

    const rpcCall = supabase._calls.find((c) => c.op === 'rpc')
    expect(rpcCall.fn).toBe('update_session_statuses')
  })

  it('throws when fetch fails', async () => {
    const supabase = makeSupabaseStub()
    const fetchFn = vi.fn().mockResolvedValue({ ok: false, status: 500 })
    await expect(
      syncCalendar({ icalUrl: 'x', supabase, fetch: fetchFn }),
    ).rejects.toThrow(/500/)
  })

  it('returns summary with counts', async () => {
    const supabase = makeSupabaseStub()
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(SAMPLE_ICAL),
    })
    const result = await syncCalendar({
      icalUrl: 'x',
      supabase,
      fetch: fetchFn,
    })
    expect(result).toMatchObject({
      synced: 1,
      cancelled: 0,
    })
  })
})
