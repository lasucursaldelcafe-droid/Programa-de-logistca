import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import { AppLayout } from "./components/AppLayout";
import { PlatformGate } from "./components/PlatformGate";
import { LoginPage } from "./pages/LoginPage";
import { HomePage } from "./pages/HomePage";
import { PersonalPage } from "./pages/PersonalPage";
import { TurnosPage } from "./pages/TurnosPage";
import { CuentasPage } from "./pages/CuentasPage";
import { QrSitiosPage } from "./pages/QrSitiosPage";
import { MapaEnVivoPage } from "./pages/MapaEnVivoPage";
import { NotificacionesPage } from "./pages/NotificacionesPage";
import { NominaPage } from "./pages/NominaPage";
import { ConfiguracionPage } from "./pages/ConfiguracionPage";
import { ReportesPage } from "./pages/ReportesPage";
import { AyudaPage } from "./pages/AyudaPage";

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
  return (
    <PlatformGate platform="admin">{children}</PlatformGate>
  );
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/ayuda" element={<AyudaPage platform="admin" />} />
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
        <Route path="reportes" element={<ReportesPage />} />
        <Route path="notificaciones" element={<NotificacionesPage />} />
        <Route path="nomina" element={<NominaPage />} />
        <Route path="configuracion" element={<ConfiguracionPage />} />
        <Route path="ayuda" element={<AyudaPage platform="admin" />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
