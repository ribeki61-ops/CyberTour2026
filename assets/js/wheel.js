/**
 * CYBERTOUR 2026 — wheel.js
 * 1 chance sur 5 (20%) — 6 lots visibles + 6 "Pas de lot" intercalés
 */

const SEGMENTS = [
  { label: 'T-Shirt\nCybertour',    prize: true,  color: '#1d4ed8', text: '#ffffff' },
  { label: 'Pas de\nlot',           prize: false, color: '#18181b', text: '#3f3f46' },
  { label: 'Clé USB\n32 Go',        prize: true,  color: '#2563eb', text: '#ffffff' },
  { label: 'Pas de\nlot',           prize: false, color: '#27272a', text: '#3f3f46' },
  { label: 'Pack\nStickers ×10',    prize: true,  color: '#1e40af', text: '#ffffff' },
  { label: 'Pas de\nlot',           prize: false, color: '#18181b', text: '#3f3f46' },
  { label: 'Sweat\nCybertour',      prize: true,  color: '#1d4ed8', text: '#ffffff' },
  { label: 'Pas de\nlot',           prize: false, color: '#27272a', text: '#3f3f46' },
  { label: 'Accès VIP\nLab-Cyber',  prize: true,  color: '#1e40af', text: '#ffffff' },
  { label: 'Pas de\nlot',           prize: false, color: '#18181b', text: '#3f3f46' },
  { label: 'Badge\nCollector',      prize: true,  color: '#2563eb', text: '#ffffff' },
  { label: 'Pas de\nlot',           prize: false, color: '#27272a', text: '#3f3f46' },
];

const N   = SEGMENTS.length;
const ARC = (2 * Math.PI) / N;

let currentAngle = 0;
let spinning     = false;
let canvas, ctx;

// ── Dessin ───────────────────────────────────────────
function draw() {
  const cx = canvas.width  / 2;
  const cy = canvas.height / 2;
  const r  = cx - 4;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  SEGMENTS.forEach((seg, i) => {
    const start = currentAngle + i * ARC;
    const end   = start + ARC;

    // Secteur
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, start, end);
    ctx.closePath();
    ctx.fillStyle   = seg.color;
    ctx.fill();
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth   = 2;
    ctx.stroke();

    // Texte
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(start + ARC / 2);
    ctx.textAlign = 'right';
    ctx.fillStyle = seg.text;
    const fSize   = Math.max(9, Math.round(r * 0.075));
    ctx.font      = `600 ${fSize}px 'Inter', sans-serif`;
    const lines   = seg.label.split('\n');
    const lh      = fSize + 3;
    const yOff    = -(lines.length - 1) * lh / 2;
    lines.forEach((line, li) => {
      ctx.fillText(line, r - 12, yOff + li * lh + fSize * 0.35);
    });
    ctx.restore();
  });

  // Cercle centre
  ctx.beginPath();
  ctx.arc(cx, cy, 28, 0, 2 * Math.PI);
  ctx.fillStyle   = '#09090b';
  ctx.fill();
  ctx.strokeStyle = '#2563eb';
  ctx.lineWidth   = 3;
  ctx.stroke();
}

// ── Init ─────────────────────────────────────────────
export function initWheel() {
  canvas = document.getElementById('wheelCanvas');
  if (!canvas) return;
  ctx = canvas.getContext('2d');

  const size    = Math.min(380, window.innerWidth - 32);
  canvas.width  = size;
  canvas.height = size;

  draw();

  // Déjà joué ?
  if (localStorage.getItem('ct26_done')) {
    const ap = document.getElementById('already-played');
    if (ap) ap.style.display = 'block';
    const ww = document.getElementById('wheel-wrap');
    if (ww) ww.style.pointerEvents = 'none';
  }
}

// ── Spin ─────────────────────────────────────────────
export function triggerSpin() {
  if (spinning) return;
  spinning = true;

  const centerBtn = document.getElementById('wheel-center-btn');
  if (centerBtn) centerBtn.disabled = true;

  // Tirage pondéré : 20% win, 80% lose
  const isWin = Math.random() < 0.20;

  const pool  = SEGMENTS
    .map((s, i) => ({ ...s, i }))
    .filter(s => s.prize === isWin);
  const pick  = pool[Math.floor(Math.random() * pool.length)];

  // Angle cible : milieu du segment choisi
  const targetCenter = pick.i * ARC + ARC / 2;
  const spins        = 7 * 2 * Math.PI;
  const finalAngle   = -(targetCenter + spins);

  animate(currentAngle, finalAngle, 5500, () => {
    currentAngle = finalAngle % (2 * Math.PI);
    spinning     = false;
    localStorage.setItem('ct26_done', '1');
    showResult(pick);
  });
}

// ── Animation easeOut ────────────────────────────────
function animate(from, to, duration, done) {
  const t0 = performance.now();
  (function frame(now) {
    const p  = Math.min(1, (now - t0) / duration);
    const e  = 1 - Math.pow(1 - p, 4);
    currentAngle = from + (to - from) * e;
    draw();
    p < 1 ? requestAnimationFrame(frame) : done();
  })(performance.now());
}

// ── Modal résultat ───────────────────────────────────
function showResult(seg) {
  const overlay  = document.getElementById('result-overlay');
  const prizeEl  = document.getElementById('result-prize');
  const subEl    = document.getElementById('result-sub');
  const ctaBtn   = document.getElementById('result-cta');
  const closeBtn = document.getElementById('result-close');
  if (!overlay) return;

  const prizeName = seg.label.replace('\n', ' ');

  if (seg.prize) {
    if (window.confetti) {
      confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } });
      setTimeout(() => confetti({ particleCount: 80, spread: 60, origin: { y: 0.5 } }), 600);
    }
    prizeEl.textContent    = prizeName;
    subEl.textContent      = 'Félicitations ! Renseignez vos coordonnées pour récupérer votre lot au stand.';
    ctaBtn.textContent     = 'Remplir mes coordonnées';
    ctaBtn.style.display   = '';
    closeBtn.style.display = 'none';

    ctaBtn.onclick = () => {
      overlay.classList.remove('active');
      document.getElementById('field-lot').value              = prizeName;
      document.getElementById('field-ts').value               = new Date().toISOString();
      document.getElementById('prize-recap-name').textContent = prizeName;
      const fs = document.getElementById('form-section');
      if (fs) {
        fs.style.display = '';
        fs.scrollIntoView({ behavior: 'smooth' });
      }
    };
  } else {
    prizeEl.textContent    = 'Pas de chance…';
    subEl.textContent      = 'Merci d\'avoir participé ! On se retrouve à la prochaine édition du Cybertour.';
    ctaBtn.style.display   = 'none';
    closeBtn.textContent   = 'Fermer';
    closeBtn.style.display = '';
    closeBtn.onclick       = () => overlay.classList.remove('active');
  }

  overlay.classList.add('active');
}
