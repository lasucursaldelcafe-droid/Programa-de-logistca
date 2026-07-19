/**
 * Detecta valores placeholder en config (no confundir con tokens reales como cambiar-token-seguro).
 */
export function isConfigPlaceholder(value) {
  if (typeof value !== "string") return true;
  const v = value.trim();
  if (!v) return true;
  if (/TU_ID/.test(v)) return true;
  if (/PEGAR_/.test(v)) return true;
  if (/TU_CONTRASEÑA/.test(v)) return true;
  if (/^tu-token$/i.test(v)) return true;
  if (/^tu-token-de-/i.test(v)) return true;
  return false;
}

export function isConfigSet(value) {
  return typeof value === "string" && value.trim().length > 0 && !isConfigPlaceholder(value);
}
