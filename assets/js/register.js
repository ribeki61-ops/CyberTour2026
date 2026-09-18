/**
 * CYBERTOUR 2026 — register.js
 * Modal formulaire AVANT la caméra
 */

import { checkPhone, saveParticipant } from './db.js';

const DISCORD_WEBHOOK = 'https://discord.com/api/webhooks/1550440952076967996/_vejyx6702E_65OEzy19cJ3jW9e-sIDrZBvqGcPJDOl8n7VbLcQ9gRp5Sk44FELsTee7';

export function openRegister(onSuccess) {
  const overlay   = document.getElementById('register-overlay');
  const form      = document.getElementById('register-form');
  const submitBtn = document.getElementById('register-submit');
  const errorEl   = document.getElementById('register-global-error');
  if (!overlay) return;

  // Reset
  form.reset();
  errorEl.textContent = '';
  errorEl.style.display = 'none';
  submitBtn.disabled = false;
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

    // Vérif numéro déjà utilisé
    const dejaParticipe = await checkPhone(data.tel);
    if (dejaParticipe) {
      showGlobalError('Ce numéro de téléphone a déjà été utilisé pour participer.');
      submitBtn.disabled = false;
      submitBtn.querySelector('.btn-text').textContent = 'Confirmer et accéder à la roulette';
      return;
    }

    // Enregistrement BDD
    submitBtn.querySelector('.btn-text').textContent = 'Enregistrement…';
    await saveParticipant(data);

    // Notif Discord
    notifyDiscord(data);

    // Stocker pour afficher dans le résultat si besoin
    sessionStorage.setItem('ct26_participant', JSON.stringify(data));

    // Fermer et continuer
    overlay.classList.remove('active');
    onSuccess(data);
  };

  function showGlobalError(msg) {
    errorEl.textContent   = msg;
    errorEl.style.display = 'block';
  }
}

// ── Validation ───────────────────────────────────────
function validate() {
  let ok = true;

  [{ id: 'r-prenom', msg: 'Prénom requis' }, { id: 'r-nom', msg: 'Nom requis' }]
    .forEach(({ id, msg }) => {
      const el = document.getElementById(id);
      const er = el.nextElementSibling;
      if (!el.value.trim()) { er.textContent = msg; er.classList.add('active'); el.classList.add('err'); ok = false; }
      else { er.textContent = ''; er.classList.remove('active'); el.classList.remove('err'); }
    });

  const email = document.getElementById('r-email');
  const emailE = email.nextElementSibling;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
    emailE.textContent = 'Email invalide'; emailE.classList.add('active'); email.classList.add('err'); ok = false;
  } else { emailE.textContent = ''; emailE.classList.remove('active'); email.classList.remove('err'); }

  const tel = document.getElementById('r-tel');
  const telE = tel.nextElementSibling;
  if (!/^[\d\s\+\-\.]{8,16}$/.test(tel.value.replace(/\s/g, ''))) {
    telE.textContent = 'Numéro invalide'; telE.classList.add('active'); tel.classList.add('err'); ok = false;
  } else { telE.textContent = ''; telE.classList.remove('active'); tel.classList.remove('err'); }

  return ok;
}

// ── Discord notification inscription ─────────────────
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
