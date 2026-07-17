import { useEffect, useState } from "react";
import { sheetsList } from "@spe/shared";
import { isSheetsBackend } from "../lib/backend";

/** Lista una colección Sheets con polling (sustituto de onSnapshot). */
export function useSheetsPoll<T>(collection: string, intervalMs = 8000): T[] {
  const [items, setItems] = useState<T[]>([]);

  useEffect(() => {
    if (!isSheetsBackend()) return;

    let cancelled = false;

    async function refresh(): Promise<void> {
      try {
        const data = await sheetsList<T>(collection);
        if (!cancelled) setItems(data);
      } catch {
        if (!cancelled) setItems([]);
      }
    }

    void refresh();
    const timer = window.setInterval(() => void refresh(), intervalMs);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [collection, intervalMs]);

  return items;
}
