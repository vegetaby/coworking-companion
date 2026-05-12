# Pre-Launch Checkliste — CoWorking Space Companion

Stand: 2026-04-29

Reihenfolge der Sektionen ungefähr nach Priorität für den Live-Gang.
Erledigte Punkte sind mit ✓ markiert.

---

## 🔐 Auth & Security

- [x] Email/Passwort + Google OAuth
- [x] Supabase Email-Provider aktiv
- [ ] **Site URL** in Supabase auf Production-Domain setzen
      (Authentication → URL Configuration → Site URL)
- [ ] **Redirect URLs** auf Production + Preview-Deploys whitelisten
- [ ] **SMTP-Provider** (Resend / Postmark / SendGrid) anbinden
      → ohne den schlägt Bestätigungs-Mail Nr. 4/h fehl
- [ ] **Email-Templates** branden + auf Deutsch übersetzen
      (Confirm Signup, Reset Password, Magic Link, Change Email)
- [ ] **Row Level Security** auf allen Tabellen + Policies pro Operation
- [ ] **Service-Role-Key** niemals im Frontend-Code (anon-Key only) — aktuell ✓
- [ ] **CSP-Header** via `netlify.toml` (mind. default-src, script-src,
      connect-src für Supabase)
- [ ] Rate-Limiting auf sensiblen Endpunkten (Sign-up, Reset)
- [ ] `.env` in `.gitignore` — aktuell ✓

## 🗄️ Daten / Backend (Mocks raus)

- [x] Schema deployed: `profiles`, `sessions`, `session_signups`,
      `attendances`, `routines`, `leaderboard_cache` (siehe `supabase/schema.sql`)
- [x] RLS-Policies aktiv auf allen Tabellen
- [x] Trigger `on_auth_user_created` legt Profil automatisch bei Sign-up an
      (verifiziert — eigenes Profil ist drin)
- [x] Trigger `set_updated_at` auf `profiles`
- [x] Indexes auf häufig gefilterten Feldern
- [ ] **Sessions seeden** — Admin-UI "Session anlegen" oder SQL-Seed mit 1–2 Beispiel-Sessions
- [ ] **AppContext umstellen** — statt `MOCK_*` echte Supabase-Queries:
  - [ ] `MOCK_SESSIONS` → `supabase.from('sessions').select(...)`
  - [ ] `signedUp` Set → `session_signups`-Tabelle
  - [ ] `goals` Object → `attendances.goal_before` / `goal_after`
  - [ ] `checkedIn` Set + `checkInData` / `checkOutData` → `attendances.checked_in_at` / `checked_out_at` / `routine_states`
  - [ ] `MOCK_ROUTINES` → `routines`-Tabelle
- [ ] **Pro Seite umstellen** (DashboardPage, CalendarPage, MySessionsPage, RoutinesPage, AnalysePage, LeaderboardPage, AdminPage)
- [ ] Loading-States in jedem async-Komponenten
- [ ] Error-Handling (Toast bei Supabase-Fehlern)
- [ ] **Streaks/Leaderboard** — Logik in SQL (Edge Function oder Cron) statt JS
- [ ] **Migration anlegen** — `supabase/schema.sql` ist im Repo, aber nicht als
      Supabase-Migration formatiert (`supabase/migrations/<timestamp>_init.sql`).
      Beim nächsten Schema-Change wäre das nötig.

## 🛣️ Routes & Auth-Flow

- [ ] `/reset-password` Route — Landing nach Reset-Link aus Email
- [ ] `/auth/callback` für OAuth-Redirect (Supabase fängt das automatisch via
      `detectSessionInUrl: true`, aber dedizierte Loading-Page wäre besser)
- [ ] 404-Seite
- [ ] Error-Boundary um die ganze App

## 📧 Email / Kommunikation

- [ ] SMTP angebunden (s.o.)
- [ ] Confirm-Signup auf Deutsch + Brand
- [ ] Reset-Password auf Deutsch + Brand
- [ ] Optional: Welcome-Mail nach erstem Login (z.B. via Supabase Edge Function
      oder Resend-API direkt)

## 🎨 Frontend / UX

- [x] Dark/Light Mode Toggle
- [x] Sidebar einklappbar (Desktop) + Mobile-Drawer
- [x] Meine Sessions Layout
- [ ] Empty-States (z.B. "noch keine Sessions" mit CTA)
- [ ] Loading-States in allen async-Komponenten (nicht nur App-Init)
- [ ] Toast-Notifications (z.B. `sonner`) für Erfolg/Fehler statt inline-Alerts
- [ ] Onboarding-Flow nach Sign-up (Avatar, display_name, Skool-Link)
- [ ] Lighthouse-Pass auf Mobile (a11y, contrast)
- [ ] Light-Mode auf allen Seiten visuell durchprüfen
      (insb. Modals, Cards, Charts — viele Stellen mit `${T.danger}30` u.ä.)

## 🚀 Deployment & Operations

- [x] Netlify Auto-Deploy bei git push
- [ ] Custom Domain + HTTPS
- [ ] Netlify Environment Variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
      — *nicht* die `.env` aus dem Repo nutzen
- [ ] **Sentry** oder **Better Stack** für Error-Tracking (Frontend + Supabase)
- [ ] **Plausible** oder **PostHog (EU-Cloud)** für DSGVO-konformes Analytics
- [ ] Uptime-Monitoring (z.B. Better Stack Free)
- [ ] DB-Backups (Supabase macht das im Pro-Plan automatisch täglich)

## ⚖️ Legal / Compliance (DSGVO)

- [ ] **Impressum** (TMG §5) — Pflicht in DE
- [ ] **Datenschutzerklärung** mit Auflistung: Supabase (US/EU?), Netlify, Google OAuth
- [ ] AGB / Nutzungsbedingungen
- [ ] Cookie-Banner falls Analytics ohne IP-Anonymisierung
- [ ] **AVV** (Auftragsverarbeitungsvertrag) mit Supabase + Netlify
- [ ] Supabase-Region: prüfen ob auf EU-Server (Frankfurt) — in Project-Settings

## 🧪 Quality / Testing

- [ ] **Vitest** + Testing Library Setup
- [ ] **Superpowers** Plugin installieren (TDD-Enforcement)
- [ ] Unit-Tests: AuthContext, ThemeContext, Theme-Switching
- [ ] Integration-Test: Login-Flow End-to-End mit Mock-Supabase
- [ ] E2E mit Playwright (optional, aber stark empfohlen vor Launch)
- [ ] CI: GitHub Actions oder Netlify Build-Hook → Tests müssen grün sein
      bevor deploy läuft

## 📊 Performance

- [ ] Lighthouse-Audit (Ziel: >90 in allen 4 Kategorien)
- [ ] Bundle-Analyse (`vite build` zeigt aktuell 471 kB ungzipped / 130 kB gzip)
- [ ] Lazy-Loading der Page-Components via `React.lazy()`
- [ ] Image-Optimierung — Unsplash-URLs nutzen schon `q=80&w=…` ✓
- [ ] Preload kritischer Fonts

## 📚 Docs (Repo)

- [ ] README mit Setup-Anleitung
- [ ] CLAUDE.md für Projekt-spezifische Konventionen (Skool-Link, Brand-Farben,
      Tech-Stack)
- [ ] CHANGELOG.md ab v1.0
