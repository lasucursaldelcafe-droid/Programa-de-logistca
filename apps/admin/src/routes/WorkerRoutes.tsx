import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { PlatformGate } from "../components/PlatformGate";
import { MarcarEntradaPage } from "../pages/MarcarEntradaPage";
import { TurnosPage } from "../pages/TurnosPage";
import { AyudaPage } from "../pages/AyudaPage";
import { NotificacionesPage } from "../pages/NotificacionesPage";
import { WorkerLayout } from "@worker/components/WorkerLayout";
import { WorkerHomePage } from "@worker/pages/WorkerHomePage";
import { ComunicacionPage } from "../pages/ComunicacionPage";
import { ReportarPage } from "@worker/pages/ReportarPage";

function WorkerProtected({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-neutral-400">
        Cargando…
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (user.perfilCompleto !== true) {
    return <Navigate to="/completar-perfil" replace />;
  }
  return <PlatformGate platform="worker">{children}</PlatformGate>;
}

export function WorkerRoutes() {
  return (
    <Routes>
      <Route
        element={
          <WorkerProtected>
            <WorkerLayout />
          </WorkerProtected>
        }
      >
        <Route index element={<WorkerHomePage />} />
        <Route path="turnos" element={<TurnosPage />} />
        <Route path="entrada" element={<MarcarEntradaPage />} />
        <Route path="reportar" element={<ReportarPage />} />
        <Route path="comunicacion" element={<ComunicacionPage />} />
        <Route path="notificaciones" element={<NotificacionesPage />} />
        <Route path="ayuda" element={<AyudaPage platform="worker" />} />
      </Route>
    </Routes>
  );
}
