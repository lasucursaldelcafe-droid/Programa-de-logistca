import { Navigate } from "react-router-dom";
import {
  puedeAccederPlataforma,
  rutaHomePorRol,
  type AppPlatform,
} from "@spe/shared";
import { useAuth } from "../contexts/AuthContext";

export function PlatformGate({
  platform,
  children,
}: {
  platform: AppPlatform;
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-neutral-400">
        Cargando…
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (!puedeAccederPlataforma(user.role, platform)) {
    return <Navigate to={rutaHomePorRol(user.role)} replace />;
  }

  return <>{children}</>;
}
