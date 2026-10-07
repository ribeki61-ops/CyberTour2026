/**
 * CYBERTOUR 2026 — register.js
 * Anti-spam : un seul passage par numéro de tél ET par email.
 * Plus de cookie, plus de fingerprint navigateur.
 */

import { checkPhone, checkEmail, saveParticipant } from './db.js';

const DISCORD_WEBHOOK = 'https:';

export function openRegister(onSuccess) {
  const overlay   = document.getElementById('register-overlay');
  const form      = document.getElementById('register-form');
  const submitBtn = document.getElementById('register-submit');
  const errorEl   = document.getElementById('register-global-error');
  if (!overlay) return;

  form.reset();
  errorEl.textContent   = '';
  errorEl.style.display = 'none';
  submitBtn.disabled    = false;
  submitBtn.querySelector('.btn-text').textContent = 'Confirmer et accéder à la roulette';

  overlay.classList.add('active');

  form.onsubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const data = {
      prenom: document.getElementById('r-prenom').value.trim(),
      nom:    document.getElementById('r-nom').value.trim(),
      email:  document.getElementById('r-email').value.trim(),
      tel:    document.getElementById('r-tel').value.trim(),
    };

    submitBtn.disabled = true;
    submitBtn.querySelector('.btn-text').textContent = 'Vérification en cours…';

    // --- Vérif téléphone ---
    if (await checkPhone(data.tel)) {
      errorEl.textContent   = 'Ce numéro de téléphone a déjà été utilisé pour participer.';
      errorEl.style.display = 'block';
      resetBtn(submitBtn);
      return;
    }

    // --- Vérif email ---
    if (await checkEmail(data.email)) {
      errorEl.textContent   = 'Cette adresse email a déjà été utilisée pour participer.';
      errorEl.style.display = 'block';
      resetBtn(submitBtn);
      return;
    }

    submitBtn.querySelector('.btn-text').textContent = 'Enregistrement…';

    const saved = await saveParticipant(data);
    if (!saved) {
      errorEl.textContent   = 'Participation déjà enregistrée pour ces coordonnées.';
      errorEl.style.display = 'block';
      resetBtn(submitBtn);
      return;
    }

    notifyDiscord(data);
    sessionStorage.setItem('ct26_participant', JSON.stringify(data));

    overlay.classList.remove('active');
    onSuccess(data);
  };
}

function resetBtn(btn) {
  btn.disabled = false;
  btn.querySelector('.btn-text').textContent = 'Confirmer et accéder à la roulette';
}

function validate() {
  let ok = true;

  [{ id: 'r-prenom', msg: 'Prénom requis' }, { id: 'r-nom', msg: 'Nom requis' }]
    .forEach(({ id, msg }) => {
      const el = document.getElementById(id);
      const er = el.nextElementSibling;
      if (!el.value.trim()) {
        er.textContent = msg; er.classList.add('active'); el.classList.add('err'); ok = false;
      } else {
        er.textContent = ''; er.classList.remove('active'); el.classList.remove('err');
      }
    });

  const email  = document.getElementById('r-email');
  const emailE = email.nextElementSibling;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
    emailE.textContent = 'Email invalide'; emailE.classList.add('active'); email.classList.add('err'); ok = false;
  } else {
    emailE.textContent = ''; emailE.classList.remove('active'); email.classList.remove('err');
  }

  const tel  = document.getElementById('r-tel');
  const telE = tel.nextElementSibling;
  if (!/^[\d\s\+\-\.]{8,16}$/.test(tel.value.replace(/\s/g, ''))) {
    telE.textContent = 'Numéro invalide'; telE.classList.add('active'); tel.classList.add('err'); ok = false;
  } else {
    telE.textContent = ''; telE.classList.remove('active'); tel.classList.remove('err');
  }

  return ok;
}

function notifyDiscord({ prenom, nom, email, tel }) {
  fetch(DISCORD_WEBHOOK, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      embeds: [{
        title:  '📋 Nouvelle inscription — Cybertour 2026',
        color:  0x2563eb,
        fields: [
          { name: '👤 Prénom',    value: prenom, inline: true  },
          { name: '👤 Nom',       value: nom,    inline: true  },
          { name: '📧 Email',     value: email,  inline: false },
          { name: '📞 Téléphone', value: tel,    inline: true  },
          { name: '🕐 Heure',     value: new Date().toLocaleString('fr-FR'), inline: true },
        ],
        footer:    { text: 'Cybertour 2026 — Inscription stand' },
        timestamp: new Date().toISOString(),
      }]
    }),
  }).catch(() => {});
}
