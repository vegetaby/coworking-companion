// Per RFC 5545: a line beginning with SPACE or HTAB is a continuation
// of the previous line; the leading whitespace char is consumed.
export function unfoldLines(text) {
  return text.replace(/\r?\n[ \t]/g, '')
}

const EMOJI_PREFIX = /^\s*[\p{Extended_Pictographic}‍️]+\s*/u

export function parseHostFromTitle(summary) {
  const cleaned = summary.replace(EMOJI_PREFIX, '').trim()
  const hostMatch = cleaned.match(/^(.+?)\s+-\s+([^-\s]+(?:\s+[^-\s]+)*?)\s*$/)
  if (hostMatch) {
    return { title: hostMatch[1].trim(), host: hostMatch[2].trim() }
  }
  return { title: cleaned, host: 'Unbekannt' }
}

const ZOOM_URL = /https:\/\/(?:[a-z0-9-]+\.)?zoom\.us\/[^\s]+/i

export function parseZoomFromDescription(desc) {
  if (!desc) return null
  const match = desc.match(ZOOM_URL)
  return match ? match[0] : null
}

const ICAL_DATETIME = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})Z?)?$/

export function parseICalDate(input) {
  if (!input || typeof input !== 'string') return null
  const m = input.match(ICAL_DATETIME)
  if (!m) return null
  const [, y, mo, d, h = '00', mi = '00', s = '00'] = m
  const iso = `${y}-${mo}-${d}T${h}:${mi}:${s}.000Z`
  const date = new Date(iso)
  return isNaN(date.getTime()) ? null : date
}

// Formats a Date into Europe/Berlin local date + time strings for DB storage.
// Uses Intl to handle DST correctly without external libs.
const BERLIN_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Berlin',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
})

export function icalDateToDb(date) {
  const parts = BERLIN_FORMATTER.formatToParts(date)
  const get = (type) => parts.find((p) => p.type === type)?.value ?? '00'
  // en-CA locale returns hour as '24' for midnight; normalize.
  const hour = get('hour') === '24' ? '00' : get('hour')
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    time: `${hour}:${get('minute')}:${get('second')}`,
  }
}

// Decodes iCal-escaped text. Per RFC 5545: \n -> newline, \, -> comma,
// \; -> semicolon, \\ -> backslash.
function unescapeICalText(value) {
  return value
    .replace(/\\n/gi, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\')
}

export function parseICal(text) {
  if (!text || !text.includes('BEGIN:VCALENDAR')) {
    return { events: [] }
  }
  const unfolded = unfoldLines(text)
  const lines = unfolded.split(/\r?\n/)

  const events = []
  let current = null

  for (const raw of lines) {
    if (raw === 'BEGIN:VEVENT') {
      current = {}
      continue
    }
    if (raw === 'END:VEVENT') {
      if (current && current.uid && current.start && current.end) {
        const { title, host } = parseHostFromTitle(current.summary || '')
        events.push({
          uid: current.uid,
          title,
          host,
          start: current.start,
          end: current.end,
          summary: current.summary || '',
          description: current.description || null,
          zoomLink: parseZoomFromDescription(current.description || ''),
          status: current.status === 'CANCELLED' ? 'cancelled' : 'confirmed',
        })
      }
      current = null
      continue
    }
    if (!current) continue

    const colonIdx = raw.indexOf(':')
    if (colonIdx === -1) continue
    const key = raw.slice(0, colonIdx).split(';')[0].toUpperCase()
    const value = raw.slice(colonIdx + 1)

    switch (key) {
      case 'UID':
        current.uid = value
        break
      case 'SUMMARY':
        current.summary = unescapeICalText(value)
        break
      case 'DESCRIPTION':
        current.description = unescapeICalText(value)
        break
      case 'DTSTART':
        current.start = parseICalDate(value)
        break
      case 'DTEND':
        current.end = parseICalDate(value)
        break
      case 'STATUS':
        current.status = value.toUpperCase()
        break
    }
  }

  return { events }
}
