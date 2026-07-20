import { Navigate } from "react-router-dom";

export function ClientesPage() {
  return <Navigate to="/negocio?tab=clientes" replace />;
}
