import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import { AppLayout } from "./components/AppLayout";
import { LoginPage } from "./pages/LoginPage";
import { HomePage } from "./pages/HomePage";
import { PersonalPage } from "./pages/PersonalPage";
import { TurnosPage } from "./pages/TurnosPage";
import { ClientesPage } from "./pages/ClientesPage";
import { FacturacionPage } from "./pages/FacturacionPage";
import { InventarioPage } from "./pages/InventarioPage";
import { IntegracionesPage } from "./pages/IntegracionesPage";
import { SupervisionPage } from "./pages/SupervisionPage";

function Protected({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-neutral-400">
        Cargando…
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <Protected>
            <AppLayout />
          </Protected>
        }
      >
        <Route index element={<HomePage />} />
        <Route path="clientes" element={<ClientesPage />} />
        <Route path="facturacion" element={<FacturacionPage />} />
        <Route path="inventario" element={<InventarioPage />} />
        <Route path="integraciones" element={<IntegracionesPage />} />
        <Route path="supervision" element={<SupervisionPage />} />
        <Route path="personal" element={<PersonalPage />} />
        <Route path="turnos" element={<TurnosPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
