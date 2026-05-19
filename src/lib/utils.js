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
// Bug-Fix 6: Session-Status dynamisch
// ============================================
// Vorher: status (past/live/scheduled) war im Mock hardcoded und wurde
// im UI direkt benutzt. Folge: Sessions zeigten "LIVE" obwohl ihr Datum
// Monate zurueck lag. Jetzt: dynamisch aus date + start + end + now ableiten.
export const getSessionLiveStatus = (session) => {
  if (!session || !session.date) return 'scheduled';
  try {
    // Sowohl camelCase (Mock-Daten: startTime/endTime) als auch snake_case
    // (Supabase: start_time/end_time) unterstuetzen, damit der Helper
    // ueberall in der App funktioniert.
    const startTime = session.startTime || session.start_time || '00:00';
    const endTime = session.endTime || session.end_time || startTime || '23:59';
    const start = new Date(`${session.date}T${startTime}:00`);
    const end = new Date(`${session.date}T${endTime}:00`);
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
