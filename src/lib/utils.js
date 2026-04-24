export const formatDate = (ds) => {
  const d = new Date(ds + "T00:00:00");
  return `${["So","Mo","Di","Mi","Do","Fr","Sa"][d.getDay()]}, ${d.getDate()}. ${["Jan","Feb","Mar","Apr","Mai","Jun","Jul","Aug","Sep","Okt","Nov","Dez"][d.getMonth()]}`;
};

export const formatDateLong = (ds) => {
  const d = new Date(ds + "T00:00:00");
  return `${["Sonntag","Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag"][d.getDay()]}, ${d.getDate()}. ${["Januar","Februar","Marz","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"][d.getMonth()]} ${d.getFullYear()}`;
};

export const getGoogleCalLink = (session) => {
  const start = session.date.replace(/-/g, "") + "T" + session.startTime.replace(":", "") + "00";
  const end = session.date.replace(/-/g, "") + "T" + session.endTime.replace(":", "") + "00";
  const title = encodeURIComponent(`CoWorking: ${session.title} (${session.host})`);
  const details = encodeURIComponent(`Fokus Session im CoWorking Space\nHost: ${session.host}\nZoom: ${session.zoom || "Link folgt"}`);
  return `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&ctz=Europe/Berlin`;
};
