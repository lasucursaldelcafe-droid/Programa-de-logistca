/**
 * Cliente HTTP para backend Google Sheets (Apps Script Web App).
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

export async function sheetsHealth(): Promise<{ ok: boolean; backend?: string }> {
  const res = await fetch(`${webAppUrl}?action=health&token=${encodeURIComponent(apiToken)}`);
  if (!res.ok) return { ok: false };
  return res.json() as Promise<{ ok: boolean; backend?: string }>;
}

export async function sheetsLogin(email: string, password: string): Promise<SheetsLoginResult> {
  if (!isSheetsBackendConfigured()) {
    throw new Error("Backend Sheets no configurado. Ve a /configurar o restablece modo demo.");
  }
  const res = await fetch(webAppUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "login",
      token: apiToken,
      email: email.trim().toLowerCase(),
      password: password.trim(),
    }),
  });
  let data: SheetsLoginResult & { error?: string };
  try {
    data = (await res.json()) as SheetsLoginResult & { error?: string };
  } catch {
    throw new Error("No se pudo conectar al backend Sheets. Revisa URL y token en /configurar.");
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
  const url = `${webAppUrl}?action=list&collection=${encodeURIComponent(collection)}&token=${encodeURIComponent(apiToken)}`;
  const res = await fetch(url);
  const data = (await res.json()) as { items?: T[]; error?: string };
  if (!res.ok || data.error) throw new Error(data.error ?? "List Sheets falló");
  return data.items ?? [];
}

export async function sheetsUpsert(
  collection: string,
  record: Record<string, unknown>,
  idField = "id",
): Promise<void> {
  const res = await fetch(webAppUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "upsert", token: apiToken, collection, record, idField }),
  });
  const data = (await res.json()) as { ok?: boolean; error?: string };
  if (!res.ok || data.error) throw new Error(data.error ?? "Upsert Sheets falló");
}

export async function sheetsDelete(
  collection: string,
  id: string,
  idField = "id",
): Promise<void> {
  const res = await fetch(webAppUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "delete", token: apiToken, collection, id, idField }),
  });
  const data = (await res.json()) as { ok?: boolean; error?: string };
  if (!res.ok || data.error) throw new Error(data.error ?? "Delete Sheets falló");
}
