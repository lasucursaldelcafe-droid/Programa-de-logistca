import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "@core/contexts/AuthContext";
import { PlatformGate } from "@core/components/PlatformGate";
import { ActivarCuentaPage } from "@core/pages/ActivarCuentaPage";
import { CompletarPerfilPage } from "@core/pages/CompletarPerfilPage";
import { MarcarEntradaPage } from "@core/pages/MarcarEntradaPage";
import { TurnosPage } from "@core/pages/TurnosPage";
import { WorkerLayout } from "./components/WorkerLayout";
import { LoginPage } from "./pages/LoginPage";
import { WorkerHomePage } from "./pages/WorkerHomePage";
import { ReportarPage } from "./pages/ReportarPage";

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
  if (user.perfilCompleto !== true) {
    return <Navigate to="/completar-perfil" replace />;
  }
  return <PlatformGate platform="worker">{children}</PlatformGate>;
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
            <WorkerLayout />
          </Protected>
        }
      >
        <Route index element={<WorkerHomePage />} />
        <Route path="turnos" element={<TurnosPage />} />
        <Route path="entrada" element={<MarcarEntradaPage />} />
        <Route path="reportar" element={<ReportarPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
