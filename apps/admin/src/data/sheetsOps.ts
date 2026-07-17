import { sheetsList, sheetsUpsert, isSheetsBackendConfigured } from "@spe/shared";

async function ensureSheets(): Promise<void> {
  if (!isSheetsBackendConfigured()) {
    throw new Error("Backend Sheets no configurado. Ejecuta npm run setup:sheets-auto");
  }
}

export async function sheetsGetById<T>(
  collection: string,
  id: string,
  idField = "id",
): Promise<(T & { id: string }) | null> {
  await ensureSheets();
  const items = await sheetsList<Record<string, unknown>>(collection);
  const row = items.find((item) => String(item[idField] ?? item.id) === id);
  if (!row) return null;
  return { ...(row as T), id: String(row[idField] ?? row.id ?? id) } as T & { id: string };
}

export async function sheetsUpsertRecord(
  collection: string,
  record: Record<string, unknown>,
  idField = "id",
): Promise<void> {
  await ensureSheets();
  await sheetsUpsert(collection, record, idField);
}

export async function sheetsListAll<T>(collection: string): Promise<T[]> {
  await ensureSheets();
  return sheetsList<T>(collection);
}
