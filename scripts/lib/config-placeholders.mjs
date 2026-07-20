/** Tokens de API que no son credenciales reales de producción. */
const PLACEHOLDER_TOKENS = new Set([
  "cambiar-token-seguro",
  "placeholder",
  "changeme",
  "tu-token",
]);

/**
 * Detecta valores placeholder en config (URLs incompletas, tokens de ejemplo, etc.).
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
  if (PLACEHOLDER_TOKENS.has(v.toLowerCase())) return true;
  return false;
}

export function isUsableSheetsApiToken(token) {
  const normalized = (token ?? "").trim().toLowerCase();
  return normalized.length >= 16 && !PLACEHOLDER_TOKENS.has(normalized);
}

export function isConfigSet(value) {
  return typeof value === "string" && value.trim().length > 0 && !isConfigPlaceholder(value);
}
