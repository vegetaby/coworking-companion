# Calendar Sync Design

**Datum**: 2026-05-12
**Status**: Approved (Marcel, 2026-05-12)
**Scope**: Google-Calendar → Supabase-Sessions Sync, einmal täglich automatisch.

---

## Problem

Aktuell sind Sessions in der App fest verdrahtete Mock-Daten (`src/data/mockData.js`).
Echte Sessions werden im Skool-Kalender und im Google-Kalender gepflegt.
Wir brauchen einen automatischen Sync, damit die App immer aktuelle Sessions zeigt
ohne manuelle Pflege in der DB.

## Nicht-Ziele (Out of Scope)

- Bidirektionale Sync (App schreibt nicht in Google Cal zurück)
- Echtzeit-Updates (kein Push-Notification-Listener, daily reicht)
- Multi-Calendar (nur der eine Skool-Calendar)
- Skool → Google Sync (separater Workflow, später per Diskussion)

## Architektur

```
Google Calendar (iCal-Feed, public, kein Auth)
        ▼
Netlify Scheduled Function   (täglich, 03:00 UTC)
        │
        ├─ Fetch iCal
        ├─ Parse Events
        ├─ Upsert in Supabase via google_event_id
        ├─ Soft-cancel verschwundene Events
        └─ RPC update_session_statuses()
        ▼
Supabase sessions-Tabelle
        ▼
Webapp (read-only via @supabase/supabase-js)
```

**Sync-Quelle**: iCal-URL des öffentlichen Google-Kalenders
(`https://calendar.google.com/calendar/ical/.../public/basic.ics`)

**Sync-Frequenz**: 1× täglich um 03:00 UTC (= 04:00 oder 05:00 Europe/Berlin
je nach DST). Konfigurierbar via Cron-Syntax in `netlify.toml`.

**Sync-Host**: Netlify Scheduled Function. Liegt im Repo, deployed bei `git push`,
Free-Tier reicht (3.000 Function-Calls/Monat).

## Datenmodell-Änderungen

Migration: `supabase/migrations/002_calendar_sync.sql`

### Neue Spalte
```sql
ALTER TABLE public.sessions ADD COLUMN google_event_id TEXT UNIQUE;
CREATE INDEX idx_sessions_google_event_id ON public.sessions (google_event_id);
```

### Neue Funktionen (portiert aus `coworking-production/schema.sql`)

- `update_session_statuses()` — schaltet Status anhand der Uhrzeit:
  - `scheduled` → `live` wenn jetzt zwischen start_time und end_time
  - `live` → `past` wenn end_time vorbei
- `get_user_streak(user_id)` — wöchentliche Streak (consecutive Wochen mit ≥1 Check-In)
- `get_slot_streaks(user_id)` — angepasst an unser date+time Schema

### Neue View

- `sessions_with_counts` — Sessions mit `attendee_count` und `checkedin_count` als
  Spalten (joined aus `session_signups` und `attendances`)

## iCal-Parser

Datei: `src/lib/icalParser.js`

Reine JS-Funktionen ohne externe Dependencies (parsing ist trivial genug):

```js
parseICal(text) → { events: ParsedEvent[] }
parseHostFromTitle(summary) → { title, host }
parseZoomFromDescription(desc) → zoomLink | null
parseICalDate(string) → Date (UTC)
icalDateToDbDateAndTime(date) → { date: 'YYYY-MM-DD', start_time: 'HH:MM:SS' }
                                          // in Europe/Berlin
```

**Test-First (TDD)**: Tests in `src/lib/icalParser.test.js`. Reale Sample-Events
aus dem produktiven Feed als Fixtures. Mind. 1 Test pro Edge-Case:
- Event mit Cancelled-Status
- Event ohne Host (Regex matched nicht)
- Event ohne Zoom-Link
- Event über Tageswechsel
- Folded Lines (iCal-Specs: Zeilen über 75 Chars sind gefaltet)
- DST-Übergang

## Sync-Function

Datei: `netlify/functions/sync-calendar.mts` (TypeScript wegen Netlify Function
Runtime — ist ein Implementations-Detail, keine Architektur-Änderung).

### Konfiguration (Netlify Environment Variables)

| Variable | Quelle | Warum |
|---|---|---|
| `SUPABASE_URL` | Marcel kopiert aus Supabase Dashboard | DB-Verbindung |
| `SUPABASE_SERVICE_ROLE_KEY` | Marcel kopiert aus Supabase Dashboard | Schreibrechte umgehen RLS — nur in Server-Code, niemals im Frontend |
| `GOOGLE_CAL_ICAL_URL` | Marcel hat den Link bereits | iCal-Feed-URL |

### Logik

```typescript
1. Fetch ical-URL
2. parseICal(text)
3. Für jedes Event:
   a. Bestehende Row mit gleichem google_event_id suchen
   b. Mappen iCal-Felder → DB-Felder
   c. Wenn vorhanden: UPDATE
      Wenn nicht: INSERT
   d. Bei CANCELLED-Status: status='cancelled'
4. Sessions in DB die google_event_id haben, aber nicht im aktuellen Feed:
   → status='cancelled' (Soft-Delete)
   Manual angelegte Sessions (google_event_id IS NULL) NICHT anfassen.
5. RPC: update_session_statuses()
6. Return JSON-Summary { synced, created, updated, cancelled }
```

### Schedule

In `netlify.toml`:
```toml
[functions."sync-calendar"]
  schedule = "0 3 * * *"  # täglich um 03:00 UTC
```

### Manuelle Auslösung

GET/POST auf `https://<site>.netlify.app/.netlify/functions/sync-calendar`
führt den Sync sofort aus. Praktisch zum Debuggen + für späteren
Admin-Button in der App.

## Mapping iCal → DB

| iCal-Feld | DB-Spalte | Transform |
|---|---|---|
| `UID` | `google_event_id` | 1:1 |
| `SUMMARY` | `title` + `host_name` | Regex: emoji+title+" - "+host |
| `DTSTART` (UTC) | `date` + `start_time` | TZ-Convert zu Europe/Berlin |
| `DTEND` (UTC) | `end_time` | TZ-Convert |
| `DESCRIPTION` | `zoom_link` | Regex auf `https://*.zoom.us/...` |
| `STATUS:CANCELLED` | `status='cancelled'` | direkt |
| nicht mehr im Feed | `status='cancelled'` | Soft-Delete |
| `host_id` | versuche profile.display_name match, sonst NULL | |

## Edge Cases

- **Cal nicht erreichbar**: Function failed, Logs in Netlify, alter Stand bleibt. Kein Daten-Verlust.
- **Doppelte UIDs**: kann nicht passieren (Google generiert eindeutig)
- **Bestehende manuelle Sessions** (google_event_id IS NULL): bleiben unangetastet
- **Wiederholungs-Events (RRULE)**: NICHT supported in v1 — wir nehmen `singleEvents`-equivalent über das URL-Parameter wenn nötig. Falls Skool wiederkehrende Sessions hat, wird das eine Iteration v2.
- **Sehr alte Events**: Google iCal-Feed liefert standardmäßig ±30 Tage. Historische Sessions vor diesem Fenster werden nicht (re-)synchronisiert. Soft-Cancel berücksichtigt das (siehe unten).

### Wichtig: Soft-Cancel-Logik mit dem 30-Tage-Fenster

Wenn wir einfach "Session in DB, nicht mehr im Feed → cancel" machen, würden ALLE
historischen Sessions ältere als 30 Tage gecancelt. **Fix**:

```sql
-- Nur Sessions cancellen, die NACH dem ältesten Event im aktuellen Feed liegen
UPDATE sessions
SET status = 'cancelled'
WHERE google_event_id IS NOT NULL
  AND google_event_id NOT IN (current_feed_uids)
  AND date >= (SELECT MIN(date) FROM current_feed_events)
```

## Sicherheit

- `SUPABASE_SERVICE_ROLE_KEY` **nur** in Netlify Function Env. Niemals im Frontend-Bundle.
- iCal-URL ist public, kann öffentlich sein
- Function-URL ist potentiell öffentlich aufrufbar — Schaden durch ungebetenen
  Aufruf: maximal eine zusätzliche Sync-Runde. Akzeptabel.
- Bei späterer Sensibilität: Function via `?secret=...` Query-Param schützen.

## Testing-Plan

### Unit Tests (TDD)
- `icalParser.test.js`: alle Parser-Funktionen + Edge Cases
- mind. 10 Tests

### Integration Tests
- `sync-calendar.test.ts`: Mock Supabase-Client + Mock fetch → verifiziere
  Upsert-Calls. (Schreiben wir wenn der Code steht und stabilisiert ist.)

### Manuelle Verifikation
1. Function lokal mit `netlify dev` ausführen
2. Curl auf Function-URL
3. SQL-Abfrage: `SELECT count(*), max(updated_at) FROM sessions WHERE google_event_id IS NOT NULL`
4. App-Seite `/kalender` zeigt die echten Sessions

## Roll-Out

1. Migration im Supabase Dashboard ausführen (Marcel oder ich mit PAT)
2. Code committen, `git push` → Netlify deployed Function automatisch
3. In Netlify Dashboard: Environment Variables setzen (Marcel macht's, einmalig)
4. Function manuell triggern via curl → verifizieren
5. Nächste Nacht 03:00 UTC läuft erster automatischer Sync
6. App-Frontend von Mock auf echte sessions umstellen (separater Schritt nach Sync-Verifikation)

## Was DANACH offen bleibt

- Andere Pages (Dashboard, Kalender, Leaderboard, Analyse, Admin) auf echte
  Supabase-Daten umstellen
- Streak-Frontend mit `get_user_streak()` und `get_slot_streaks()` verkabeln
- Admin-UI "Session manuell anlegen" + "Jetzt sync triggern"
- Skool ↔ Google Cal Sync (offene Diskussion mit Marcel + Britta)
