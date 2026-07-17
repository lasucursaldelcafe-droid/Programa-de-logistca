import type { AppUser } from "./types";

const SESSION_KEY = "spe-sheets-session";

export function saveSheetsSession(user: AppUser): void {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function loadSheetsSession(): AppUser | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AppUser;
  } catch {
    return null;
  }
}

export function clearSheetsSession(): void {
  sessionStorage.removeItem(SESSION_KEY);
}
