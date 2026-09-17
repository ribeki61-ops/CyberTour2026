/**
 * CYBERTOUR 2026 — confetti.js
 */

const COLORS = ['#2563eb', '#60a5fa', '#f8fafc', '#93c5fd', '#dbeafe'];

export function launch() {
  if (!window.confetti) return;
  window.confetti({ particleCount: 80, spread: 70, origin: { x: 0.5, y: 0.55 }, colors: COLORS, zIndex: 950, gravity: 1.1 });
  setTimeout(() => {
    window.confetti({ particleCount: 40, angle: 60,  spread: 50, origin: { x: 0, y: 0.6 }, colors: COLORS, zIndex: 950 });
    window.confetti({ particleCount: 40, angle: 120, spread: 50, origin: { x: 1, y: 0.6 }, colors: COLORS, zIndex: 950 });
  }, 250);
}

export function rain() {
  if (!window.confetti) return;
  const end = Date.now() + 3500;
  const f = () => {
    window.confetti({ particleCount: 3, angle: 60,  spread: 50, origin: { x: 0, y: 0 }, colors: COLORS, zIndex: 1, gravity: 0.9, scalar: 0.85 });
    window.confetti({ particleCount: 3, angle: 120, spread: 50, origin: { x: 1, y: 0 }, colors: COLORS, zIndex: 1, gravity: 0.9, scalar: 0.85 });
    if (Date.now() < end) requestAnimationFrame(f);
  };
  f();
}
