import { describe, it, expect, vi } from 'vitest'
import {
  updateSessionStatuses,
  fetchPendingCheckouts,
  createRoutine,
  updateRoutine,
  deleteRoutine,
  fetchFeatureFlags,
  updateFeatureFlag,
  confirmAttendance,
  fetchSessionSignupsWithProfiles,
  dismissPendingCheckout,
  fetchUserStreak,
} from './api'

describe('updateSessionStatuses', () => {
  it('calls the update_session_statuses RPC and resolves', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: null })
    const client = { rpc }
    await updateSessionStatuses(client)
    expect(rpc).toHaveBeenCalledWith('update_session_statuses')
  })

  it('throws when RPC returns an error', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: { message: 'boom' } })
    const client = { rpc }
    await expect(updateSessionStatuses(client)).rejects.toThrow(/boom/)
  })
})

describe('fetchPendingCheckouts', () => {
  // Build a minimal supabase chain stub that captures filter calls.
  const buildClient = (rows) => {
    const calls = { filters: [] }
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn(function (col, val) {
        calls.filters.push({ op: 'eq', col, val })
        return this
      }),
      is: vi.fn(function (col, val) {
        calls.filters.push({ op: 'is', col, val })
        return this
      }),
      not: vi.fn(function (col, op, val) {
        calls.filters.push({ op: 'not', col, predicate: op, val })
        return this
      }),
      gte: vi.fn(function (col, val) {
        calls.filters.push({ op: 'gte', col, val })
        return this
      }),
      order: vi.fn(function () {
        return Promise.resolve({ data: rows, error: null })
      }),
    }
    const client = {
      from: vi.fn().mockReturnValue(chain),
      _calls: calls,
      _chain: chain,
    }
    return client
  }

  it('queries attendances with the correct filters and returns rows', async () => {
    const sample = [
      {
        id: 'a1',
        user_id: 'u1',
        session_id: 's1',
        checked_in_at: '2026-04-25T09:00:00Z',
        checked_out_at: null,
        session: { id: 's1', date: '2026-04-25', title: 'Focus' },
      },
    ]
    const client = buildClient(sample)
    const result = await fetchPendingCheckouts('u1', client)

    expect(client.from).toHaveBeenCalledWith('attendances')
    // Must filter by user_id
    expect(client._calls.filters.some(f => f.op === 'eq' && f.col === 'user_id' && f.val === 'u1')).toBe(true)
    // Must require checked_in_at to be set
    expect(client._calls.filters.some(f => f.col === 'checked_in_at' && (f.op === 'not' || f.op === 'is'))).toBe(true)
    // Must require checked_out_at IS NULL
    expect(client._calls.filters.some(f => f.op === 'is' && f.col === 'checked_out_at' && f.val === null)).toBe(true)
    expect(result).toEqual(sample)
  })

  it('returns empty array when no pending checkouts', async () => {
    const client = buildClient([])
    const result = await fetchPendingCheckouts('u1', client)
    expect(result).toEqual([])
  })

  it('throws when supabase reports an error', async () => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: null, error: { message: 'db down' } }),
    }
    const client = { from: vi.fn().mockReturnValue(chain) }
    await expect(fetchPendingCheckouts('u1', client)).rejects.toThrow(/db down/)
  })

  it('returns empty array when no userId provided (defensive)', async () => {
    const result = await fetchPendingCheckouts(null)
    expect(result).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Routinen-CRUD
// ---------------------------------------------------------------------------

describe('createRoutine', () => {
  const buildInsertClient = (returnRow) => {
    const inserted = {}
    const chain = {
      insert: vi.fn(function (row) {
        inserted.row = row
        return this
      }),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: returnRow, error: null }),
    }
    const client = { from: vi.fn().mockReturnValue(chain), _inserted: inserted, _chain: chain }
    return client
  }

  it('inserts a routine with user_id, label und sort_order und gibt die neue Zeile zurueck', async () => {
    const newRow = { id: 'r-new', user_id: 'u1', label: 'Wasser bereitstellen', active: true, sort_order: 3 }
    const client = buildInsertClient(newRow)

    const result = await createRoutine('u1', 'Wasser bereitstellen', 3, client)

    expect(client.from).toHaveBeenCalledWith('routines')
    expect(client._inserted.row).toMatchObject({
      user_id: 'u1',
      label: 'Wasser bereitstellen',
      sort_order: 3,
    })
    expect(result).toEqual(newRow)
  })

  it('default sort_order ist 0 wenn nicht angegeben', async () => {
    const client = buildInsertClient({ id: 'r-new', user_id: 'u1', label: 'X', sort_order: 0 })
    await createRoutine('u1', 'X', undefined, client)
    expect(client._inserted.row.sort_order).toBe(0)
  })

  it('wirft, wenn supabase einen Fehler liefert', async () => {
    const chain = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { message: 'rls denied' } }),
    }
    const client = { from: vi.fn().mockReturnValue(chain) }
    await expect(createRoutine('u1', 'X', 0, client)).rejects.toThrow(/rls denied/)
  })

  it('wirft, wenn label leer ist', async () => {
    await expect(createRoutine('u1', '', 0)).rejects.toThrow()
    await expect(createRoutine('u1', '   ', 0)).rejects.toThrow()
  })

  it('wirft, wenn userId fehlt', async () => {
    await expect(createRoutine(null, 'X', 0)).rejects.toThrow()
  })
})

describe('updateRoutine', () => {
  const buildUpdateClient = (returnRow) => {
    const updated = {}
    const chain = {
      update: vi.fn(function (patch) {
        updated.patch = patch
        return this
      }),
      eq: vi.fn(function (col, val) {
        updated.where = { col, val }
        return this
      }),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: returnRow, error: null }),
    }
    const client = { from: vi.fn().mockReturnValue(chain), _updated: updated }
    return client
  }

  it('aktualisiert die Routine mit dem uebergebenen Patch', async () => {
    const client = buildUpdateClient({ id: 'r1', label: 'Neuer Name', active: false })
    const result = await updateRoutine('r1', { label: 'Neuer Name', active: false }, client)

    expect(client.from).toHaveBeenCalledWith('routines')
    expect(client._updated.patch).toEqual({ label: 'Neuer Name', active: false })
    expect(client._updated.where).toEqual({ col: 'id', val: 'r1' })
    expect(result).toMatchObject({ id: 'r1', label: 'Neuer Name', active: false })
  })

  it('wirft, wenn supabase einen Fehler liefert', async () => {
    const chain = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { message: 'nope' } }),
    }
    const client = { from: vi.fn().mockReturnValue(chain) }
    await expect(updateRoutine('r1', { active: false }, client)).rejects.toThrow(/nope/)
  })

  it('wirft, wenn routineId fehlt', async () => {
    await expect(updateRoutine(null, { active: true })).rejects.toThrow()
  })
})

describe('deleteRoutine', () => {
  it('loescht die Routine anhand der id', async () => {
    const deleted = {}
    const chain = {
      delete: vi.fn(function () { return this }),
      eq: vi.fn(function (col, val) {
        deleted.where = { col, val }
        return Promise.resolve({ data: null, error: null })
      }),
    }
    const client = { from: vi.fn().mockReturnValue(chain) }

    await deleteRoutine('r1', client)

    expect(client.from).toHaveBeenCalledWith('routines')
    expect(deleted.where).toEqual({ col: 'id', val: 'r1' })
  })

  it('wirft, wenn supabase einen Fehler liefert', async () => {
    const chain = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: null, error: { message: 'rls' } }),
    }
    const client = { from: vi.fn().mockReturnValue(chain) }
    await expect(deleteRoutine('r1', client)).rejects.toThrow(/rls/)
  })

  it('wirft, wenn routineId fehlt', async () => {
    await expect(deleteRoutine(null)).rejects.toThrow()
  })
})

// ---------------------------------------------------------------------------
// Feature-Flags
// ---------------------------------------------------------------------------

describe('fetchFeatureFlags', () => {
  it('liest alle Feature-Flags und liefert ein Array zurueck', async () => {
    const sample = [
      { key: 'nav_leaderboard', enabled: false, label: 'Leaderboard', description: null },
      { key: 'nav_routinen',    enabled: true,  label: 'Fokus-Routinen', description: 'Sidebar-Eintrag' },
    ]
    const chain = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: sample, error: null }),
    }
    const client = { from: vi.fn().mockReturnValue(chain) }

    const result = await fetchFeatureFlags(client)

    expect(client.from).toHaveBeenCalledWith('feature_flags')
    expect(chain.select).toHaveBeenCalled()
    expect(result).toEqual(sample)
  })

  it('liefert leeres Array, wenn keine Flags vorhanden', async () => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    }
    const client = { from: vi.fn().mockReturnValue(chain) }
    const result = await fetchFeatureFlags(client)
    expect(result).toEqual([])
  })

  it('wirft, wenn supabase einen Fehler liefert', async () => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: null, error: { message: 'rls' } }),
    }
    const client = { from: vi.fn().mockReturnValue(chain) }
    await expect(fetchFeatureFlags(client)).rejects.toThrow(/rls/)
  })
})

describe('updateFeatureFlag', () => {
  const buildUpdateClient = () => {
    const updated = {}
    const chain = {
      update: vi.fn(function (patch) {
        updated.patch = patch
        return this
      }),
      eq: vi.fn(function (col, val) {
        updated.where = { col, val }
        return Promise.resolve({ data: null, error: null })
      }),
    }
    const client = { from: vi.fn().mockReturnValue(chain), _updated: updated }
    return client
  }

  it('setzt enabled fuer den gegebenen Key', async () => {
    const client = buildUpdateClient()
    await updateFeatureFlag('nav_leaderboard', true, client)
    expect(client.from).toHaveBeenCalledWith('feature_flags')
    expect(client._updated.patch).toMatchObject({ enabled: true })
    expect(client._updated.where).toEqual({ col: 'key', val: 'nav_leaderboard' })
  })

  it('akzeptiert false als enabled-Wert', async () => {
    const client = buildUpdateClient()
    await updateFeatureFlag('nav_routinen', false, client)
    expect(client._updated.patch).toMatchObject({ enabled: false })
  })

  it('wirft, wenn key fehlt', async () => {
    await expect(updateFeatureFlag(null, true)).rejects.toThrow()
    await expect(updateFeatureFlag('', true)).rejects.toThrow()
  })

  it('wirft, wenn supabase einen Fehler liefert', async () => {
    const chain = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: null, error: { message: 'denied' } }),
    }
    const client = { from: vi.fn().mockReturnValue(chain) }
    await expect(updateFeatureFlag('nav_leaderboard', true, client)).rejects.toThrow(/denied/)
  })
})

// ---------------------------------------------------------------------------
// Host-Attendance-Confirmation
// ---------------------------------------------------------------------------

describe('confirmAttendance', () => {
  // Baut einen Supabase-Stub, der den upsert-Call protokolliert.
  const buildUpsertClient = () => {
    const calls = { upserts: [] }
    const chain = {
      upsert: vi.fn(function (rows, opts) {
        calls.upserts.push({ rows, opts })
        return Promise.resolve({ data: null, error: null })
      }),
    }
    const client = { from: vi.fn().mockReturnValue(chain), _calls: calls }
    return client
  }

  it('upsert-t fuer jeden User-Eintrag im confirmations-Objekt mit host_confirmed_present', async () => {
    const client = buildUpsertClient()
    await confirmAttendance('host-1', 'sess-1', {
      'user-a': true,
      'user-b': false,
      'user-c': true,
    }, client)

    expect(client.from).toHaveBeenCalledWith('attendances')
    // Es darf ein einzelner upsert mit drei Rows sein, oder drei einzelne upserts —
    // wir akzeptieren beides und summieren.
    const allRows = client._calls.upserts.flatMap(c => Array.isArray(c.rows) ? c.rows : [c.rows])
    expect(allRows).toHaveLength(3)
    const byUser = Object.fromEntries(allRows.map(r => [r.user_id, r]))
    expect(byUser['user-a']).toMatchObject({ user_id: 'user-a', session_id: 'sess-1', host_confirmed_present: true })
    expect(byUser['user-b']).toMatchObject({ user_id: 'user-b', session_id: 'sess-1', host_confirmed_present: false })
    expect(byUser['user-c']).toMatchObject({ user_id: 'user-c', session_id: 'sess-1', host_confirmed_present: true })
    // onConflict muss user_id+session_id sein
    const opts = client._calls.upserts[0].opts
    expect(opts).toMatchObject({ onConflict: 'user_id,session_id' })
  })

  it('macht nichts, wenn confirmations leer ist', async () => {
    const client = buildUpsertClient()
    await confirmAttendance('host-1', 'sess-1', {}, client)
    expect(client._calls.upserts).toHaveLength(0)
  })

  it('wirft, wenn supabase einen Fehler liefert', async () => {
    const chain = {
      upsert: vi.fn().mockResolvedValue({ data: null, error: { message: 'rls denied' } }),
    }
    const client = { from: vi.fn().mockReturnValue(chain) }
    await expect(
      confirmAttendance('host-1', 'sess-1', { 'user-a': true }, client)
    ).rejects.toThrow(/rls denied/)
  })

  it('wirft, wenn hostUserId fehlt', async () => {
    await expect(confirmAttendance(null, 'sess-1', { 'u': true })).rejects.toThrow()
  })

  it('wirft, wenn sessionId fehlt', async () => {
    await expect(confirmAttendance('host-1', null, { 'u': true })).rejects.toThrow()
  })
})

describe('fetchSessionSignupsWithProfiles', () => {
  it('liefert Signups inkl. profile.display_name fuer die Session', async () => {
    const sample = [
      { user_id: 'u1', profile: { id: 'u1', display_name: 'Anna' } },
      { user_id: 'u2', profile: { id: 'u2', display_name: 'Bob' } },
    ]
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: sample, error: null }),
    }
    const client = { from: vi.fn().mockReturnValue(chain) }

    const result = await fetchSessionSignupsWithProfiles('sess-1', client)

    expect(client.from).toHaveBeenCalledWith('session_signups')
    expect(chain.select).toHaveBeenCalled()
    expect(chain.eq).toHaveBeenCalledWith('session_id', 'sess-1')
    expect(result).toEqual(sample)
  })

  it('liefert leeres Array wenn keine Signups vorhanden', async () => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: [], error: null }),
    }
    const client = { from: vi.fn().mockReturnValue(chain) }
    const result = await fetchSessionSignupsWithProfiles('sess-1', client)
    expect(result).toEqual([])
  })

  it('wirft, wenn supabase einen Fehler liefert', async () => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: null, error: { message: 'fail' } }),
    }
    const client = { from: vi.fn().mockReturnValue(chain) }
    await expect(fetchSessionSignupsWithProfiles('sess-1', client)).rejects.toThrow(/fail/)
  })

  it('wirft, wenn sessionId fehlt', async () => {
    await expect(fetchSessionSignupsWithProfiles(null)).rejects.toThrow()
  })
})

// ---------------------------------------------------------------------------
// Vergessene Check-Outs: "Ich weiss es nicht mehr"
// ---------------------------------------------------------------------------

describe('dismissPendingCheckout', () => {
  it('setzt checked_out_at auf jetzt, ohne goal_after oder rating zu schreiben', async () => {
    const updated = {}
    const chain = {
      update: vi.fn(function (patch) {
        updated.patch = patch
        return this
      }),
      eq: vi.fn(function (col, val) {
        updated.where = updated.where || []
        updated.where.push({ col, val })
        return this.eq.mock.calls.length >= 2
          ? Promise.resolve({ data: null, error: null })
          : this
      }),
    }
    // Wir muessen den eq-Chain manuell aufbauen, weil eq zweimal aufgerufen wird
    // und nur das letzte das Promise zurueckgibt.
    const chain2 = {
      update: vi.fn(function (patch) {
        updated.patch = patch
        return chain2
      }),
      _calls: [],
      eq: vi.fn(function (col, val) {
        chain2._calls.push({ col, val })
        if (chain2._calls.length >= 2) {
          return Promise.resolve({ data: null, error: null })
        }
        return chain2
      }),
    }
    const client = { from: vi.fn().mockReturnValue(chain2) }

    await dismissPendingCheckout('u1', 'sess-1', client)

    expect(client.from).toHaveBeenCalledWith('attendances')
    expect(chain2.update).toHaveBeenCalled()
    expect(updated.patch).toHaveProperty('checked_out_at')
    expect(typeof updated.patch.checked_out_at).toBe('string')
    // Wichtig: KEIN goal_after, KEIN rating im Patch
    expect(updated.patch).not.toHaveProperty('goal_after')
    expect(updated.patch).not.toHaveProperty('rating')
    // Filter auf user_id und session_id
    expect(chain2._calls).toEqual(
      expect.arrayContaining([
        { col: 'user_id', val: 'u1' },
        { col: 'session_id', val: 'sess-1' },
      ])
    )
  })

  it('wirft, wenn supabase einen Fehler liefert', async () => {
    const chain = {
      update: vi.fn().mockReturnThis(),
      _n: 0,
      eq: vi.fn(function () {
        this._n += 1
        if (this._n >= 2) return Promise.resolve({ data: null, error: { message: 'rls' } })
        return this
      }),
    }
    const client = { from: vi.fn().mockReturnValue(chain) }
    await expect(dismissPendingCheckout('u1', 'sess-1', client)).rejects.toThrow(/rls/)
  })

  it('wirft, wenn userId fehlt', async () => {
    await expect(dismissPendingCheckout(null, 'sess-1')).rejects.toThrow()
  })

  it('wirft, wenn sessionId fehlt', async () => {
    await expect(dismissPendingCheckout('u1', null)).rejects.toThrow()
  })
})

// ---------------------------------------------------------------------------
// Streak-Frontend-Anbindung
// ---------------------------------------------------------------------------

describe('fetchUserStreak', () => {
  it('ruft die RPC get_user_streak mit p_user_id auf und liefert den Integer-Wert', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: 4, error: null })
    const client = { rpc }
    const result = await fetchUserStreak('u1', client)
    expect(rpc).toHaveBeenCalledWith('get_user_streak', { p_user_id: 'u1' })
    expect(result).toBe(4)
  })

  it('liefert 0, wenn Daten null sind', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: null })
    const client = { rpc }
    const result = await fetchUserStreak('u1', client)
    expect(result).toBe(0)
  })

  it('liefert 0 bei Fehler statt zu werfen (defensiv, Dashboard soll nicht crashen)', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: { message: 'rpc not found' } })
    const client = { rpc }
    const result = await fetchUserStreak('u1', client)
    expect(result).toBe(0)
  })

  it('liefert 0, wenn userId fehlt', async () => {
    const rpc = vi.fn()
    const client = { rpc }
    const result = await fetchUserStreak(null, client)
    expect(result).toBe(0)
    expect(rpc).not.toHaveBeenCalled()
  })
})
