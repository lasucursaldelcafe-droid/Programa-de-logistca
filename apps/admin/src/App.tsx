import { Navigate, Route, Routes } from "react-router-dom";
import { rutaHomePorRol } from "@spe/shared";
import { useAuth } from "./contexts/AuthContext";
import { AppLayout } from "./components/AppLayout";
import { PlatformGate } from "./components/PlatformGate";
import { RoleHomeRedirect } from "./components/RoleHomeRedirect";
import { LoginPage } from "./pages/LoginPage";
import { HomePage } from "./pages/HomePage";
import { PersonalPage } from "./pages/PersonalPage";
import { TurnosPage } from "./pages/TurnosPage";
import { CuentasPage } from "./pages/CuentasPage";
import { QrSitiosPage } from "./pages/QrSitiosPage";
import { MapaEnVivoPage } from "./pages/MapaEnVivoPage";
import { NotificacionesPage } from "./pages/NotificacionesPage";
import { NominaPage } from "./pages/NominaPage";
import { ComunicacionPage } from "./pages/ComunicacionPage";
import { ConfiguracionPage } from "./pages/ConfiguracionPage";
import { ReportesPage } from "./pages/ReportesPage";
import { InformesEventoPage } from "./pages/InformesEventoPage";
import { LoadingScreen } from "./components/FeedbackStates";
import { AyudaPage } from "./pages/AyudaPage";
import { ClientesPage } from "./pages/ClientesPage";
import { FacturacionPage } from "./pages/FacturacionPage";
import { InventarioPage } from "./pages/InventarioPage";
import { IntegracionesPage } from "./pages/IntegracionesPage";
import { SupervisionPage } from "./pages/SupervisionPage";
import { ActivarCuentaPage } from "./pages/ActivarCuentaPage";
import { UnirseEmpresaPage } from "./pages/UnirseEmpresaPage";
import { CompletarPerfilPage } from "./pages/CompletarPerfilPage";
import { ConfigurarDesdeMovilPage } from "./pages/ConfigurarDesdeMovilPage";
import { DescargasPage } from "./pages/DescargasPage";
import { OperacionEventoPage } from "./pages/OperacionEventoPage";
import { PendientesPage } from "./pages/PendientesPage";
import { MasterRoutes } from "./routes/MasterRoutes";
import { WorkerRoutes } from "./routes/WorkerRoutes";

function AdminProtected({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen label="Verificando sesión…" />;
  if (!user) return <Navigate to="/login" replace />;
  return <PlatformGate platform="admin">{children}</PlatformGate>;
}

function WorkerOnboardingGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen label="Verificando sesión…" />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.perfilCompleto === true) {
    return <Navigate to={rutaHomePorRol(user.role)} replace />;
  }
  return <>{children}</>;
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/descargas" element={<DescargasPage />} />
      <Route path="/configurar" element={<ConfigurarDesdeMovilPage />} />
      <Route path="/ayuda" element={<AyudaPage platform="admin" />} />
      <Route path="/unirse" element={<UnirseEmpresaPage />} />
      <Route path="/activar/:token" element={<ActivarCuentaPage />} />
      <Route
        path="/completar-perfil"
        element={
          <WorkerOnboardingGate>
            <CompletarPerfilPage />
          </WorkerOnboardingGate>
        }
      />

      <Route path="/master/*" element={<MasterRoutes />} />
      <Route path="/worker/*" element={<WorkerRoutes />} />
      <Route path="/marcar-entrada" element={<Navigate to="/worker/entrada" replace />} />

      <Route path="/" element={<RoleHomeRedirect />} />
      <Route
        element={
          <AdminProtected>
            <AppLayout />
          </AdminProtected>
        }
      >
        <Route path="panel" element={<HomePage />} />
        <Route path="clientes" element={<ClientesPage />} />
        <Route path="facturacion" element={<FacturacionPage />} />
        <Route path="inventario" element={<InventarioPage />} />
        <Route path="integraciones" element={<IntegracionesPage />} />
        <Route path="supervision" element={<SupervisionPage />} />
        <Route path="comunicacion" element={<ComunicacionPage />} />
        <Route path="personal" element={<PersonalPage />} />
        <Route path="turnos" element={<TurnosPage />} />
        <Route path="cuentas" element={<CuentasPage />} />
        <Route path="qr-sitios" element={<QrSitiosPage />} />
        <Route path="mapa" element={<MapaEnVivoPage />} />
        <Route path="informes" element={<InformesEventoPage />} />
        <Route path="reportes" element={<ReportesPage />} />
        <Route path="notificaciones" element={<NotificacionesPage />} />
        <Route path="nomina" element={<NominaPage />} />
        <Route path="configuracion" element={<ConfiguracionPage />} />
        <Route path="operacion" element={<OperacionEventoPage />} />
        <Route path="pendientes" element={<PendientesPage />} />
        <Route path="ayuda" element={<AyudaPage platform="admin" />} />
      </Route>

      <Route path="*" element={<RoleHomeRedirect />} />
    </Routes>
  );
}
