import { Navigate } from "react-router-dom";

/** Supervisión global deprecada: redirige al mapa del evento activo. */
export function SupervisionPage() {
  return <Navigate to="/operacion?tab=supervision" replace />;
}
