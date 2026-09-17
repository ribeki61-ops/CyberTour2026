/**
 * CYBERTOUR 2026 — wheel.js
 * Roulette canvas — sans emojis, DA sobre
 */

import { setPlayed, hasPlayed, getResult } from './storage.js';

export const PRIZES = [
  { key: 'tshirt',   name: 'T-Shirt Cybertour',    short: 'T-SHIRT',        color: '#13181f', text: '#93c5fd', prob: 18 },
  { key: 'usb',      name: 'Clé USB 32 Go',         short: 'CLÉ USB',         color: '#0d1520', text: '#6ee7b7', prob: 18 },
  { key: 'stickers', name: 'Pack Stickers ×10',     short: 'STICKERS',        color: '#141018', text: '#c4b5fd', prob: 20 },
  { key: 'jackpot',  name: 'Sweat Cybertour',       short: 'JACKPOT',         color: '#0c1530', text: '#60a5fa', prob: 5  },
  { key: 'vip',      name: 'Accès VIP session +',   short: 'ACCÈS VIP',       color: '#0f1a14', text: '#86efac', prob: 10 },
  { key: 'badge',    name: 'Badge collector 2026',  short: 'BADGE',           color: '#1a1408', text: '#fcd34d', prob: 14 },
  { key: 'respin',   name: 'Nouvelle chance',       short: 'REJOUER',         color: '#181820', text: '#e2e8f0', prob: 10 },
  { key: 'noluck',   name: 'Hors lot',              short: 'HORS LOT',        color: '#12100e', text: '#64748b', prob: 5  },
];

const TAU      = Math.PI * 2;
const SEG_A    = TAU / PRIZES.length;
const DURATION = 5200;

let canvas, ctx, angle = 0, spinning = false;

export function initWheel() {
  canvas = document.getElementById('wheelCanvas');
  if (!canvas) return;
  ctx = canvas.getContext('2d');
  resize();

  if (hasPlayed()) { showAlreadyPlayed(); return; }
  // Le listener click est attaché dans game.html après vérification caméra
}

function resize() {
  const size = Math.min(440, window.innerWidth * 0.92);
  const dpr  = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width  = size * dpr;
  canvas.height = size * dpr;
  canvas.style.width  = size + 'px';
  canvas.style.height = size + 'px';
  ctx.scale(dpr, dpr);
  draw(angle);
}

// ── Dessin ────────────────────────────────────────────────────

function draw(rot) {
  const W  = canvas.width  / Math.min(window.devicePixelRatio || 1, 2);
  const H  = canvas.height / Math.min(window.devicePixelRatio || 1, 2);
  const cx = W / 2;
  const cy = H / 2;
  const R  = Math.min(W, H) / 2 - 4;

  ctx.clearRect(0, 0, W, H);

  // Fond roue
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, TAU);
  ctx.fillStyle = '#0a0b0f';
  ctx.fill();
  ctx.restore();

  PRIZES.forEach((p, i) => {
    const a0 = rot + i * SEG_A - TAU / 4;
    const a1 = a0 + SEG_A;
    const am = a0 + SEG_A / 2;

    // Fond segment
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, R - 1, a0, a1);
    ctx.closePath();
    ctx.fillStyle = p.color;
    ctx.fill();

    // Séparateur
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, R - 1, a0, a1);
    ctx.closePath();
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    // Arc de couleur externe
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, R - 2, a0 + 0.03, a1 - 0.03);
    ctx.strokeStyle = p.text;
    ctx.lineWidth   = 3;
    ctx.globalAlpha = 0.45;
    ctx.stroke();
    ctx.restore();

    // Texte
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(am);

    const fs   = Math.round(R * 0.072);
    const dist = R * 0.62;

    ctx.font         = `700 ${fs}px 'Syne', 'Inter', sans-serif`;
    ctx.fillStyle    = p.text;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.globalAlpha  = 0.95;

    const maxChars = 9;
    const label = p.short.length > maxChars ? p.short.slice(0, maxChars) + '.' : p.short;
    ctx.fillText(label, dist, 0);
    ctx.restore();
  });

  // Anneau externe
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, TAU);
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth   = 1;
  ctx.stroke();
  ctx.restore();

  // Centre
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, R * 0.16, 0, TAU);
  ctx.fillStyle = '#09090b';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy, R * 0.16, 0, TAU);
  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  ctx.lineWidth   = 1;
  ctx.stroke();
  ctx.restore();
}

// ── Spin déclenché depuis verify.js via dispatchEvent ─────────

export function triggerSpin() {
  if (spinning || hasPlayed()) return;

  spinning = true;
  const btn = document.getElementById('wheel-center-btn');
  if (btn) { btn.disabled = true; btn.textContent = '…'; }

  const winner  = pickPrize();
  const prize   = PRIZES[winner];
  const turns   = (Math.floor(Math.random() * 3) + 6) * TAU;
  const offset  = -(winner * SEG_A) - SEG_A / 2;
  const target  = angle + turns + offset - (angle % TAU);
  const dur     = DURATION + (Math.random() * 1200 - 600);
  const t0      = performance.now();

  if (navigator.vibrate) navigator.vibrate([15, 60, 15]);

  const frame = (now) => {
    const p = Math.min((now - t0) / dur, 1);
    const e = easeOutCubic(p);
    angle    = angle + (target - angle) * e;
    draw(angle);

    if (p < 1) {
      requestAnimationFrame(frame);
    } else {
      angle    = target % TAU;
      spinning = false;
      setPlayed(prize);
      draw(angle);
      setTimeout(() => showResult(prize), 350);
      if (prize.key !== 'noluck' && prize.key !== 'respin') {
        import('./confetti.js').then(m => m.launch());
      }
      if (prize.key === 'respin') {
        setTimeout(() => doRespin(), 3000);
      }
    }
  };

  requestAnimationFrame(frame);
}

function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

function pickPrize() {
  const total = PRIZES.reduce((s, p) => s + p.prob, 0);
  let r = Math.random() * total, c = 0;
  for (let i = 0; i < PRIZES.length; i++) { c += PRIZES[i].prob; if (r <= c) return i; }
  return PRIZES.length - 1;
}

// ── Overlay résultat ──────────────────────────────────────────

function showResult(prize) {
  const overlay = document.getElementById('result-overlay');
  const name    = document.getElementById('result-prize');
  const sub     = document.getElementById('result-sub');
  const cta     = document.getElementById('result-cta');

  if (name) name.textContent = prize.name;

  if (sub) {
    if      (prize.key === 'noluck')  sub.textContent = 'Merci pour ta participation.';
    else if (prize.key === 'respin')  sub.textContent = 'Nouvelle tentative dans quelques secondes…';
    else                              sub.textContent = 'Remplis le formulaire pour récupérer ton lot.';
  }

  if (cta) {
    if (prize.key === 'noluck') {
      cta.textContent = 'Fermer';
      cta.onclick = () => overlay.classList.remove('active');
    } else if (prize.key === 'respin') {
      cta.textContent = 'Rejouer';
      cta.onclick = () => { overlay.classList.remove('active'); doRespin(); };
    } else {
      cta.textContent = 'Renseigner mes informations';
      cta.onclick = () => scrollToForm(prize);
    }
  }

  document.getElementById('result-close')?.addEventListener('click', () => overlay.classList.remove('active'), { once: true });
  overlay.classList.add('active');
}

function scrollToForm(prize) {
  document.getElementById('result-overlay')?.classList.remove('active');
  document.dispatchEvent(new CustomEvent('wheel:prize', { detail: prize }));
  document.getElementById('form-section')?.scrollIntoView({ behavior: 'smooth' });
}

function showAlreadyPlayed() {
  const el     = document.getElementById('already-played');
  const stored = getResult();

  if (el) {
    if (stored) {
      const n = el.querySelector('.already-prize-name');
      if (n) n.textContent = stored.name;
    }
    el.classList.add('active');
  }

  const btn = document.getElementById('wheel-center-btn');
  if (btn) btn.disabled = true;
}

function doRespin() {
  sessionStorage.removeItem('ct26_played');
  sessionStorage.removeItem('ct26_result');
  const btn = document.getElementById('wheel-center-btn');
  if (btn) { btn.disabled = false; btn.textContent = 'LANCER'; }
  spinning = false;
  document.getElementById('result-overlay')?.classList.remove('active');
  btn?.addEventListener('click', () => { if (!spinning) triggerSpin(); }, { once: true });
}
