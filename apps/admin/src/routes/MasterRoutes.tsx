import { Navigate, Route, Routes } from "react-router-dom";
import { LoadingScreen } from "../components/FeedbackStates";
import { useAuth } from "../contexts/AuthContext";
import { PlatformGate } from "../components/PlatformGate";
import { MasterLayout } from "@master/components/MasterLayout";
import { MasterHomePage } from "@master/pages/MasterHomePage";
import { AdminsPage } from "@master/pages/AdminsPage";
import { InformesPage } from "@master/pages/InformesPage";
import { AuditoriaPage } from "@master/pages/AuditoriaPage";
import { AyudaPage } from "../pages/AyudaPage";

function MasterProtected({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return <LoadingScreen />;
  }
  if (!user) return <Navigate to="/login" replace />;
  return <PlatformGate platform="master">{children}</PlatformGate>;
}

export function MasterRoutes() {
  return (
    <Routes>
      <Route path="ayuda" element={<AyudaPage platform="master" />} />
      <Route
        element={
          <MasterProtected>
            <MasterLayout />
          </MasterProtected>
        }
      >
        <Route index element={<MasterHomePage />} />
        <Route path="administradores" element={<AdminsPage />} />
        <Route path="informes" element={<InformesPage />} />
        <Route path="auditoria" element={<AuditoriaPage />} />
        <Route path="ayuda" element={<AyudaPage platform="master" />} />
      </Route>
    </Routes>
  );
}
