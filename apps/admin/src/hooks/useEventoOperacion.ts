import { useCallback, useEffect, useMemo, useState } from "react";
import type { Evento } from "@spe/shared";
import { useEvents } from "./useDataStore";
import { useSetupConfig } from "./useSetup";

/** Evento activo compartido entre Operación, Mapa y Comunicación. */
export const EVENTO_OPERACION_STORAGE_KEY = "spe-evento-operacion";

function resolveInitialEventId(
  events: Evento[],
  setupEventoId?: string,
): string {
  if (events.length === 0) return "";
  const stored =
    typeof sessionStorage !== "undefined"
      ? sessionStorage.getItem(EVENTO_OPERACION_STORAGE_KEY)
      : null;
  if (stored && events.some((e) => e.id === stored)) return stored;
  if (setupEventoId && events.some((e) => e.id === setupEventoId)) return setupEventoId;
  return events[0]?.id ?? "";
}

export function useEventoOperacion() {
  const events = useEvents();
  const setupConfig = useSetupConfig();
  const [eventId, setEventIdState] = useState("");

  useEffect(() => {
    setEventIdState(resolveInitialEventId(events, setupConfig?.eventoId));
  }, [events, setupConfig?.eventoId]);

  useEffect(() => {
    if (!eventId) return;
    sessionStorage.setItem(EVENTO_OPERACION_STORAGE_KEY, eventId);
  }, [eventId]);

  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key !== EVENTO_OPERACION_STORAGE_KEY || !event.newValue) return;
      setEventIdState(event.newValue);
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setEventId = useCallback((id: string) => {
    setEventIdState(id);
    if (id) sessionStorage.setItem(EVENTO_OPERACION_STORAGE_KEY, id);
    else sessionStorage.removeItem(EVENTO_OPERACION_STORAGE_KEY);
  }, []);

  const evento = useMemo(
    () => events.find((e) => e.id === eventId) ?? null,
    [events, eventId],
  );

  return { events, eventId, setEventId, evento };
}
