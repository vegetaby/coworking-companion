import type { Config } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'
import { syncCalendar } from '../../src/lib/syncCalendar.js'

// Daily scheduled sync: pulls Google Calendar iCal into Supabase sessions.
// Can also be triggered manually via GET/POST to this function's URL.
export default async (req: Request) => {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  const icalUrl = process.env.GOOGLE_CAL_ICAL_URL

  if (!url || !key || !icalUrl) {
    return Response.json(
      {
        success: false,
        error:
          'Missing env vars. Need SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GOOGLE_CAL_ICAL_URL.',
      },
      { status: 500 },
    )
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  try {
    const result = await syncCalendar({ icalUrl, supabase })
    return Response.json({ success: true, ...result })
  } catch (err) {
    return Response.json(
      { success: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    )
  }
}

// Daily at 03:00 UTC (= 04:00 or 05:00 Europe/Berlin depending on DST)
export const config: Config = {
  schedule: '0 3 * * *',
}
