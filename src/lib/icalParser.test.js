import { describe, it, expect } from 'vitest'
import {
  unfoldLines,
  parseHostFromTitle,
  parseZoomFromDescription,
  parseICalDate,
  icalDateToDb,
  parseICal,
} from './icalParser'

describe('unfoldLines', () => {
  it('returns single-line input unchanged', () => {
    expect(unfoldLines('FOO:bar')).toBe('FOO:bar')
  })

  it('joins a continuation line that starts with space', () => {
    const input = 'DESCRIPTION:Hello\r\n World\r\nNEXT:foo'
    expect(unfoldLines(input)).toBe('DESCRIPTION:HelloWorld\r\nNEXT:foo')
  })

  it('joins continuation lines that start with tab', () => {
    const input = 'A:1\r\n\tcontinued\r\nB:2'
    expect(unfoldLines(input)).toBe('A:1continued\r\nB:2')
  })

  it('handles LF-only line endings (some feeds use \\n)', () => {
    const input = 'A:1\n more\nB:2'
    expect(unfoldLines(input)).toBe('A:1more\nB:2')
  })
})

describe('parseHostFromTitle', () => {
  it('extracts host and strips trailing " - HOST" from real Skool event', () => {
    expect(parseHostFromTitle('🎯 1h Focus Session - Britta')).toEqual({
      title: '1h Focus Session',
      host: 'Britta',
    })
  })

  it('handles title without emoji', () => {
    expect(parseHostFromTitle('2h Focus Session - Marcel')).toEqual({
      title: '2h Focus Session',
      host: 'Marcel',
    })
  })

  it('returns host "Unbekannt" when no " - HOST" pattern', () => {
    expect(parseHostFromTitle('Random Event Title')).toEqual({
      title: 'Random Event Title',
      host: 'Unbekannt',
    })
  })

  it('trims whitespace around title and host', () => {
    expect(parseHostFromTitle('  🎯  2h Focus Session  -  Britta  ')).toEqual({
      title: '2h Focus Session',
      host: 'Britta',
    })
  })

  it('handles host names with umlauts', () => {
    expect(parseHostFromTitle('Workshop - Jörg')).toEqual({
      title: 'Workshop',
      host: 'Jörg',
    })
  })
})

describe('parseZoomFromDescription', () => {
  it('extracts a us06web.zoom.us link from real Skool description', () => {
    const desc = 'Zoom: https://us06web.zoom.us/j/4901062541?pwd=Z2UzVCtjY2xBamxrdHUxRExpd3V2UT09'
    expect(parseZoomFromDescription(desc)).toBe(
      'https://us06web.zoom.us/j/4901062541?pwd=Z2UzVCtjY2xBamxrdHUxRExpd3V2UT09',
    )
  })

  it('extracts plain zoom.us links', () => {
    expect(parseZoomFromDescription('Join here: https://zoom.us/j/123456789')).toBe(
      'https://zoom.us/j/123456789',
    )
  })

  it('returns null when no zoom link present', () => {
    expect(parseZoomFromDescription('Just some text without a link')).toBeNull()
  })

  it('returns null for empty or null input', () => {
    expect(parseZoomFromDescription('')).toBeNull()
    expect(parseZoomFromDescription(null)).toBeNull()
    expect(parseZoomFromDescription(undefined)).toBeNull()
  })

  it('returns the first zoom link when multiple are present', () => {
    const desc = 'Old: https://zoom.us/j/111 New: https://us06web.zoom.us/j/222'
    expect(parseZoomFromDescription(desc)).toBe('https://zoom.us/j/111')
  })
})

describe('parseICalDate', () => {
  it('parses a UTC date string like 20260508T040000Z', () => {
    const d = parseICalDate('20260508T040000Z')
    expect(d).toBeInstanceOf(Date)
    expect(d.toISOString()).toBe('2026-05-08T04:00:00.000Z')
  })

  it('parses date-only strings (whole-day events) as midnight UTC', () => {
    const d = parseICalDate('20260508')
    expect(d.toISOString()).toBe('2026-05-08T00:00:00.000Z')
  })

  it('returns null for invalid input', () => {
    expect(parseICalDate('not-a-date')).toBeNull()
    expect(parseICalDate('')).toBeNull()
    expect(parseICalDate(null)).toBeNull()
  })
})

describe('icalDateToDb', () => {
  // 2026-05-08T04:00:00Z = 06:00 Europe/Berlin (Sommerzeit MESZ, UTC+2)
  it('converts UTC date to Europe/Berlin date + time during DST', () => {
    const d = new Date('2026-05-08T04:00:00.000Z')
    expect(icalDateToDb(d)).toEqual({
      date: '2026-05-08',
      time: '06:00:00',
    })
  })

  // 2026-01-15T09:00:00Z = 10:00 Europe/Berlin (Winterzeit MEZ, UTC+1)
  it('converts UTC date to Europe/Berlin date + time during winter time', () => {
    const d = new Date('2026-01-15T09:00:00.000Z')
    expect(icalDateToDb(d)).toEqual({
      date: '2026-01-15',
      time: '10:00:00',
    })
  })

  // Crossing midnight: 22:30 UTC on 2026-03-10 = 23:30 Berlin same day
  // But 23:30 UTC on 2026-03-10 = 00:30 Berlin next day (during winter MEZ)
  it('handles dates that cross the day boundary in Europe/Berlin', () => {
    const d = new Date('2026-02-10T23:30:00.000Z')
    expect(icalDateToDb(d)).toEqual({
      date: '2026-02-11',
      time: '00:30:00',
    })
  })
})

const SAMPLE_ICAL = `BEGIN:VCALENDAR
PRODID:-//Google Inc//Google Calendar 70.9054//EN
VERSION:2.0
X-WR-CALNAME:Skool CoWorking
X-WR-TIMEZONE:Europe/Berlin
BEGIN:VEVENT
DTSTART:20260508T040000Z
DTEND:20260508T050000Z
DTSTAMP:20260506T171529Z
UID:event-1@google.com
DESCRIPTION:⏰ Unsere Focus-Session\\n1-Stunden-Slot\\n\\nZoom: https://us06we
 b.zoom.us/j/4901062541?pwd=secret
SUMMARY:🎯 1h Focus Session - Britta
STATUS:CONFIRMED
END:VEVENT
BEGIN:VEVENT
DTSTART:20260509T080000Z
DTEND:20260509T100000Z
UID:event-2@google.com
SUMMARY:🎯 2h Focus Session - Marcel
STATUS:CONFIRMED
END:VEVENT
BEGIN:VEVENT
DTSTART:20260510T080000Z
DTEND:20260510T100000Z
UID:event-3@google.com
SUMMARY:Cancelled Event - Marcel
STATUS:CANCELLED
END:VEVENT
END:VCALENDAR`

describe('parseICal', () => {
  it('parses sample feed into 3 events', () => {
    const result = parseICal(SAMPLE_ICAL)
    expect(result.events).toHaveLength(3)
  })

  it('extracts UID, title, host, dates from first event', () => {
    const result = parseICal(SAMPLE_ICAL)
    const e = result.events[0]
    expect(e.uid).toBe('event-1@google.com')
    expect(e.title).toBe('1h Focus Session')
    expect(e.host).toBe('Britta')
    expect(e.start.toISOString()).toBe('2026-05-08T04:00:00.000Z')
    expect(e.end.toISOString()).toBe('2026-05-08T05:00:00.000Z')
  })

  it('extracts zoom link across folded lines', () => {
    const result = parseICal(SAMPLE_ICAL)
    expect(result.events[0].zoomLink).toBe(
      'https://us06web.zoom.us/j/4901062541?pwd=secret',
    )
  })

  it('returns null zoomLink when description has no link', () => {
    const result = parseICal(SAMPLE_ICAL)
    expect(result.events[1].zoomLink).toBeNull()
  })

  it('marks CANCELLED events with status=cancelled', () => {
    const result = parseICal(SAMPLE_ICAL)
    expect(result.events[2].status).toBe('cancelled')
  })

  it('marks non-cancelled events as confirmed', () => {
    const result = parseICal(SAMPLE_ICAL)
    expect(result.events[0].status).toBe('confirmed')
  })

  it('handles empty or non-VCALENDAR input gracefully', () => {
    expect(parseICal('').events).toEqual([])
    expect(parseICal('not valid ical').events).toEqual([])
  })
})
