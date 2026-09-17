/**
 * CYBERTOUR 2026 — verify.js
 * Vérification par selfie — compatible Safari iOS, Chrome, Firefox, Edge
 */

import { isVerified, setVerified } from './storage.js';

let stream    = null;
let capturing = false;

// ── API publique ──────────────────────────────────────────────

export function openVerify(onSuccess) {
  if (isVerified()) { onSuccess(); return; }

  const overlay = document.getElementById('verify-overlay');
  overlay.classList.add('active');

  // Fige la roue visuellement pendant le modal
  document.getElementById('wheel-wrap')?.classList.add('wheel-frozen');

  document.getElementById('verify-start-btn').onclick = () => startCamera(onSuccess);
  document.getElementById('verify-help-toggle').onclick = toggleHelp;
}

// ── Démarrage caméra (caméra frontale pour selfie) ────────────

async function startCamera(onSuccess) {
  const btn = document.getElementById('verify-start-btn');
  btn.disabled = true;
  btn.querySelector('.btn-text').textContent = 'Connexion…';

  const video = document.getElementById('verify-video');
  video.setAttribute('playsinline', '');
  video.muted = true;

  // Essai en cascade — front camera d'abord (selfie), fallback any
  const sets = [
    { video: { facingMode: { ideal: 'user' }, width: { ideal: 1280 }, height: { ideal: 720 } } },
    { video: { facingMode: 'user' } },
    { video: { width: { ideal: 1280 } } },
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

  // Affiche le flux vidéo
  document.getElementById('verify-video-wrap').classList.add('active');
  document.getElementById('verify-initial').style.display = 'none';

  // Affiche le bouton de capture
  const captureBtn = document.getElementById('verify-capture-btn');
  captureBtn.style.display = 'flex';
  captureBtn.onclick = () => capturePhoto(video, onSuccess);
}

// ── Capture selfie ────────────────────────────────────────────

async function capturePhoto(video, onSuccess) {
  if (capturing) return;
  capturing = true;

  const captureBtn = document.getElementById('verify-capture-btn');
  captureBtn.disabled = true;

  // Countdown 3-2-1
  await countdown();

  // Flash
  flash();

  // Capture canvas
  const canvas = document.createElement('canvas');
  canvas.width  = video.videoWidth  || 640;
  canvas.height = video.videoHeight || 480;
  const ctx = canvas.getContext('2d');

  // Miroir horizontal (selfie naturel)
  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0);

  // Affiche la preview
  const preview = document.getElementById('verify-preview');
  const img     = document.getElementById('verify-preview-img');
  if (preview && img) {
    img.src = canvas.toDataURL('image/jpeg', 0.75);
    preview.style.display = 'block';
  }

  // Arrête la caméra
  stopCamera();

  // Stocke la vérification
  setVerified();

  // Affiche succès
  showSuccess(() => {
    closeOverlay();
    document.getElementById('wheel-wrap')?.classList.remove('wheel-frozen');
    onSuccess();
  });

  if (navigator.vibrate) navigator.vibrate([60, 40, 120]);
}

// ── Countdown 3-2-1 ───────────────────────────────────────────

function countdown() {
  return new Promise(resolve => {
    const el = document.getElementById('verify-countdown');
    if (!el) { resolve(); return; }

    el.style.display = 'flex';
    let n = 3;
    el.textContent = n;

    const t = setInterval(() => {
      n--;
      if (n > 0) {
        el.textContent = n;
        el.style.transform = 'scale(1.3)';
        setTimeout(() => { el.style.transform = 'scale(1)'; }, 200);
      } else {
        clearInterval(t);
        el.style.display = 'none';
        resolve();
      }
    }, 800);
  });
}

// ── Flash ─────────────────────────────────────────────────────

function flash() {
  const el = document.getElementById('verify-flash');
  if (!el) return;
  el.style.opacity = '1';
  setTimeout(() => { el.style.opacity = '0'; }, 180);
}

// ── Succès ────────────────────────────────────────────────────

function showSuccess(cb) {
  document.getElementById('verify-capture-btn').style.display  = 'none';
  document.getElementById('verify-success').classList.add('active');
  setTimeout(cb, 1400);
}

// ── Helpers ───────────────────────────────────────────────────

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
