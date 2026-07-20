import { Navigate } from "react-router-dom";

export function InventarioPage() {
  return <Navigate to="/negocio?tab=inventario" replace />;
}
