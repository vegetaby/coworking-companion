// Echte Session-Daten aus Skool-Kalender (Maerz 2026)
export const MOCK_SESSIONS = [
  { id: "s1",  title: "1h Focus Session", date: "2026-03-04", startTime: "06:00", endTime: "07:00", host: "Marcel", status: "past", zoom: "https://zoom.us/j/coworking", attendees: 5 },
  { id: "s2",  title: "2h Focus Session", date: "2026-03-04", startTime: "10:00", endTime: "12:00", host: "Britta", status: "live", zoom: "https://zoom.us/j/coworking", attendees: 7 },
  { id: "s3",  title: "2h Focus Session", date: "2026-03-05", startTime: "14:00", endTime: "16:00", host: "Britta", status: "scheduled", zoom: "https://zoom.us/j/coworking", attendees: 4 },
  { id: "s4",  title: "1h Focus Session", date: "2026-03-06", startTime: "06:00", endTime: "07:00", host: "Marcel", status: "scheduled", zoom: "https://zoom.us/j/coworking", attendees: 3 },
  { id: "s5",  title: "2h Focus Session", date: "2026-03-10", startTime: "10:00", endTime: "12:00", host: "Marcel", status: "scheduled", zoom: "https://zoom.us/j/coworking", attendees: 0 },
  { id: "s6",  title: "1h Focus Session", date: "2026-03-11", startTime: "06:00", endTime: "07:00", host: "Marcel", status: "scheduled", zoom: "https://zoom.us/j/coworking", attendees: 0 },
  { id: "s7",  title: "2h Focus Session", date: "2026-03-11", startTime: "10:00", endTime: "12:00", host: "Britta", status: "scheduled", zoom: "https://zoom.us/j/coworking", attendees: 0 },
  { id: "s8",  title: "2h Focus Session", date: "2026-03-12", startTime: "10:00", endTime: "12:00", host: "Britta", status: "scheduled", zoom: "https://zoom.us/j/coworking", attendees: 0 },
  { id: "s9",  title: "2h Focus Session", date: "2026-03-12", startTime: "14:30", endTime: "16:30", host: "Britta", status: "scheduled", zoom: "https://zoom.us/j/coworking", attendees: 0 },
  { id: "s10", title: "1h Focus Session", date: "2026-03-13", startTime: "06:00", endTime: "07:00", host: "Marcel", status: "scheduled", zoom: "https://zoom.us/j/coworking", attendees: 0 },
  { id: "s11", title: "2h Focus Session", date: "2026-03-17", startTime: "10:00", endTime: "12:00", host: "Marcel", status: "scheduled", zoom: "https://zoom.us/j/coworking", attendees: 0 },
  { id: "s12", title: "1h Focus Session", date: "2026-03-18", startTime: "06:00", endTime: "07:00", host: "Marcel", status: "scheduled", zoom: "https://zoom.us/j/coworking", attendees: 0 },
  { id: "s13", title: "2h Focus Session", date: "2026-03-18", startTime: "10:00", endTime: "12:00", host: "Britta", status: "scheduled", zoom: "https://zoom.us/j/coworking", attendees: 0 },
  { id: "s14", title: "2h Focus Session", date: "2026-03-19", startTime: "10:00", endTime: "12:00", host: "Britta", status: "scheduled", zoom: "https://zoom.us/j/coworking", attendees: 0 },
  { id: "s15", title: "2h Focus Session", date: "2026-03-19", startTime: "14:30", endTime: "16:30", host: "Britta", status: "scheduled", zoom: "https://zoom.us/j/coworking", attendees: 0 },
  { id: "s16", title: "1h Focus Session", date: "2026-03-20", startTime: "06:00", endTime: "07:00", host: "Marcel", status: "scheduled", zoom: "https://zoom.us/j/coworking", attendees: 0 },
  { id: "s17", title: "2h Focus Session", date: "2026-03-25", startTime: "10:00", endTime: "12:00", host: "Britta", status: "scheduled", zoom: "https://zoom.us/j/coworking", attendees: 0 },
  { id: "s18", title: "2h Focus Session", date: "2026-03-26", startTime: "10:00", endTime: "12:00", host: "Britta", status: "scheduled", zoom: "https://zoom.us/j/coworking", attendees: 0 },
  { id: "s19", title: "2h Focus Session", date: "2026-03-26", startTime: "14:30", endTime: "16:30", host: "Britta", status: "scheduled", zoom: "https://zoom.us/j/coworking", attendees: 0 },
];

export const MOCK_USER = { id: "u1", name: "Marcel Koerner", email: "marcel@example.com", avatar: null, role: "admin", streak: 12, totalSessions: 52, avgRating: 4.2, memberSince: "2025-09-15" };

export const MOCK_ATTENDANCE_HISTORY = [
  { sessionId: "prev1", title: "2h Focus Session", host: "Britta", date: "2026-02-27", startTime: "06:00", goalBefore: "Website-Relaunch planen", goalAfter: "Wireframes fertig!", rating: 5,
    routineStates: { "Handy auf Flugmodus": true, "3 Tagesaufgaben notiert": true, "Pomodoro-Timer gestartet": true } },
  { sessionId: "prev2", title: "1h Focus Session", host: "Marcel", date: "2026-02-26", startTime: "14:00", goalBefore: "3 Kundenanfragen beantworten", goalAfter: "2 von 3 geschafft", rating: 4,
    routineStates: { "Handy auf Flugmodus": true, "3 Tagesaufgaben notiert": false, "Pomodoro-Timer gestartet": true } },
  { sessionId: "prev3", title: "2h Focus Session", host: "Britta", date: "2026-02-25", startTime: "06:00", goalBefore: "Podcast-Episode schneiden", goalAfter: "Komplett fertig + hochgeladen", rating: 5,
    routineStates: { "Handy auf Flugmodus": true, "3 Tagesaufgaben notiert": true, "Pomodoro-Timer gestartet": true } },
  { sessionId: "prev4", title: "1h Focus Session", host: "Marcel", date: "2026-02-24", startTime: "14:00", goalBefore: "Steuerbelege sortieren", goalAfter: "Halb fertig", rating: 3,
    routineStates: { "Handy auf Flugmodus": false, "3 Tagesaufgaben notiert": false, "Pomodoro-Timer gestartet": false } },
  { sessionId: "prev5", title: "2h Focus Session", host: "Britta", date: "2026-02-20", startTime: "06:00", goalBefore: "Blog-Artikel schreiben", goalAfter: "Erster Entwurf steht", rating: 4,
    routineStates: { "Handy auf Flugmodus": true, "3 Tagesaufgaben notiert": true, "Stoerende Tabs geschlossen": true, "Pomodoro-Timer gestartet": false } },
  { sessionId: "prev6", title: "2h Focus Session", host: "Marcel", date: "2026-02-18", startTime: "10:00", goalBefore: "Finanzplan Q1 erstellen", goalAfter: "Grundgeruest steht, Details fehlen", rating: 3,
    routineStates: { "Handy auf Flugmodus": false, "3 Tagesaufgaben notiert": true, "Stoerende Tabs geschlossen": true, "Pomodoro-Timer gestartet": false } },
  { sessionId: "prev7", title: "1h Focus Session", host: "Britta", date: "2026-02-17", startTime: "06:00", goalBefore: "Newsletter schreiben", goalAfter: "Fertig + verschickt!", rating: 5,
    routineStates: { "Handy auf Flugmodus": true, "3 Tagesaufgaben notiert": true, "Stoerende Tabs geschlossen": true } },
  { sessionId: "prev8", title: "2h Focus Session", host: "Marcel", date: "2026-02-13", startTime: "10:00", goalBefore: "Pitch Deck ueberarbeiten", goalAfter: "80% fertig", rating: 4,
    routineStates: { "Handy auf Flugmodus": true, "3 Tagesaufgaben notiert": true, "Stoerende Tabs geschlossen": false } },
  { sessionId: "prev9", title: "2h Focus Session", host: "Marcel", date: "2026-03-11", startTime: "10:00", goalBefore: "Marketing-Strategie", goalAfter: "Grundkonzept steht", rating: 4,
    routineStates: { "Handy auf Flugmodus": true, "Wasser bereitstellen": true, "3 Tagesaufgaben notiert": true, "Pomodoro-Timer gestartet": true } },
  { sessionId: "prev10", title: "1h Focus Session", host: "Marcel", date: "2026-03-13", startTime: "06:00", goalBefore: "Emails abarbeiten", goalAfter: "Alle beantwortet!", rating: 5,
    routineStates: { "Handy auf Flugmodus": true, "Wasser bereitstellen": true, "3 Tagesaufgaben notiert": true, "Pomodoro-Timer gestartet": true } },
  { sessionId: "prev11", title: "2h Focus Session", host: "Britta", date: "2026-03-18", startTime: "10:00", goalBefore: "Buchhaltung Q1", goalAfter: "70% fertig", rating: 3,
    routineStates: { "Handy auf Flugmodus": false, "Wasser bereitstellen": false, "3 Tagesaufgaben notiert": true, "Pomodoro-Timer gestartet": false } },
  { sessionId: "prev12", title: "2h Focus Session", host: "Marcel", date: "2026-03-20", startTime: "10:00", goalBefore: "Companion App Design", goalAfter: "Mockups fertig!", rating: 5,
    routineStates: { "Handy auf Flugmodus": true, "Wasser bereitstellen": true, "3 Tagesaufgaben notiert": true, "Pomodoro-Timer gestartet": true } },
];

export const MOCK_SESSION_STREAKS = {
  "Mi-06:00": { current: 4, label: "Mi 6 Uhr" },
  "Mi-10:00": { current: 6, label: "Mi Vormittag" },
  "Do-06:00": { current: 2, label: "Do 6 Uhr" },
  "Do-10:00": { current: 3, label: "Do Vormittag" },
  "Do-14:30": { current: 2, label: "Do Nachmittag" },
  "Fr-06:00": { current: 5, label: "Fr 6 Uhr" },
  "Di-10:00": { current: 3, label: "Di Vormittag" },
  "Di-06:00": { current: 3, label: "Di 6 Uhr" },
  "Mo-10:00": { current: 2, label: "Mo Vormittag" },
  "Di-14:00": { current: 1, label: "Di Nachmittag" },
};

export const MOCK_ROUTINES = [
  { id: "r1", label: "Handy auf Flugmodus", active: true, activeSince: "2025-10-01", activeUntil: null },
  { id: "r2", label: "Wasser bereitstellen", active: true, activeSince: "2026-03-10", activeUntil: null },
  { id: "r3", label: "3 Tagesaufgaben notiert", active: true, activeSince: "2025-10-01", activeUntil: null },
  { id: "r4", label: "Stoerende Tabs geschlossen", active: false, activeSince: "2025-10-01", activeUntil: "2026-02-20" },
  { id: "r5", label: "Pomodoro-Timer gestartet", active: true, activeSince: "2025-12-01", activeUntil: null },
];

export const MOCK_LEADERBOARD = {
  "7d": [
    { rank: 1, name: "Gerd M.", sessions: 5, streak: 12, trend: "up" },
    { rank: 2, name: "Marcel K.", sessions: 4, streak: 12, trend: "same" },
    { rank: 3, name: "Doris S.", sessions: 4, streak: 8, trend: "up" },
    { rank: 4, name: "Simon R.", sessions: 3, streak: 6, trend: "down" },
    { rank: 5, name: "Britta E.", sessions: 3, streak: 15, trend: "same" },
    { rank: 6, name: "Laura P.", sessions: 2, streak: 3, trend: "up" },
    { rank: 7, name: "Thomas B.", sessions: 2, streak: 2, trend: "down" },
    { rank: 8, name: "Anna W.", sessions: 1, streak: 1, trend: "new" },
  ],
  "30d": [
    { rank: 1, name: "Gerd M.", sessions: 22, streak: 12, trend: "up" },
    { rank: 2, name: "Doris S.", sessions: 19, streak: 8, trend: "up" },
    { rank: 3, name: "Marcel K.", sessions: 17, streak: 12, trend: "same" },
    { rank: 4, name: "Britta E.", sessions: 16, streak: 15, trend: "same" },
    { rank: 5, name: "Simon R.", sessions: 14, streak: 6, trend: "down" },
    { rank: 6, name: "Laura P.", sessions: 11, streak: 3, trend: "up" },
    { rank: 7, name: "Thomas B.", sessions: 8, streak: 2, trend: "down" },
    { rank: 8, name: "Anna W.", sessions: 5, streak: 1, trend: "new" },
  ],
  "allzeit": [
    { rank: 1, name: "Gerd M.", sessions: 89, streak: 12, trend: "same" },
    { rank: 2, name: "Marcel K.", sessions: 47, streak: 12, trend: "same" },
    { rank: 3, name: "Doris S.", sessions: 45, streak: 8, trend: "up" },
    { rank: 4, name: "Simon R.", sessions: 38, streak: 6, trend: "down" },
    { rank: 5, name: "Britta E.", sessions: 35, streak: 15, trend: "same" },
    { rank: 6, name: "Laura P.", sessions: 28, streak: 3, trend: "up" },
    { rank: 7, name: "Thomas B.", sessions: 22, streak: 2, trend: "same" },
    { rank: 8, name: "Anna W.", sessions: 12, streak: 1, trend: "new" },
  ],
};

export const MOCK_ADMIN_STATS = {
  totalSessions: 342, totalAttendances: 1240, avgPerSession: 3.6,
  topMembers: [
    { name: "Gerd M.", sessions: 89 }, { name: "Marcel K.", sessions: 47 },
    { name: "Doris S.", sessions: 45 }, { name: "Simon R.", sessions: 38 }, { name: "Britta E.", sessions: 35 },
  ],
  weeklyTrend: [
    { week: "KW 5", count: 28 }, { week: "KW 6", count: 32 },
    { week: "KW 7", count: 35 }, { week: "KW 8", count: 31 }, { week: "KW 9", count: 38 },
  ],
  dropOff: [
    { name: "Laura K.", lastSeen: "2026-01-15", sessions: 12 },
    { name: "Thomas B.", lastSeen: "2026-02-01", sessions: 8 },
  ],
};
