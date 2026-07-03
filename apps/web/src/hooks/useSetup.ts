import { useEffect, useState, useSyncExternalStore } from "react";
import { doc, onSnapshot, setDoc, updateDoc } from "firebase/firestore";
import {
  getFirestoreDb,
  type SetupConfig,
  type SetupPaso,
} from "@spe/shared";
import { DEMO_MODE } from "../lib/mode";
import { demoStore } from "../demo/store";

const CONFIG_ID = "default";

function useDemoSnapshot<T>(selector: () => T): T {
  return useSyncExternalStore(demoStore.subscribe.bind(demoStore), selector, selector);
}

export function useSetupConfig(): SetupConfig | null {
  const [config, setConfig] = useState<SetupConfig | null>(null);

  useEffect(() => {
    if (DEMO_MODE) return;
    const unsub = onSnapshot(doc(getFirestoreDb(), "setupConfig", CONFIG_ID), (snap) => {
      if (!snap.exists()) {
        setConfig(null);
        return;
      }
      setConfig({ id: snap.id, ...snap.data() } as SetupConfig);
    });
    return unsub;
  }, []);

  const demoConfig = useDemoSnapshot(() => demoStore.setupConfig);
  return DEMO_MODE ? demoConfig : config;
}

export async function initSetupConfig(actor: {
  uid: string;
  nombre: string;
}): Promise<SetupConfig> {
  const base: Omit<SetupConfig, "id"> = {
    completado: false,
    pasoActual: "evento",
    pasosCompletados: [],
    actualizadoEn: new Date().toISOString(),
    actualizadoPor: actor.uid,
    actualizadoPorNombre: actor.nombre,
  };

  if (DEMO_MODE) {
    demoStore.setSetupConfig({ ...base, id: CONFIG_ID });
    return demoStore.setupConfig!;
  }

  await setDoc(doc(getFirestoreDb(), "setupConfig", CONFIG_ID), base);
  return { id: CONFIG_ID, ...base };
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
    nextIndex < 5
      ? (["evento", "sitios", "tarifas", "qr", "resumen"] as SetupPaso[])[nextIndex] ?? "resumen"
      : "resumen";

  const patch: Partial<SetupConfig> = {
    pasoActual,
    pasosCompletados,
    actualizadoEn: new Date().toISOString(),
    actualizadoPor: data.actor.uid,
    actualizadoPorNombre: data.actor.nombre,
  };
  if (data.eventoId) patch.eventoId = data.eventoId;

  if (DEMO_MODE) {
    demoStore.updateSetupConfig(patch);
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
    pasosCompletados: ["evento", "sitios", "tarifas", "qr", "resumen"],
    actualizadoEn: new Date().toISOString(),
    actualizadoPor: actor.uid,
    actualizadoPorNombre: actor.nombre,
  };

  if (DEMO_MODE) {
    demoStore.updateSetupConfig(patch);
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
