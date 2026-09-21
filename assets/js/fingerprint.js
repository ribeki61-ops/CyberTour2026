/**
 * CYBERTOUR 2026 — fingerprint.js
 * Empreinte navigateur sans dépendance externe
 */

export function getFingerprint() {
  const parts = [];

  // Écran
  parts.push(`${screen.width}x${screen.height}x${screen.colorDepth}`);

  // Timezone
  parts.push(Intl.DateTimeFormat().resolvedOptions().timeZone);

  // Langue
  parts.push(navigator.language);

  // Plateforme
  parts.push(navigator.platform || '');

  // Nombre de CPU logiques
  parts.push(navigator.hardwareConcurrency || 0);

  // Canvas fingerprint
  try {
    const c   = document.createElement('canvas');
    const ctx = c.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font         = '14px Arial';
    ctx.fillStyle    = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle    = '#069';
    ctx.fillText('Cybertour2026🔐', 2, 15);
    ctx.fillStyle    = 'rgba(102,204,0,0.7)';
    ctx.fillText('Cybertour2026🔐', 4, 17);
    parts.push(c.toDataURL().slice(-50));
  } catch { parts.push('no-canvas'); }

  // WebGL renderer
  try {
    const gl       = document.createElement('canvas').getContext('webgl');
    const dbg      = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : '';
    parts.push(renderer.slice(0, 40));
  } catch { parts.push('no-webgl'); }

  // Hash simple
  const str  = parts.join('|');
  let   hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}
