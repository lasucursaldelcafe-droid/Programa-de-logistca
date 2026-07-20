/**
 * Cliente HTTP para backend Google Sheets (Apps Script Web App).
 * Health/list usan GET; login y escritura usan POST JSON (Apps Script desplegado).
 */

export interface SheetsLoginResult {
  uid: string;
  email: string;
  nombre: string;
  role: string;
  workerId?: string | null;
  customRoleId?: string | null;
  perfilCompleto?: boolean;
}

let webAppUrl = "";
let apiToken = "";

export function configureSheetsClient(url: string, token: string): void {
  webAppUrl = url.replace(/\/$/, "");
  apiToken = token;
}

export function clearSheetsClient(): void {
  webAppUrl = "";
  apiToken = "";
}

export function isSheetsBackendConfigured(): boolean {
  return webAppUrl.length > 0 && apiToken.length > 0;
}

function sheetsActionUrl(params: Record<string, string>): string {
  const qs = new URLSearchParams({ token: apiToken, ...params });
  return `${webAppUrl}?${qs.toString()}`;
}

async function sheetsPost(payload: Record<string, unknown>): Promise<Response> {
  if (!isSheetsBackendConfigured()) {
    throw new Error("Backend Sheets no configurado");
  }
  try {
    return await fetch(webAppUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: apiToken, ...payload }),
      redirect: "follow",
      credentials: "omit",
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("Failed to fetch") || msg.includes("NetworkError")) {
      throw new Error(
        "No se pudo conectar a Google Sheets. Usa «Restablecer modo demo» o revisa URL/token en /configurar.",
      );
    }
    throw err;
  }
}

async function sheetsFetch(url: string): Promise<Response> {
  try {
    return await fetch(url, {
      method: "GET",
      redirect: "follow",
      credentials: "omit",
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("Failed to fetch") || msg.includes("NetworkError")) {
      throw new Error(
        "No se pudo conectar a Google Sheets. Usa «Restablecer modo demo» o revisa URL/token en /configurar.",
      );
    }
    throw err;
  }
}

export async function sheetsHealth(): Promise<{ ok: boolean; backend?: string }> {
  const res = await sheetsFetch(sheetsActionUrl({ action: "health" }));
  if (!res.ok) return { ok: false };
  return res.json() as Promise<{ ok: boolean; backend?: string }>;
}

export async function sheetsLogin(email: string, password: string): Promise<SheetsLoginResult> {
  if (!isSheetsBackendConfigured()) {
    throw new Error("Backend Sheets no configurado. Ve a /configurar o restablece modo demo.");
  }
  const res = await sheetsPost({
    action: "login",
    email: email.trim().toLowerCase(),
    password: password.trim(),
  });
  let data: SheetsLoginResult & { error?: string };
  try {
    data = (await res.json()) as SheetsLoginResult & { error?: string };
  } catch {
    throw new Error("Respuesta inválida del backend Sheets. Revisa la URL de la Web App.");
  }
  if (res.status === 401 && data.error === "Unauthorized") {
    throw new Error("Token API incorrecto. Vuelve a /configurar y pega las credenciales del correo.");
  }
  if (!res.ok || data.error) {
    throw new Error(data.error ?? "Login Sheets falló");
  }
  return data;
}

export async function sheetsList<T>(collection: string): Promise<T[]> {
  const url = sheetsActionUrl({ action: "list", collection });
  const res = await sheetsFetch(url);
  const data = (await res.json()) as { items?: T[]; error?: string };
  if (!res.ok || data.error) throw new Error(data.error ?? "List Sheets falló");
  return data.items ?? [];
}

export async function sheetsUpsert(
  collection: string,
  record: Record<string, unknown>,
  idField = "id",
): Promise<void> {
  const res = await sheetsPost({
    action: "upsert",
    collection,
    idField,
    record,
  });
  const data = (await res.json()) as { ok?: boolean; error?: string };
  if (!res.ok || data.error) throw new Error(data.error ?? "Upsert Sheets falló");
}

export async function sheetsDelete(
  collection: string,
  id: string,
  idField = "id",
): Promise<void> {
  const res = await sheetsPost({
    action: "delete",
    collection,
    id,
    idField,
  });
  const data = (await res.json()) as { ok?: boolean; error?: string };
  if (!res.ok || data.error) throw new Error(data.error ?? "Delete Sheets falló");
}

/** POST desde Node/scripts (clasp, seed). Misma ruta que el navegador. */
export async function sheetsPostJson(payload: Record<string, unknown>): Promise<unknown> {
  const res = await sheetsPost(payload);
  const data = (await res.json()) as { error?: string };
  if (!res.ok || data.error) throw new Error(data.error ?? `Sheets POST falló (${res.status})`);
  return data;
}
