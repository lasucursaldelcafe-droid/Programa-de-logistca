import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "@core/contexts/AuthContext";
import { PlatformGate } from "@core/components/PlatformGate";
import { MasterLayout } from "./components/MasterLayout";
import { LoginPage } from "./pages/LoginPage";
import { MasterHomePage } from "./pages/MasterHomePage";
import { AdminsPage } from "./pages/AdminsPage";
import { InformesPage } from "./pages/InformesPage";
import { AuditoriaPage } from "./pages/AuditoriaPage";
import { AyudaPage } from "@core/pages/AyudaPage";

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
  return <PlatformGate platform="master">{children}</PlatformGate>;
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/ayuda" element={<AyudaPage platform="master" />} />
      <Route
        element={
          <Protected>
            <MasterLayout />
          </Protected>
        }
      >
        <Route index element={<MasterHomePage />} />
        <Route path="administradores" element={<AdminsPage />} />
        <Route path="informes" element={<InformesPage />} />
        <Route path="auditoria" element={<AuditoriaPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
