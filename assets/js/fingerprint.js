/**
 * CYBERTOUR 2026 — fingerprint.js
 * Empreinte navigateur sans dépendance externe
 */

export function getFingerprint() {
  const parts = [];

  parts.push(`${screen.width}x${screen.height}x${screen.colorDepth}`);
  parts.push(Intl.DateTimeFormat().resolvedOptions().timeZone);
  parts.push(navigator.language);
  parts.push(navigator.platform || '');
  parts.push(navigator.hardwareConcurrency || 0);

  try {
    const c   = document.createElement('canvas');
    const ctx = c.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font         = '14px Arial';
    ctx.fillStyle    = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle    = '#069';
    ctx.fillText('Cybertour2026', 2, 15);
    ctx.fillStyle    = 'rgba(102,204,0,0.7)';
    ctx.fillText('Cybertour2026', 4, 17);
    parts.push(c.toDataURL().slice(-50));
  } catch { parts.push('no-canvas'); }

  try {
    const gl  = document.createElement('canvas').getContext('webgl');
    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    parts.push(dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL).slice(0, 40) : 'no-webgl');
  } catch { parts.push('no-webgl'); }

  const str  = parts.join('|');
  let   hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}
