import { Navigate, useLocation } from "react-router-dom";
import {
  puedeAccederPlataforma,
  rewriteWorkerDeepLinkForRole,
  rutaHomePorRol,
  type AppPlatform,
} from "@spe/shared";
import { LoadingScreen } from "./FeedbackStates";
import { useAuth } from "../contexts/AuthContext";

export function PlatformGate({
  platform,
  children,
}: {
  platform: AppPlatform;
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) return <Navigate to="/login" replace />;

  if (!puedeAccederPlataforma(user.role, platform)) {
    // Deep links viejos /worker/* para supervisores u oficina → consola correcta
    if (platform === "worker") {
      const rewritten = rewriteWorkerDeepLinkForRole(
        user.role,
        location.pathname,
        location.search,
      );
      if (rewritten) {
        return <Navigate to={rewritten} replace />;
      }
    }
    return <Navigate to={rutaHomePorRol(user.role)} replace />;
  }

  return <>{children}</>;
}
