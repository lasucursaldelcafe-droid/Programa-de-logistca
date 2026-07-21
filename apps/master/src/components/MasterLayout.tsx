import { useAuth } from "@core/contexts/AuthContext";
import { AppShell } from "@core/components/nav/AppShell";
import { getMasterNavSections } from "@core/config/navigation";
import { esRolMaster, normalizeUserRole } from "@spe/shared";

export function MasterLayout() {
  const { user, logout } = useAuth();

  if (!user) return null;

  const isCeo = normalizeUserRole(user.role) === "ceo" || esRolMaster(user.role);

  return (
    <AppShell
      user={user}
      brand={isCeo ? "Dirección SPE" : "Master Console"}
      brandSub="Todas las opciones en una sola consola"
      sections={getMasterNavSections()}
      onLogout={logout}
    />
  );
}
