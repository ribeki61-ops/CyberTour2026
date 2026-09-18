/**
 * CYBERTOUR 2026 — db.js
 * Supabase — participants
 */

const SUPABASE_URL      = 'https://sitxmwqtmcypzazgkyiw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpdHhtd3F0bWN5cHphemdreWl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3MjkwODUsImV4cCI6MjEwNTMwNTA4NX0.RZDTtJL0F76evQEc-nsHGOoigXqUn0HZmTVSvbvO2ro';

const H = {
  'apikey':        SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type':  'application/json',
};

/** Retourne true si ce numéro est déjà en base */
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

/** Insère un participant, retourne true si OK */
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
