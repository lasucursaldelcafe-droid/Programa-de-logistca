import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import {
  getFirestoreDb,
  parseCustomRolePermisos,
  type CustomRole,
} from "@spe/shared";
import { isDemoMode } from "../lib/mode";
import { isSheetsBackend } from "../lib/backend";
import { useSheetsPoll } from "./useSheetsPoll";
import { demoStore } from "../demo/store";
import { useSyncExternalStore } from "react";

function useDemoSnapshot<T>(selector: () => T): T {
  return useSyncExternalStore(
    (cb) => demoStore.subscribe(cb),
    selector,
    selector,
  );
}

function normalizeCustomRole(raw: Record<string, unknown>): CustomRole {
  return {
    id: String(raw.id),
    nombre: String(raw.nombre ?? ""),
    descripcion: raw.descripcion ? String(raw.descripcion) : undefined,
    baseRole: (raw.baseRole as CustomRole["baseRole"]) ?? "trabajador",
    permisos: parseCustomRolePermisos(raw.permisos),
    activo: raw.activo !== "false" && raw.activo !== false,
    creadoEn: String(raw.creadoEn ?? new Date().toISOString()),
    creadoPor: String(raw.creadoPor ?? ""),
    creadoPorNombre: raw.creadoPorNombre ? String(raw.creadoPorNombre) : undefined,
  };
}

export function useCustomRoles(): CustomRole[] {
  const [roles, setRoles] = useState<CustomRole[]>([]);
  const sheetsRoles = useSheetsPoll<Record<string, unknown>>("customRoles");

  useEffect(() => {
    if (isDemoMode() || isSheetsBackend()) return;
    const unsub = onSnapshot(collection(getFirestoreDb(), "customRoles"), (snap) =>
      setRoles(snap.docs.map((d) => normalizeCustomRole({ id: d.id, ...d.data() }))),
    );
    return unsub;
  }, []);

  const demoRoles = useDemoSnapshot(() => demoStore.customRoles);
  if (isDemoMode()) return demoRoles;
  if (isSheetsBackend()) {
    return sheetsRoles.map((r) => normalizeCustomRole(r));
  }
  return roles;
}

export function getActiveCustomRoles(roles: CustomRole[]): CustomRole[] {
  return roles.filter((r) => r.activo);
}

export function getCustomRolesForBase(
  roles: CustomRole[],
  baseRole: CustomRole["baseRole"],
): CustomRole[] {
  return roles.filter((r) => r.activo && r.baseRole === baseRole);
}
