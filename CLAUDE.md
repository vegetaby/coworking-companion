# CoWorking Space Companion — Projekt-Kontext für Claude Code

## Was ist das?

Begleit-Webapp für die Skool-Community "The CoWorking Space (DE)". Ergänzt Skool
um Session-Anmeldungen, Check-In/Out, Streaks, Leaderboard, persönliche
Fokus-Routinen. **Echte User** (~50 Skool-Members) sollen drauf laufen.

**Hosts**: Marcel (admin, marcelkoerner0490@gmail.com) und Britta.

## Tech-Stack — **Standard, nicht verhandelbar**

| Schicht | Tool |
|---|---|
| Frontend | Vite + React 18 + JSX (kein TypeScript im Frontend, plain JS) |
| Styling | Tailwind CSS + Inline-Style-Theme (`src/lib/theme.js`) |
| Routing | react-router-dom v6 |
| Auth + DB | Supabase (`@supabase/supabase-js`) |
| Hosting | Netlify (Auto-Deploy bei `git push`) |
| Tests | Vitest + @testing-library/react + jsdom |
| Edge / Cron | Netlify Scheduled Functions (Free-Tier reicht) |

**Bewusst NICHT genutzt**:
- TypeScript im Frontend (Marcel ist non-coder, JSX ist einfacher)
- Tailwind UI / shadcn / komplexe Component-Libraries (eigene minimal-Components)
- Lovable / v0.dev / andere Closed-Source-Builder (Vendor-Lock-in)

## Wichtige Verzeichnisse

```
app/
├── src/
│   ├── pages/         # eine .jsx pro Route
│   ├── components/    # ui/ (klein), layout/ (Sidebar, TopNav)
│   ├── context/       # AuthContext, AppContext, ThemeContext
│   ├── lib/           # supabase.js, theme.js, api.js, utils.js, icalParser.js
│   ├── modals/        # CheckInModal, AuthModal, …
│   ├── data/          # mockData.js (sterbender Mock-Layer)
│   └── test/          # setup.js
├── supabase/
│   ├── schema.sql               # Initial-Schema (deployed)
│   ├── migrations/              # alle weiteren Änderungen
│   └── seed.sql                 # Beispiel-Daten + Admin-Promo
├── netlify/
│   └── functions/               # Edge / Scheduled Functions
├── scripts/                     # einmalige Setup-Scripts (z.B. enable-email-provider)
├── docs/
│   └── superpowers/specs/       # approved Design-Specs (Brainstorming-Skill)
└── LAUNCH_CHECKLIST.md          # offene Punkte vor Production
```

## Supabase-Projekt

- **Project Ref**: `lfujrpzaenfptyehcwwd`
- **URL**: `https://lfujrpzaenfptyehcwwd.supabase.co`
- **Dashboard**: https://supabase.com/dashboard/project/lfujrpzaenfptyehcwwd
- **Anon Key**: in `app/.env` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
- **Service-Role Key**: nur in Netlify Function Env, niemals im Frontend
- **Tables**: profiles, sessions, session_signups, attendances, routines, leaderboard_cache
- **Auth-Provider**: Google OAuth + Email/Passwort (beide aktiv)

## Tägliche Befehle

```bash
npm run dev          # Dev-Server localhost:3000
npm run test         # Tests im Watch-Mode
npm run test:run     # Tests einmalig (CI)
npm run build        # Production-Build
```

## Konventionen

### Sprache
- **UI in Deutsch** (Marcel + Skool-Community sind deutschsprachig)
- **Code-Kommentare auf Deutsch** wenn fachlich, Englisch wenn technisch
- **Variablennamen Englisch** (Standard)

### Stil
- **Keine Emojis im Code** außer die `SUMMARY` aus Skool-Cal hat eins drin
- **Tailwind-Klassen** für Layout & Spacing, **Theme-Objekt** für Farben
- **CSS-Variablen** für Dark/Light: `rgb(var(--c-bg))` etc.
- **Kein Default-Export von Pages** mit langem Filename — Pages heißen `<Name>Page.jsx`

### Tests
- Test-Datei neben dem Code: `foo.js` + `foo.test.js`
- Vor jeder Implementation: **Test schreiben der fehlschlägt** (TDD via Superpowers)
- Tests müssen `npm run test:run` grün lassen vor jedem Commit

### Git
- Branches: meist direkt `main` (kleine Community-App, kein PR-Overhead)
- Commit-Messages auf Englisch (Standard)
- Co-Authored-By: Claude bei Claude-generierten Commits

## Workflows die schon stehen

### Auth-Flow
- `src/context/AuthContext.jsx` — kennt `signInWithGoogle`, `signInWithEmail`,
  `signUpWithEmail`, `resetPassword`, `signOut`
- Trigger `on_auth_user_created` legt Profil bei Sign-up an
- RLS-Policies erlauben Lesen für alle Eingeloggten, Schreiben nur eigene Rows

### Real-Data-Layer (in Aufbau)
- `src/lib/api.js` — alle Supabase-Calls als Funktionen
- `AppContext` hat `realSessions`, `realSignedUp`, `realAttendances`, …
- **Aktuell migriert**: MySessionsPage
- **Noch auf Mock**: Dashboard, Kalender, Leaderboard, Routinen, Analyse, Admin
  + alle Modals (CheckIn/CheckOut/Goal/Routine/CalExport)

### Theme (Dark/Light)
- `src/context/ThemeContext.jsx`, persistiert in `localStorage` Key `cw-theme`
- CSS-Vars `--c-bg`, `--c-card`, `--c-text`, `--c-text-muted`, `--c-border`, `--c-sidebar`
- Toggle in TopNav + Sidebar
- LandingPage forciert immer Dark (dunkles Hero)

### Sidebar
- `App.jsx` hält `collapsed`-State, persistiert in `localStorage` Key `cw-sidebar-collapsed`
- Mobile-Drawer mit Backdrop, Desktop-Collapse zwischen w-64 und w-16

## Skill-Workflows (Superpowers ist installiert)

**Vor jeder Feature-Arbeit:**
1. `superpowers:brainstorming` — Design klären
2. Spec nach `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`
3. `superpowers:writing-plans` — Implementations-Plan
4. `superpowers:test-driven-development` — Tests first
5. `superpowers:verification-before-completion` — vor "fertig" mit echten Befehlen prüfen

**Vor Commits:**
- `npm run test:run` muss grün sein
- `npm run build` muss grün sein

## Was Marcel von mir erwartet

- **Autonom arbeiten** — möglichst viel ohne ihn fragen zu müssen
- **Step-by-step + WARUM** bei Schritten die er selbst tun muss
- **Multiple-Choice + Empfehlung** bei Entscheidungen
- **Deutsch** in allen Antworten
- Bei größeren Refactors: erst Plan, dann Code

## Offene Punkte (siehe `LAUNCH_CHECKLIST.md` für Details)

Top 5 für nächste Sessions:
1. Andere Pages auf echte Supabase-Daten umstellen
2. Google Calendar Sync (in Arbeit, siehe Spec 2026-05-12)
3. SMTP-Provider für Confirm-Emails (Free-Limit ist 3/h)
4. Custom Domain + DSGVO (Impressum, Datenschutz)
5. Streak-Frontend an DB-Function `get_user_streak()` anbinden
