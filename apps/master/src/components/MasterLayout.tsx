import { useAuth } from "@core/contexts/AuthContext";
import { AppShell } from "@core/components/nav/AppShell";
import { getMasterNavSections } from "@core/config/navigation";

export function MasterLayout() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <AppShell
      user={user}
      brand="Master Console"
      brandSub="Plataforma SPE"
      sections={getMasterNavSections()}
      onLogout={logout}
    />
  );
}
