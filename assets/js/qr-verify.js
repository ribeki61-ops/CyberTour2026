/**
 * CYBERTOUR 2026 — qr-verify.js
 * Module de vérification QR code via nimiq/qr-scanner
 *
 * Comportement :
 * 1. Overlay plein écran avec message "Vérifie que tu es humain"
 * 2. Bouton "Activer la caméra" → getUserMedia()
 * 3. Flux vidéo + cadre cible animé
 * 4. Scan continu via QrScanner
 * 5. QR valide (n'importe lequel) → token sessionStorage (30min)
 * 6. Token déjà valide → skip vérification
 * 7. Succès → redirect game.html?verified=true
 */

import { isQRVerified, setQRToken } from './storage.js';

// ── Configuration ─────────────────────────────────────────────
const SESSION_DURATION_MS = 30 * 60 * 1000;

/**
 * Tableau de QR codes autorisés.
 * Vide = tout QR code est accepté.
 * Exemple : ['CYBERTOUR2026', 'https://cybertour.io']
 */
const VALID_QR_CODES = [];

const TIMER_DURATION_S = 60;

// ── DOM refs ──────────────────────────────────────────────────
let overlay, videoEl, startBtn, timerBarFill, timerLabel,
    videoContainer, successPanel, helpToggle, helpPanel,
    timerBarTrack, qrFrameEl, scanLineEl;

let qrScanner   = null;
let timerHandle = null;
let timerLeft   = TIMER_DURATION_S;

/** Initialise le module — à appeler depuis index.html */
export async function initQRVerify() {
  // Si déjà vérifié → redirect immédiat
  if (isQRVerified()) {
    redirectToGame();
    return;
  }

  bindDOM();
  bindEvents();
  showOverlay();
}

// ── Liaison DOM ───────────────────────────────────────────────
function bindDOM() {
  overlay        = document.getElementById('qr-overlay');
  videoEl        = document.getElementById('qr-video');
  startBtn       = document.getElementById('qr-start-btn');
  timerBarFill   = document.getElementById('qr-timer-fill');
  timerLabel     = document.getElementById('qr-timer-label');
  timerBarTrack  = document.getElementById('qr-timer-bar');
  videoContainer = document.getElementById('qr-video-container');
  successPanel   = document.getElementById('qr-success');
  helpToggle     = document.getElementById('qr-help-toggle');
  helpPanel      = document.getElementById('qr-help-panel');
}

// ── Événements ────────────────────────────────────────────────
function bindEvents() {
  startBtn?.addEventListener('click', () => startCamera());
  helpToggle?.addEventListener('click', toggleHelp);
}

// ── Affiche l'overlay ─────────────────────────────────────────
function showOverlay() {
  overlay?.classList.remove('hidden');
}

// ── Démarre la caméra ─────────────────────────────────────────
async function startCamera() {
  startBtn.disabled = true;
  startBtn.textContent = 'Connexion…';

  if (!window.QrScanner) {
    showError('Impossible de charger le scanner QR. Rechargez la page.');
    return;
  }

  const hasCamera = await QrScanner.hasCamera();
  if (!hasCamera) {
    showError('Aucune caméra détectée sur cet appareil.');
    return;
  }

  videoContainer.classList.add('active');
  timerBarTrack.classList.add('active');

  try {
    qrScanner = new QrScanner(
      videoEl,
      result => onQRDetected(result.data ?? result),
      {
        preferredCamera:  'environment',
        highlightScanRegion: false,
        highlightCodeOutline: false,
      }
    );
    await qrScanner.start();

    startBtn.style.display = 'none';
    startTimer();
  } catch (err) {
    showError('Accès caméra refusé. Autorise la caméra et réessaie.');
    startBtn.disabled = false;
    startBtn.textContent = 'Activer la caméra';
    videoContainer.classList.remove('active');
    timerBarTrack.classList.remove('active');
  }
}

// ── QR code détecté ───────────────────────────────────────────
function onQRDetected(data) {
  if (!data) return;

  const value = typeof data === 'string' ? data.trim() : String(data).trim();

  // Vérification si liste de codes restreinte
  if (VALID_QR_CODES.length > 0 && !VALID_QR_CODES.includes(value)) {
    return; // Code non reconnu → ignore
  }

  // Succès !
  stopScanner();
  stopTimer();
  setQRToken();
  showSuccess();

  // Redirect après animation
  setTimeout(() => redirectToGame(), 1800);
}

// ── Timer 60s ─────────────────────────────────────────────────
function startTimer() {
  timerLeft = TIMER_DURATION_S;
  updateTimerLabel();

  // Redémarre l'animation CSS
  timerBarFill.style.animation = 'none';
  timerBarFill.offsetHeight; // reflow
  timerBarFill.style.animation = '';

  timerHandle = setInterval(() => {
    timerLeft--;
    updateTimerLabel();

    if (timerLeft <= 0) {
      clearInterval(timerHandle);
      resetScanner();
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(timerHandle);
}

function updateTimerLabel() {
  if (timerLabel) timerLabel.textContent = `${timerLeft}s`;
}

// ── Reset scanner ─────────────────────────────────────────────
function resetScanner() {
  stopScanner();
  videoContainer.classList.remove('active');
  timerBarTrack.classList.remove('active');
  startBtn.style.display = '';
  startBtn.disabled = false;
  startBtn.textContent = 'Réessayer';

  const notice = document.getElementById('qr-timeout-notice');
  if (notice) notice.style.display = 'block';
}

// ── Arrête le scanner ─────────────────────────────────────────
function stopScanner() {
  if (qrScanner) {
    qrScanner.stop();
    qrScanner.destroy();
    qrScanner = null;
  }
}

// ── Affiche le succès ─────────────────────────────────────────
function showSuccess() {
  // Masque tout sauf le panneau succès
  document.getElementById('qr-main-content')?.classList.add('hidden');
  successPanel.classList.add('active');

  // Vibration sur mobile
  if (navigator.vibrate) navigator.vibrate([100, 50, 200]);
}

// ── Aide ──────────────────────────────────────────────────────
function toggleHelp() {
  const isOpen = helpPanel.classList.toggle('active');
  helpToggle.textContent = isOpen ? 'Fermer l\'aide' : 'Besoin d\'aide ?';
}

// ── Erreur ────────────────────────────────────────────────────
function showError(msg) {
  const errorEl = document.getElementById('qr-error-msg');
  if (errorEl) {
    errorEl.textContent = msg;
    errorEl.style.display = 'block';
  }
}

// ── Redirect ──────────────────────────────────────────────────
function redirectToGame() {
  window.location.href = 'game.html?verified=true';
}
