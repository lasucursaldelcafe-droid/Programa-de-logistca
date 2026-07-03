import { Navigate, useNavigate } from "react-router-dom";
import {
  PLATFORM_LABEL,
  ROLE_LABEL,
  puedeAccederPlataforma,
  type AppPlatform,
} from "@spe/shared";
import { useAuth } from "../contexts/AuthContext";
import { Card } from "./ui";

const PLATFORM_URLS: Record<AppPlatform, string> = {
  master: "http://localhost:5175",
  admin: "http://localhost:5173",
  worker: "http://localhost:5174",
};

export function PlatformGate({
  platform,
  children,
}: {
  platform: AppPlatform;
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-neutral-400">
        Cargando…
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (!puedeAccederPlataforma(user.role, platform)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg px-4">
        <Card className="w-full max-w-md text-center">
          <h1 className="font-display text-xl font-bold">Plataforma incorrecta</h1>
          <p className="mt-2 text-sm text-neutral-400">
            {ROLE_LABEL[user.role]} no puede acceder a{" "}
            <strong className="text-white">{PLATFORM_LABEL[platform]}</strong>.
          </p>
          <p className="mt-3 text-xs text-neutral-500">
            Master → puerto 5175 · Admin → 5173 · Trabajador → 5174
          </p>
          <div className="mt-4 flex flex-col gap-2">
            <button
              type="button"
              onClick={async () => {
                await logout();
                navigate("/login");
              }}
              className="rounded-lg border border-border px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800"
            >
              Cerrar sesión
            </button>
            {import.meta.env.DEV && (
              <a
                href={PLATFORM_URLS[platform === "admin" ? "master" : platform === "worker" ? "admin" : "admin"]}
                className="text-xs text-accent hover:underline"
              >
                Ir a otra plataforma (dev)
              </a>
            )}
          </div>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
