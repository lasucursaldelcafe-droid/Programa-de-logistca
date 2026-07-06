import { Navigate } from "react-router-dom";
import { rutaHomePorRol } from "@spe/shared";
import { useAuth } from "../contexts/AuthContext";

/** Redirige al panel correcto según el rol (app unificada). */
export function RoleHomeRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-neutral-400">
        Cargando…
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return <Navigate to={rutaHomePorRol(user.role)} replace />;
}
