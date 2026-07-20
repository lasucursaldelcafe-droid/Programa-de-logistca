import { useEffect, useState, useSyncExternalStore } from "react";
import { doc, onSnapshot, setDoc, updateDoc } from "firebase/firestore";
import {
  getFirestoreDb,
  SETUP_PASOS_ORDEN,
  type SetupConfig,
  type SetupPaso,
} from "@spe/shared";
import { isDemoMode } from "../lib/mode";
import { isSheetsBackend } from "../lib/backend";
import { demoStore } from "../demo/store";
import { sheetsGetById, sheetsUpsertRecord } from "../data/sheetsOps";
import { useSheetsPoll } from "./useSheetsPoll";

const CONFIG_ID = "default";

function useDemoSnapshot<T>(selector: () => T): T {
  return useSyncExternalStore(demoStore.subscribe.bind(demoStore), selector, selector);
}

function parseSetupConfig(raw: Record<string, unknown>): SetupConfig {
  const pasosRaw = raw.pasosCompletados;
  let pasosCompletados: SetupPaso[] = [];
  if (Array.isArray(pasosRaw)) {
    pasosCompletados = pasosRaw as SetupPaso[];
  } else if (typeof pasosRaw === "string" && pasosRaw.trim()) {
    try {
      pasosCompletados = JSON.parse(pasosRaw) as SetupPaso[];
    } catch {
      pasosCompletados = pasosRaw.split(",").filter(Boolean) as SetupPaso[];
    }
  }

  return {
    id: String(raw.id ?? CONFIG_ID),
    completado: raw.completado === true || raw.completado === "true",
    pasoActual: (raw.pasoActual as SetupPaso) ?? "evento",
    pasosCompletados,
    eventoId: raw.eventoId ? String(raw.eventoId) : undefined,
    actualizadoEn: String(raw.actualizadoEn ?? ""),
    actualizadoPor: String(raw.actualizadoPor ?? ""),
    actualizadoPorNombre: raw.actualizadoPorNombre ? String(raw.actualizadoPorNombre) : undefined,
  };
}

function serializeSetupConfig(config: SetupConfig): Record<string, unknown> {
  return {
    id: config.id,
    completado: config.completado,
    pasoActual: config.pasoActual,
    pasosCompletados: JSON.stringify(config.pasosCompletados),
    eventoId: config.eventoId ?? "",
    actualizadoEn: config.actualizadoEn,
    actualizadoPor: config.actualizadoPor,
    actualizadoPorNombre: config.actualizadoPorNombre ?? "",
  };
}

export function useSetupConfig(): SetupConfig | null {
  const [config, setConfig] = useState<SetupConfig | null>(null);
  const sheetsConfigs = useSheetsPoll<Record<string, unknown>>("setupConfig");

  useEffect(() => {
    if (isDemoMode() || isSheetsBackend()) return;
    const unsub = onSnapshot(doc(getFirestoreDb(), "setupConfig", CONFIG_ID), (snap) => {
      if (!snap.exists()) {
        setConfig(null);
        return;
      }
      setConfig({ id: snap.id, ...snap.data() } as SetupConfig);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!isSheetsBackend()) return;
    const row = sheetsConfigs.find((c) => String(c.id) === CONFIG_ID);
    setConfig(row ? parseSetupConfig(row) : null);
  }, [sheetsConfigs]);

  const demoConfig = useDemoSnapshot(() => demoStore.setupConfig);
  if (isDemoMode()) return demoConfig;
  if (isSheetsBackend()) return config;
  return config;
}

export async function initSetupConfig(actor: {
  uid: string;
  nombre: string;
}): Promise<SetupConfig> {
  const base: SetupConfig = {
    id: CONFIG_ID,
    completado: false,
    pasoActual: "evento",
    pasosCompletados: [],
    actualizadoEn: new Date().toISOString(),
    actualizadoPor: actor.uid,
    actualizadoPorNombre: actor.nombre,
  };

  if (isDemoMode()) {
    demoStore.setSetupConfig(base);
    return demoStore.setupConfig!;
  }

  if (isSheetsBackend()) {
    await sheetsUpsertRecord("setupConfig", serializeSetupConfig(base), "id");
    return base;
  }

  const { id: _id, ...data } = base;
  await setDoc(doc(getFirestoreDb(), "setupConfig", CONFIG_ID), data);
  return base;
}

export async function advanceSetupPaso(data: {
  paso: SetupPaso;
  eventoId?: string;
  actor: { uid: string; nombre: string };
  current: SetupConfig;
}): Promise<void> {
  const pasosCompletados = data.current.pasosCompletados.includes(data.paso)
    ? data.current.pasosCompletados
    : [...data.current.pasosCompletados, data.paso];

  const nextIndex = pasosCompletados.length;
  const pasoActual =
    nextIndex < SETUP_PASOS_ORDEN.length
      ? SETUP_PASOS_ORDEN[nextIndex] ?? "resumen"
      : "resumen";

  const patch: Partial<SetupConfig> = {
    pasoActual,
    pasosCompletados,
    actualizadoEn: new Date().toISOString(),
    actualizadoPor: data.actor.uid,
    actualizadoPorNombre: data.actor.nombre,
  };
  if (data.eventoId) patch.eventoId = data.eventoId;

  if (isDemoMode()) {
    demoStore.updateSetupConfig(patch);
    return;
  }

  if (isSheetsBackend()) {
    const current = await sheetsGetById<Record<string, unknown>>("setupConfig", CONFIG_ID);
    const merged = parseSetupConfig({ ...(current ?? { id: CONFIG_ID }), ...data.current, ...patch });
    await sheetsUpsertRecord("setupConfig", serializeSetupConfig(merged), "id");
    return;
  }

  await updateDoc(doc(getFirestoreDb(), "setupConfig", CONFIG_ID), patch);
}

export async function completeSetup(actor: {
  uid: string;
  nombre: string;
}): Promise<void> {
  const patch: Partial<SetupConfig> = {
    completado: true,
    pasoActual: "resumen",
    pasosCompletados: [...SETUP_PASOS_ORDEN],
    actualizadoEn: new Date().toISOString(),
    actualizadoPor: actor.uid,
    actualizadoPorNombre: actor.nombre,
  };

  if (isDemoMode()) {
    demoStore.updateSetupConfig(patch);
    return;
  }

  if (isSheetsBackend()) {
    const current = await sheetsGetById<Record<string, unknown>>("setupConfig", CONFIG_ID);
    const merged = parseSetupConfig({ ...(current ?? { id: CONFIG_ID }), ...patch });
    await sheetsUpsertRecord("setupConfig", serializeSetupConfig(merged), "id");
    return;
  }

  await updateDoc(doc(getFirestoreDb(), "setupConfig", CONFIG_ID), patch);
}

export async function resetSetupForNewEvent(actor: {
  uid: string;
  nombre: string;
}): Promise<void> {
  await initSetupConfig(actor);
}
