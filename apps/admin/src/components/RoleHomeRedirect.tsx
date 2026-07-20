import { Navigate } from "react-router-dom";
import { rutaHomePorRol } from "@spe/shared";
import { LoadingScreen } from "./FeedbackStates";
import { useAuth } from "../contexts/AuthContext";

/** Redirige al panel correcto según el rol (app unificada). */
export function RoleHomeRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) return <Navigate to="/login" replace />;

  return <Navigate to={rutaHomePorRol(user.role)} replace />;
}
