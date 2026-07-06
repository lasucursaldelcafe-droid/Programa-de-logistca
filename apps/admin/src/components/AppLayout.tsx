import { useAuth } from "../contexts/AuthContext";
import { AppShell } from "./nav/AppShell";
import { getAdminNavSections } from "../config/navigation";

export function AppLayout() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <AppShell
      user={user}
      brand="Admin Console"
      brandSub="Operación y equipo"
      sections={getAdminNavSections(user.role)}
      onLogout={logout}
    />
  );
}
