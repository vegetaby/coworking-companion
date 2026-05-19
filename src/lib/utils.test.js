import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  formatDate,
  formatDateLong,
  getSessionLiveStatus,
  isSessionPast,
  isSessionLive,
} from './utils'

describe('utils', () => {
  describe('formatDate', () => {
    it('formatiert Datum kurz mit Tag und Monat', () => {
      expect(formatDate('2026-03-05')).toBe('Do, 5. Mar')
      expect(formatDate('2026-05-19')).toBe('Di, 19. Mai')
    })
  })

  describe('formatDateLong', () => {
    it('nutzt korrekten März-Umlaut', () => {
      expect(formatDateLong('2026-03-05')).toBe('Donnerstag, 5. März 2026')
    })
    it('nutzt Mai korrekt', () => {
      expect(formatDateLong('2026-05-19')).toBe('Dienstag, 19. Mai 2026')
    })
  })

  describe('getSessionLiveStatus', () => {
    beforeEach(() => {
      // Fix "now" auf einen bekannten Wert
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-05-19T10:30:00Z'))
    })
    afterEach(() => {
      vi.useRealTimers()
    })

    it('past — Session in der Vergangenheit', () => {
      const s = { date: '2026-03-05', start_time: '14:00:00', end_time: '16:00:00' }
      expect(getSessionLiveStatus(s)).toBe('past')
      expect(isSessionPast(s)).toBe(true)
    })

    it('past — Session in der Vergangenheit mit HH:MM-Format', () => {
      const s = { date: '2026-03-05', startTime: '14:00', endTime: '16:00' }
      expect(getSessionLiveStatus(s)).toBe('past')
    })

    it('scheduled — Session in der Zukunft', () => {
      const s = { date: '2026-05-25', start_time: '14:00:00', end_time: '16:00:00' }
      expect(getSessionLiveStatus(s)).toBe('scheduled')
      expect(isSessionPast(s)).toBe(false)
    })

    it('live — Session läuft gerade (HH:MM:SS-Format aus Supabase)', () => {
      // now = 2026-05-19T10:30:00Z = 12:30 Berlin (DST aktiv)
      // Session 12:00-14:00 Berlin = 10:00-12:00 UTC -> während 10:30 UTC ist live
      // Achtung: new Date("2026-05-19T10:00:00") wird als LOKAL-Zeit interpretiert
      // im Test-Runner. Wir nutzen UTC explizit.
      const today = new Date().toISOString().slice(0, 10)
      const s = { date: today, start_time: '00:00:00', end_time: '23:59:00' }
      expect(getSessionLiveStatus(s)).toBe('live')
      expect(isSessionLive(s)).toBe(true)
    })

    it('scheduled — fehlende Zeiten fallen auf session.status zurück', () => {
      const s = { date: '2026-05-25', status: 'cancelled' }
      expect(getSessionLiveStatus(s)).toBe('cancelled')
    })

    it('scheduled — kein date', () => {
      expect(getSessionLiveStatus({})).toBe('scheduled')
      expect(getSessionLiveStatus(null)).toBe('scheduled')
    })

    it('handhabt HH:MM:SS.ms Format (Postgres mit microseconds)', () => {
      const s = { date: '2026-03-05', start_time: '14:00:00.123', end_time: '16:00:00.456' }
      expect(getSessionLiveStatus(s)).toBe('past')
    })
  })
})
