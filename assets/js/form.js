/**
 * CYBERTOUR 2026 — form.js
 */

import { saveBackup, setConfirm, fingerprint, getResult } from './storage.js';

const ENDPOINT = 'https://formspree.io/f/placeholder';

export function initForm() {
  const form = document.getElementById('registration-form');
  if (!form) return;

  document.addEventListener('wheel:prize', e => {
    populatePrize(e.detail);
    document.getElementById('form-section')?.classList.add('active');
  });

  form.querySelectorAll('[data-v]').forEach(f => {
    f.addEventListener('input',  () => validate(f));
    f.addEventListener('blur',   () => validate(f));
    f.addEventListener('change', () => validate(f));
  });

  form.addEventListener('submit', submit);
}

function populatePrize(prize) {
  const n = document.getElementById('prize-recap-name');
  const h = document.getElementById('field-lot');
  if (n) n.textContent = prize.name;
  if (h) h.value       = prize.name;
}

function validate(f) {
  const rule  = f.dataset.v;
  const val   = f.type === 'checkbox' ? f.checked : f.value.trim();
  let err     = '';

  if (rule === 'req' && !val)   err = 'Champ obligatoire.';
  if (rule === 'email') {
    if (!val) err = 'Email obligatoire.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val)) err = 'Format invalide.';
  }
  if (rule === 'check' && !val) err = 'Consentement requis.';

  const wrap = f.closest('.field') || f.closest('.rgpd-row');
  const errEl = wrap?.querySelector('.field-error');
  f.classList.toggle('err', !!err);
  f.classList.toggle('ok',  !err && !!val);
  if (errEl) { errEl.textContent = err; errEl.classList.toggle('active', !!err); }
  return !err;
}

function validateAll(form) {
  let ok = true;
  form.querySelectorAll('[data-v]').forEach(f => { if (!validate(f)) ok = false; });
  return ok;
}

async function submit(e) {
  e.preventDefault();
  const form = e.currentTarget;
  if (!validateAll(form)) {
    form.querySelector('.err')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  const btn = form.querySelector('.btn-submit');
  btn.classList.add('loading');
  btn.disabled = true;

  const fd = new FormData(form);
  const data = {
    prenom: fd.get('prenom') || '',
    nom:    fd.get('nom')    || '',
    email:  fd.get('email')  || '',
    org:    fd.get('org')    || '',
    ville:  fd.get('ville')  || '',
    lot:    fd.get('lot')    || '',
    rgpd:   'oui',
    ts:     new Date().toISOString(),
    fp:     fingerprint(),
  };

  saveBackup(data);

  const ref   = genRef();
  const prize = getResult();

  setConfirm({ firstName: data.prenom, lastName: data.nom, prize, ref, ts: Date.now() });

  try {
    const r = await fetch(ENDPOINT, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body:    JSON.stringify(data),
    });
    if (!r.ok) throw new Error(r.status);
  } catch {
    // Pas de backend configuré — on continue quand même vers la confirmation
  }

  window.location.href = 'confirmation.html';
}

function genRef() {
  const c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return 'CT26-' + Array.from({ length: 8 }, () => c[Math.floor(Math.random() * c.length)]).join('');
}
