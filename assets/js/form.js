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
    submitBtn.querySelector('.btn-text').textContent = 'Envoi en cours…';

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

// ── Validation ───────────────────────────────────────
function validate() {
  let ok = true;

  // Champs texte requis
  [{ id: 'f-prenom', msg: 'Prénom requis' }, { id: 'f-nom', msg: 'Nom requis' }]
    .forEach(({ id, msg }) => {
      const el  = document.getElementById(id);
      const err = el.nextElementSibling;
      if (!el.value.trim()) { err.textContent = msg; el.classList.add('invalid'); ok = false; }
      else                  { err.textContent = '';  el.classList.remove('invalid'); }
    });

  // Email
  const em  = document.getElementById('f-email');
  const emE = em.nextElementSibling;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em.value.trim())) {
    emE.textContent = 'Adresse email invalide'; em.classList.add('invalid'); ok = false;
  } else { emE.textContent = ''; em.classList.remove('invalid'); }

  // Téléphone
  const tel  = document.getElementById('f-tel');
  const telE = tel.nextElementSibling;
  if (!/^[\d\s\+\-\.]{8,16}$/.test(tel.value.replace(/\s/g, ''))) {
    telE.textContent = 'Numéro invalide'; tel.classList.add('invalid'); ok = false;
  } else { telE.textContent = ''; tel.classList.remove('invalid'); }

  return ok;
}

// ── Envoi Discord ────────────────────────────────────
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
