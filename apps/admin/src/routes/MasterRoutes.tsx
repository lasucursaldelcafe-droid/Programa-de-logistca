import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { esRolMaster } from "@spe/shared";
import { LoadingScreen } from "../components/FeedbackStates";
import { useAuth } from "../contexts/AuthContext";
import { PlatformGate } from "../components/PlatformGate";
import { MasterLayout } from "@master/components/MasterLayout";
import { MasterHomePage } from "@master/pages/MasterHomePage";
import { AdminsPage } from "@master/pages/AdminsPage";
import { InformesPage } from "@master/pages/InformesPage";
import { AuditoriaPage } from "@master/pages/AuditoriaPage";
import { AyudaPage } from "../pages/AyudaPage";
import { RolesPage } from "@master/pages/RolesPage";
import { TrabajadoresActividadPage } from "@master/pages/TrabajadoresActividadPage";
import { ComunicacionPage } from "../pages/ComunicacionPage";
import { ConfiguracionPage } from "../pages/ConfiguracionPage";
import { PersonalPage } from "../pages/PersonalPage";
import { CuentasPage } from "../pages/CuentasPage";
import { OperacionEventoPage } from "../pages/OperacionEventoPage";
import { QrSitiosPage } from "../pages/QrSitiosPage";
import { ReportesPage } from "../pages/ReportesPage";
import { InformesEventoPage } from "../pages/InformesEventoPage";
import { NominaPage } from "../pages/NominaPage";
import { NegocioPage } from "../pages/NegocioPage";
import { HomePage } from "../pages/HomePage";
import { TurnosPage } from "../pages/TurnosPage";
import { NotificacionesPage } from "../pages/NotificacionesPage";
import { PendientesPage } from "../pages/PendientesPage";
import { IntegracionesPage } from "../pages/IntegracionesPage";
import { DescargasPage } from "../pages/DescargasPage";
import { SupervisionPage } from "../pages/SupervisionPage";

function MasterProtected({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return <LoadingScreen />;
  }
  if (!user) return <Navigate to="/login" replace />;
  return <PlatformGate platform="master">{children}</PlatformGate>;
}

/**
 * Si Dirección (CEO / Master App) abre una ruta de Admin Console,
 * redirige al equivalente bajo /master/* para no cambiar de perspectiva.
 */
export function RedirectMasterToUnifiedConsole({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingScreen label="Verificando sesión…" />;
  if (!user) return <Navigate to="/login" replace />;
  if (!esRolMaster(user.role)) return <>{children}</>;

  const path = location.pathname.replace(/\/$/, "") || "/";
  const map: Record<string, string> = {
    "/panel": "/master/panel",
    "/configuracion": "/master/configuracion",
    "/equipo-admin": "/master/administradores",
    "/personal": "/master/personal",
    "/cuentas": "/master/cuentas",
    "/operacion": "/master/operacion",
    "/qr-sitios": "/master/qr-sitios",
    "/reportes": "/master/reportes",
    "/informes": "/master/informes-evento",
    "/nomina": "/master/nomina",
    "/negocio": "/master/negocio",
    "/turnos": "/master/turnos",
    "/comunicacion": "/master/comunicacion",
    "/supervision": "/master/supervision",
    "/mapa": "/master/supervision",
    "/notificaciones": "/master/notificaciones",
    "/pendientes": "/master/pendientes",
    "/integraciones": "/master/integraciones",
    "/descargas": "/master/descargas",
    "/ayuda": "/master/ayuda",
  };

  const dest = map[path];
  if (dest) {
    return <Navigate to={`${dest}${location.search}${location.hash}`} replace />;
  }
  return <>{children}</>;
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
        <Route path="trabajadores" element={<TrabajadoresActividadPage />} />
        <Route path="comunicacion" element={<ComunicacionPage />} />
        <Route path="administradores" element={<AdminsPage />} />
        <Route path="roles" element={<RolesPage />} />
        <Route path="informes" element={<InformesPage />} />
        <Route path="auditoria" element={<AuditoriaPage />} />
        <Route path="ayuda" element={<AyudaPage platform="master" />} />

        {/* Operación empresa — misma consola, sin saltar a Admin */}
        <Route path="panel" element={<HomePage />} />
        <Route path="configuracion" element={<ConfiguracionPage />} />
        <Route path="personal" element={<PersonalPage />} />
        <Route path="cuentas" element={<CuentasPage />} />
        <Route path="operacion" element={<OperacionEventoPage />} />
        <Route path="qr-sitios" element={<QrSitiosPage />} />
        <Route path="reportes" element={<ReportesPage />} />
        <Route path="informes-evento" element={<InformesEventoPage />} />
        <Route path="nomina" element={<NominaPage />} />
        <Route path="negocio" element={<NegocioPage />} />
        <Route path="turnos" element={<TurnosPage />} />
        <Route path="supervision" element={<SupervisionPage />} />
        <Route path="notificaciones" element={<NotificacionesPage />} />
        <Route path="pendientes" element={<PendientesPage />} />
        <Route path="integraciones" element={<IntegracionesPage />} />
        <Route path="descargas" element={<DescargasPage />} />
      </Route>
    </Routes>
  );
}
