export const formatDate = (ds) => {
  const d = new Date(ds + "T00:00:00");
  return `${["So","Mo","Di","Mi","Do","Fr","Sa"][d.getDay()]}, ${d.getDate()}. ${["Jan","Feb","Mar","Apr","Mai","Jun","Jul","Aug","Sep","Okt","Nov","Dez"][d.getMonth()]}`;
};

export const formatDateLong = (ds) => {
  const d = new Date(ds + "T00:00:00");
  return `${["Sonntag","Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag"][d.getDay()]}, ${d.getDate()}. ${["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"][d.getMonth()]} ${d.getFullYear()}`;
};

export const getGoogleCalLink = (session) => {
  const start = session.date.replace(/-/g, "") + "T" + session.startTime.replace(":", "") + "00";
  const end = session.date.replace(/-/g, "") + "T" + session.endTime.replace(":", "") + "00";
  const title = encodeURIComponent(`CoWorking: ${session.title} (${session.host})`);
  const details = encodeURIComponent(`Fokus Session im CoWorking Space\nHost: ${session.host}\nZoom: ${session.zoom || "Link folgt"}`);
  return `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&ctz=Europe/Berlin`;
};

// ============================================
// Session-Status dynamisch
// ============================================
// Bug-Fix Push 5: Supabase liefert Zeiten als "HH:MM:SS" (Postgres TIME),
// Mock-Daten als "HH:MM". Push 4 haengte blind ":00" an, was bei "14:00:00"
// zu "14:00:00:00" wurde -> Invalid Date -> alle Sessions wurden faelschlich
// als "scheduled" klassifiziert -> Past-Filter wirkte nicht.
const _normalizeTime = (t) => {
  if (!t || typeof t !== 'string') return '00:00:00';
  if (t.length === 5) return `${t}:00`;       // "14:00" -> "14:00:00"
  if (t.length >= 8) return t.slice(0, 8);    // "14:00:00.123" -> "14:00:00"
  return t;
};

export const getSessionLiveStatus = (session) => {
  if (!session || !session.date) return 'scheduled';
  try {
    const startRaw = session.startTime || session.start_time;
    const endRaw = session.endTime || session.end_time || startRaw;
    if (!startRaw) return session.status || 'scheduled';

    const start = new Date(`${session.date}T${_normalizeTime(startRaw)}`);
    const end = new Date(`${session.date}T${_normalizeTime(endRaw)}`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return session.status || 'scheduled';
    }

    const now = new Date();
    if (now >= start && now <= end) return 'live';
    if (now > end) return 'past';
    return 'scheduled';
  } catch {
    return session.status || 'scheduled';
  }
};

export const isSessionPast = (session) => getSessionLiveStatus(session) === 'past';
export const isSessionLive = (session) => getSessionLiveStatus(session) === 'live';
