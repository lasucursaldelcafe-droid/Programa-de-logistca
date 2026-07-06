import { useCallback, useSyncExternalStore } from "react";
import type { CredencialesIntegracion, TipoIntegracion } from "@spe/shared";
import { demoStore } from "../demo/store";

function useDemoSnapshot<T>(selector: () => T): T {
  return useSyncExternalStore(demoStore.subscribe.bind(demoStore), selector, selector);
}

export function useCredencialesIntegracion(id: TipoIntegracion): CredencialesIntegracion {
  return useDemoSnapshot(() => demoStore.getCredenciales(id));
}

export function useAllCredenciales(): Record<TipoIntegracion, CredencialesIntegracion> {
  return useDemoSnapshot(() => demoStore.credencialesIntegraciones);
}

export function useIntegrationConfig() {
  const save = useCallback((creds: CredencialesIntegracion) => {
    demoStore.saveCredenciales(creds);
  }, []);

  const clear = useCallback((id: TipoIntegracion) => {
    demoStore.clearCredenciales(id);
  }, []);

  const uploadJsonFile = useCallback(
    async (id: TipoIntegracion, file: File): Promise<CredencialesIntegracion> => {
      const text = await file.text();
      JSON.parse(text);
      const existing = demoStore.getCredenciales(id);
      const updated: CredencialesIntegracion = {
        ...existing,
        id,
        archivoNombre: file.name,
        archivoJson: text,
        actualizadoEn: new Date().toISOString(),
      };
      demoStore.saveCredenciales(updated);
      return updated;
    },
    [],
  );

  return { save, clear, uploadJsonFile };
}

export function credencialesCompletas(
  id: TipoIntegracion,
  creds: CredencialesIntegracion,
): boolean {
  if (creds.archivoJson) return true;
  switch (id) {
    case "siigo":
      return Boolean(creds.usuario && creds.apiKey);
    case "whatsapp":
      return Boolean(creds.token && creds.phoneNumberId);
    case "facebook":
    case "instagram":
      return Boolean(creds.appId && creds.apiSecret && creds.token && creds.pageId);
    case "webhook":
      return Boolean(creds.webhookUrl);
    case "web_form":
      return Boolean(creds.webhookUrl);
    default:
      return false;
  }
}
