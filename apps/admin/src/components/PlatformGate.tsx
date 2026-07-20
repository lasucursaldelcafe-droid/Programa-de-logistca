import { Navigate } from "react-router-dom";
import {
  puedeAccederPlataforma,
  rutaHomePorRol,
  type AppPlatform,
} from "@spe/shared";
import { LoadingScreen } from "../components/FeedbackStates";
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
    return <LoadingScreen />;
  }

  if (!user) return <Navigate to="/login" replace />;

  if (!puedeAccederPlataforma(user.role, platform)) {
    return <Navigate to={rutaHomePorRol(user.role)} replace />;
  }

  return <>{children}</>;
}
