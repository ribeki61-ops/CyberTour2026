/**
 * CYBERTOUR 2026 — form.js
 * Coordonnées gagnant → Discord
 */

const WEBHOOK = 'https://discord.com/api/webhooks/1550440952076967996/_vejyx6702E_65OEzy19cJ3jW9e-sIDrZBvqGcPJDOl8n7VbLcQ9gRp5Sk44FELsTee7';

export function initForm() {
  const form = document.getElementById('registration-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const submitBtn = document.querySelector('.btn-submit');
    submitBtn.disabled = true;
    submitBtn.classList.add('loading');

    const data = {
      prenom: document.getElementById('f-prenom').value.trim(),
      nom:    document.getElementById('f-nom').value.trim(),
      email:  document.getElementById('f-email').value.trim(),
      tel:    document.getElementById('f-tel').value.trim(),
      lot:    document.getElementById('field-lot').value || '(non renseigné)',
      ts:     document.getElementById('field-ts').value  || new Date().toISOString(),
    };

    await sendToDiscord(data);
    window.location.href = 'confirmation.html';
  });
}

function setError(input, msg) {
  const err = input.nextElementSibling;
  input.classList.add('err');
  input.classList.remove('ok');
  if (err && err.classList.contains('field-error')) {
    err.textContent = msg;
    err.classList.add('active');
  }
}

function clearError(input) {
  const err = input.nextElementSibling;
  input.classList.remove('err');
  input.classList.add('ok');
  if (err && err.classList.contains('field-error')) {
    err.textContent = '';
    err.classList.remove('active');
  }
}

function validate() {
  let ok = true;

  const prenom = document.getElementById('f-prenom');
  if (!prenom.value.trim()) { setError(prenom, 'Prénom requis'); ok = false; }
  else clearError(prenom);

  const nom = document.getElementById('f-nom');
  if (!nom.value.trim()) { setError(nom, 'Nom requis'); ok = false; }
  else clearError(nom);

  const email = document.getElementById('f-email');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
    setError(email, 'Email invalide'); ok = false;
  } else clearError(email);

  const tel = document.getElementById('f-tel');
  if (!/^[\d\s\+\-\.]{8,16}$/.test(tel.value.replace(/\s/g, ''))) {
    setError(tel, 'Numéro invalide'); ok = false;
  } else clearError(tel);

  return ok;
}

async function sendToDiscord(data) {
  const body = {
    embeds: [{
      title:  '🎉 Nouveau gagnant — Cybertour 2026',
      color:  0x2563eb,
      fields: [
        { name: '👤 Prénom',    value: data.prenom, inline: true  },
        { name: '👤 Nom',       value: data.nom,    inline: true  },
        { name: '📧 Email',     value: data.email,  inline: false },
        { name: '📞 Téléphone', value: data.tel,    inline: true  },
        { name: '🎁 Lot',       value: data.lot,    inline: true  },
        { name: '🕐 Heure',     value: new Date(data.ts).toLocaleString('fr-FR'), inline: false },
      ],
      footer:    { text: 'Cybertour 2026 — Stand' },
      timestamp: data.ts,
    }]
  };

  try {
    await fetch(WEBHOOK, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    });
  } catch { /* silencieux */ }
}
