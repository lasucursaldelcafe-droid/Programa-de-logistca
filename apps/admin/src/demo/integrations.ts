import type { CredencialesIntegracion, TipoIntegracion } from "@spe/shared";

const STORAGE_KEY = "spe-credenciales-integraciones";

export const CREDENCIALES_VACIAS: Record<TipoIntegracion, CredencialesIntegracion> = {
  siigo: { id: "siigo" },
  whatsapp: { id: "whatsapp" },
  facebook: { id: "facebook" },
  instagram: { id: "instagram" },
  webhook: { id: "webhook" },
  web_form: { id: "web_form" },
};

export function loadCredencialesFromStorage(): Record<TipoIntegracion, CredencialesIntegracion> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...CREDENCIALES_VACIAS };
    const parsed = JSON.parse(raw) as Partial<Record<TipoIntegracion, CredencialesIntegracion>>;
    return {
      ...CREDENCIALES_VACIAS,
      ...parsed,
    };
  } catch {
    return { ...CREDENCIALES_VACIAS };
  }
}

export function saveCredencialesToStorage(
  credenciales: Record<TipoIntegracion, CredencialesIntegracion>,
): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(credenciales));
}

/** Serializa credenciales para pasar al conector connect(). */
export function credencialesToSecret(c: CredencialesIntegracion): string {
  if (c.archivoJson) return c.archivoJson;
  const parts = [
    c.apiKey,
    c.token,
    c.apiSecret,
    c.usuario,
    c.webhookUrl,
    c.phoneNumberId,
    c.pageId,
    c.appId,
  ].filter(Boolean);
  return parts.join("|") || "";
}
