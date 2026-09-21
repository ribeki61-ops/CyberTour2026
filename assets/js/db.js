/**
 * CYBERTOUR 2026 — db.js
 * Supabase — participants + fingerprints + cookie
 */

const SUPABASE_URL      = 'https://vcuiksxvcibdlabvceyp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjdWlrc3h2Y2liZGxhYnZjZXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3MTEwODIsImV4cCI6MjEwNTI4NzA4Mn0.A33SsZEqM7N6k0Iyyvx3auwudwf-yonAvK3jJ0oanKY';

const H = {
  'apikey':        SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type':  'application/json',
};

// ── Participants ─────────────────────────────────────
export async function checkPhone(tel) {
  const clean = tel.replace(/[\s\-\.]/g, '');
  try {
    const res  = await fetch(
      `${SUPABASE_URL}/rest/v1/participants?tel=eq.${encodeURIComponent(clean)}&select=id`,
      { headers: H }
    );
    const rows = await res.json();
    return Array.isArray(rows) && rows.length > 0;
  } catch { return false; }
}

export async function saveParticipant({ prenom, nom, email, tel }) {
  const clean = tel.replace(/[\s\-\.]/g, '');
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/participants`, {
      method:  'POST',
      headers: { ...H, 'Prefer': 'return=minimal' },
      body:    JSON.stringify({ prenom, nom, email, tel: clean }),
    });
    return res.ok;
  } catch { return false; }
}

// ── Fingerprints ─────────────────────────────────────
export async function checkFingerprint(fp) {
  try {
    const res  = await fetch(
      `${SUPABASE_URL}/rest/v1/fingerprints?fp=eq.${encodeURIComponent(fp)}&select=id`,
      { headers: H }
    );
    const rows = await res.json();
    return Array.isArray(rows) && rows.length > 0;
  } catch { return false; }
}

export async function saveFingerprint(fp) {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/fingerprints`, {
      method:  'POST',
      headers: { ...H, 'Prefer': 'return=minimal' },
      body:    JSON.stringify({ fp, ts: new Date().toISOString() }),
    });
  } catch {}
}

// ── Cookie 1 an ──────────────────────────────────────
const COOKIE_NAME = 'ct26_played';

export function checkCookie() {
  return document.cookie.split(';').some(c => c.trim().startsWith(COOKIE_NAME + '='));
}

export function setCookie() {
  const expires = new Date();
  expires.setFullYear(expires.getFullYear() + 1);
  document.cookie = `${COOKIE_NAME}=1; expires=${expires.toUTCString()}; path=/; SameSite=Strict`;
}
