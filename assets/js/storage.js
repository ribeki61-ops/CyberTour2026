/**
 * CYBERTOUR 2026 — storage.js
 */

const SESSION_MS = 30 * 60 * 1000;
const K = {
  TOKEN:   'ct26_tok',
  EXPIRY:  'ct26_exp',
  PLAYED:  'ct26_played',
  RESULT:  'ct26_result',
  CONFIRM: 'ct26_confirm',
};

export function setVerified() {
  const arr = new Uint8Array(12);
  crypto.getRandomValues(arr);
  const tok = Array.from(arr).map(b => b.toString(16).padStart(2,'0')).join('');
  sessionStorage.setItem(K.TOKEN,  tok);
  sessionStorage.setItem(K.EXPIRY, String(Date.now() + SESSION_MS));
}

export function isVerified() {
  const tok = sessionStorage.getItem(K.TOKEN);
  const exp = parseInt(sessionStorage.getItem(K.EXPIRY) || '0', 10);
  if (!tok || !exp) return false;
  if (Date.now() > exp) { sessionStorage.removeItem(K.TOKEN); sessionStorage.removeItem(K.EXPIRY); return false; }
  return true;
}

export function setPlayed(prize) {
  sessionStorage.setItem(K.PLAYED,  '1');
  sessionStorage.setItem(K.RESULT,  JSON.stringify(prize));
}

export function hasPlayed()  { return sessionStorage.getItem(K.PLAYED) === '1'; }

export function getResult() {
  try { return JSON.parse(sessionStorage.getItem(K.RESULT) || 'null'); }
  catch { return null; }
}

export function setConfirm(data) {
  sessionStorage.setItem(K.CONFIRM, JSON.stringify(data));
}

export function getConfirm() {
  try { return JSON.parse(sessionStorage.getItem(K.CONFIRM) || 'null'); }
  catch { return null; }
}

export function saveBackup(data) {
  try { localStorage.setItem('ct26_backup', JSON.stringify({ ...data, at: new Date().toISOString() })); }
  catch {}
}

export function fingerprint() {
  const s = [navigator.userAgent.slice(0,50), screen.width+'x'+screen.height, navigator.language].join('|');
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = (h * 16777619) >>> 0; }
  return h.toString(16);
}
