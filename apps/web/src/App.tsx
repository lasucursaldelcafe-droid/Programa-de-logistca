import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import { AppLayout } from "./components/AppLayout";
import { LoginPage } from "./pages/LoginPage";
import { HomePage } from "./pages/HomePage";
import { PersonalPage } from "./pages/PersonalPage";
import { TurnosPage } from "./pages/TurnosPage";
import { CuentasPage } from "./pages/CuentasPage";
import { ActivarCuentaPage } from "./pages/ActivarCuentaPage";
import { CompletarPerfilPage } from "./pages/CompletarPerfilPage";
import { QrSitiosPage } from "./pages/QrSitiosPage";
import { MarcarEntradaPage } from "./pages/MarcarEntradaPage";
import { MapaEnVivoPage } from "./pages/MapaEnVivoPage";
import { NotificacionesPage } from "./pages/NotificacionesPage";
import { NominaPage } from "./pages/NominaPage";

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
  if (user.role === "trabajador" && user.perfilCompleto !== true) {
    return <Navigate to="/completar-perfil" replace />;
  }
  return <>{children}</>;
}

function ProfileGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-neutral-400">
        Cargando…
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (user.perfilCompleto === true) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/activar/:token" element={<ActivarCuentaPage />} />
      <Route
        path="/completar-perfil"
        element={
          <ProfileGate>
            <CompletarPerfilPage />
          </ProfileGate>
        }
      />
      <Route
        element={
          <Protected>
            <AppLayout />
          </Protected>
        }
      >
        <Route index element={<HomePage />} />
        <Route path="personal" element={<PersonalPage />} />
        <Route path="turnos" element={<TurnosPage />} />
        <Route path="cuentas" element={<CuentasPage />} />
        <Route path="qr-sitios" element={<QrSitiosPage />} />
        <Route path="mapa" element={<MapaEnVivoPage />} />
        <Route path="marcar-entrada" element={<MarcarEntradaPage />} />
        <Route path="notificaciones" element={<NotificacionesPage />} />
        <Route path="nomina" element={<NominaPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
