import { useEffect, useMemo, type ReactNode } from "react";
import {
  registerSessionPermissions,
  resolvePermissions,
  type CustomRole,
} from "@spe/shared";
import { useAuth } from "./AuthContext";
import { useCustomRoles } from "../hooks/useCustomRoles";

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const customRoles = useCustomRoles();

  const permissions = useMemo(() => {
    if (!user) return null;
    const customRole: CustomRole | null =
      user.customRoleId != null
        ? customRoles.find((r) => r.id === user.customRoleId) ?? null
        : null;
    return resolvePermissions(user.role, customRole);
  }, [user, customRoles]);

  useEffect(() => {
    registerSessionPermissions(() => permissions);
    return () => registerSessionPermissions(null);
  }, [permissions]);

  return children;
}
