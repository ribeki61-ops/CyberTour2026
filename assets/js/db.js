/**
 * CYBERTOUR 2026 — db.js
 * Supabase — table participants uniquement.
 * Unicité : téléphone + email.
 */

const SUPABASE_URL      = 'https://tvwaydivmequylqdhvun.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_HHhE1mM1fIU4TI-UeiEn7A_8WXukgI_';

const H = {
  'apikey':        SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type':  'application/json',
};

// ── Normalisations ───────────────────────────────────
const cleanPhone = (tel)   => tel.replace(/[\s\-\.]/g, '');
const cleanEmail = (email) => email.trim().toLowerCase();

// ── Participants ─────────────────────────────────────
export async function checkPhone(tel) {
  const clean = cleanPhone(tel);
  try {
    const res  = await fetch(
      `${SUPABASE_URL}/rest/v1/participants?tel=eq.${encodeURIComponent(clean)}&select=id`,
      { headers: H }
    );
    const rows = await res.json();
    return Array.isArray(rows) && rows.length > 0;
  } catch { return false; }
}

export async function checkEmail(email) {
  const clean = cleanEmail(email);
  try {
    const res  = await fetch(
      `${SUPABASE_URL}/rest/v1/participants?email=eq.${encodeURIComponent(clean)}&select=id`,
      { headers: H }
    );
    const rows = await res.json();
    return Array.isArray(rows) && rows.length > 0;
  } catch { return false; }
}

export async function saveParticipant({ prenom, nom, email, tel }) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/participants`, {
      method:  'POST',
      headers: { ...H, 'Prefer': 'return=minimal' },
      body:    JSON.stringify({
        prenom,
        nom,
        email: cleanEmail(email),
        tel:   cleanPhone(tel),
      }),
    });
    return res.ok;
  } catch { return false; }
}
