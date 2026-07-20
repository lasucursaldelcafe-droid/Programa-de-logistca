import { useEffect, useMemo, useState } from "react";
import { useEvents } from "./useDataStore";
import { useSetupConfig } from "./useSetup";

export const EVENTO_OPERACION_STORAGE_KEY = "spe-evento-operacion";

export function useEventoOperacion() {
  const events = useEvents();
  const setupConfig = useSetupConfig();
  const [eventId, setEventId] = useState("");

  useEffect(() => {
    if (events.length === 0) {
      setEventId("");
      return;
    }
    const stored = sessionStorage.getItem(EVENTO_OPERACION_STORAGE_KEY);
    const fromSetup = setupConfig?.eventoId;
    const initial =
      (stored && events.some((e) => e.id === stored) ? stored : null) ??
      (fromSetup && events.some((e) => e.id === fromSetup) ? fromSetup : null) ??
      events[0]?.id ??
      "";
    setEventId(initial);
  }, [events, setupConfig?.eventoId]);

  useEffect(() => {
    if (eventId) sessionStorage.setItem(EVENTO_OPERACION_STORAGE_KEY, eventId);
  }, [eventId]);

  const evento = useMemo(
    () => events.find((e) => e.id === eventId) ?? null,
    [events, eventId],
  );

  return { events, eventId, setEventId, evento };
}
