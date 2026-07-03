import { ROLE_LABEL } from "@spe/shared";
import { Card } from "@core/components/ui";
import { usePlatformUsers } from "@core/hooks/useDataStore";

export function AdminsPage() {
  const users = usePlatformUsers();
  const operativos = users.filter(
    (u) =>
      u.role === "administrador" ||
      u.role === "supervisor_sitio" ||
      u.role === "super_admin",
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold">Administradores</h1>
        <p className="mt-1 text-neutral-400">
          Cuentas con acceso a Admin Console o Master. Crear nuevas desde Firebase Auth o seed.
        </p>
      </div>
      <Card>
        <div className="space-y-3">
          {operativos.map((u) => (
            <div
              key={u.uid}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-bg px-4 py-3"
            >
              <div>
                <div className="font-medium">{u.nombre}</div>
                <div className="font-mono text-xs text-neutral-500">{u.email}</div>
              </div>
              <span className="rounded-full bg-neutral-800 px-3 py-1 text-xs">
                {ROLE_LABEL[u.role]}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
