/**
 * tenantBranding — Branding multi-empresa por slug (repogemin)
 * =============================================================
 * Cada empresa tiene su link propio: repogemin.vercel.app/?empresa={slug}
 * Al cargar, se consulta el branding público y se sobrescribe TODA la paleta
 * del design system (variables CSS de index.css) + logo/nombre de la empresa.
 */

const API_BASE_URL = 'https://web-production-95ed.up.railway.app';

function hexToRgba(hex, alpha) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '');
  if (!m) return `rgba(59, 130, 246, ${alpha})`;
  return `rgba(${parseInt(m[1], 16)}, ${parseInt(m[2], 16)}, ${parseInt(m[3], 16)}, ${alpha})`;
}

/** Sobrescribe la paleta completa del design system de repogemin. */
export function applyPaletteVars(paleta) {
  if (!paleta || !paleta.primary) return;
  const root = document.documentElement;
  const primary = paleta.primary;
  const secondary = paleta.secondary || primary;
  const accent = paleta.accent || primary;

  root.style.setProperty('--accent-primary', primary);
  root.style.setProperty('--accent-primary-hover', secondary);
  root.style.setProperty('--accent-primary-dark', accent);
  root.style.setProperty('--accent-primary-soft', hexToRgba(primary, 0.12));
  root.style.setProperty('--accent-glow', hexToRgba(primary, 0.25));
  root.style.setProperty('--border-focus', primary);
  root.style.setProperty('--border-accent', hexToRgba(primary, 0.3));
  root.style.setProperty('--bg-hover', hexToRgba(primary, 0.06));
}

/**
 * Lee ?empresa={slug} de la URL, trae el branding público y lo aplica.
 * Devuelve el branding ({empresa, logo_url, paleta_colores, activa, ...}) o null.
 */
export async function initTenantBranding() {
  try {
    const slug = new URLSearchParams(window.location.search).get('empresa');
    if (!slug) return null;
    const res = await fetch(`${API_BASE_URL}/public/portal/${encodeURIComponent(slug)}?portal=repogemin`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data.ok) {
      applyPaletteVars(data.paleta_colores);
      return data;
    }
  } catch (e) {
    console.warn('Branding de empresa no disponible:', e);
  }
  return null;
}
