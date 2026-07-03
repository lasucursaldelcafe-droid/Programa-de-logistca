"use client";

import { useEffect, useRef, useState } from "react";
import {
  decodificarJwt,
  resolverGoogleClientId,
  type SesionUsuario,
} from "@/lib/auth";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (resp: { credential: string }) => void;
          }) => void;
          renderButton: (
            el: HTMLElement,
            options: Record<string, string>,
          ) => void;
        };
      };
    };
  }
}

interface LoginScreenProps {
  onLogin: (sesion: SesionUsuario) => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const googleRef = useRef<HTMLDivElement>(null);
  const clientId = resolverGoogleClientId();

  useEffect(() => {
    if (!clientId || !googleRef.current) return;

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (!window.google?.accounts?.id || !googleRef.current) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (resp) => {
          try {
            const info = decodificarJwt(resp.credential);
            onLogin({
              nombre: info.name || info.email || "Usuario Google",
              email: info.email || "",
              proveedor: "google",
            });
          } catch {
            setError("No se pudo procesar el inicio de sesión de Google.");
          }
        },
      });
      window.google.accounts.id.renderButton(googleRef.current, {
        theme: "outline",
        size: "large",
        text: "signin_with",
        locale: "es",
      });
    };
    document.head.appendChild(script);
    return () => {
      script.remove();
    };
  }, [clientId, onLogin]);

  function loginLocal(e: React.FormEvent) {
    e.preventDefault();
    const n = nombre.trim();
    if (!n) {
      setError("El nombre de usuario es obligatorio.");
      return;
    }
    setError(null);
    onLogin({ nombre: n, email: email.trim(), proveedor: "local" });
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-16">
      <div className="rounded-xl border border-black/10 p-8">
        <h1 className="text-2xl font-bold tracking-tight">Iniciar sesión</h1>
        <p className="mt-2 text-sm opacity-70">
          Accede para gestionar los envíos de logística.
        </p>

        <form onSubmit={loginLocal} className="mt-6 space-y-4">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">Usuario</span>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="rounded-lg border border-black/15 px-3 py-2 outline-none focus:border-black/40"
              placeholder="Tu nombre"
              autoComplete="username"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">Correo (opcional)</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-lg border border-black/15 px-3 py-2 outline-none focus:border-black/40"
              placeholder="correo@ejemplo.com"
              autoComplete="email"
            />
          </label>
          {error && (
            <p className="rounded-lg bg-red-100 px-3 py-2 text-sm text-red-800">
              {error}
            </p>
          )}
          <button
            type="submit"
            className="w-full rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 dark:bg-white dark:text-black"
          >
            Entrar
          </button>
        </form>

        {clientId && (
          <div className="mt-6 border-t border-black/10 pt-6">
            <p className="mb-3 text-center text-xs opacity-60">o continúa con</p>
            <div ref={googleRef} className="flex justify-center" />
          </div>
        )}
      </div>
    </main>
  );
}
