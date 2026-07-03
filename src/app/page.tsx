"use client";

import { useCallback, useEffect, useState } from "react";
import type { Envio, EstadoEnvio } from "@/db/schema";
import { LoginScreen } from "@/components/login-screen";
import {
  cerrarSesion,
  guardarSesion,
  leerSesion,
  type SesionUsuario,
} from "@/lib/auth";

const ETIQUETA_ESTADO: Record<EstadoEnvio, string> = {
  pendiente: "Pendiente",
  en_transito: "En tránsito",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

const COLOR_ESTADO: Record<EstadoEnvio, string> = {
  pendiente: "bg-amber-100 text-amber-800",
  en_transito: "bg-blue-100 text-blue-800",
  entregado: "bg-green-100 text-green-800",
  cancelado: "bg-red-100 text-red-800",
};

const SIGUIENTES: Record<EstadoEnvio, EstadoEnvio[]> = {
  pendiente: ["en_transito", "cancelado"],
  en_transito: ["entregado", "cancelado"],
  entregado: [],
  cancelado: [],
};

export default function Home() {
  const [sesion, setSesion] = useState<SesionUsuario | null>(null);
  const [sesionLista, setSesionLista] = useState(false);
  const [envios, setEnvios] = useState<Envio[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [form, setForm] = useState({
    origen: "",
    destino: "",
    destinatario: "",
    pesoKg: "",
  });

  useEffect(() => {
    let activo = true;
    (async () => {
      const guardada = leerSesion();
      if (activo) {
        setSesion(guardada);
        setSesionLista(true);
      }
    })();
    return () => {
      activo = false;
    };
  }, []);

  const cargar = useCallback(async () => {
    try {
      const res = await fetch("/api/envios");
      const data = await res.json();
      setEnvios(data.envios ?? []);
    } catch {
      setError("No se pudieron cargar los envíos.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    if (!sesion) return;
    let activo = true;
    (async () => {
      try {
        const res = await fetch("/api/envios");
        const data = await res.json();
        if (activo) setEnvios(data.envios ?? []);
      } catch {
        if (activo) setError("No se pudieron cargar los envíos.");
      } finally {
        if (activo) setCargando(false);
      }
    })();
    return () => {
      activo = false;
    };
  }, [sesion]);

  function handleLogin(nueva: SesionUsuario) {
    guardarSesion(nueva);
    setSesion(nueva);
    setCargando(true);
  }

  function handleLogout() {
    cerrarSesion();
    setSesion(null);
    setEnvios([]);
    setCargando(true);
  }

  async function crearEnvio(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      const res = await fetch("/api/envios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, pesoKg: Number(form.pesoKg || 0) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          data.detalles?.join(" ") ?? data.error ?? "Error al crear el envío.",
        );
        return;
      }
      setForm({ origen: "", destino: "", destinatario: "", pesoKg: "" });
      await cargar();
    } catch {
      setError("Error de red al crear el envío.");
    } finally {
      setEnviando(false);
    }
  }

  async function cambiarEstado(id: number, estado: EstadoEnvio) {
    setError(null);
    const res = await fetch(`/api/envios/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "No se pudo actualizar el estado.");
      return;
    }
    await cargar();
  }

  if (!sesionLista) {
    return (
      <main className="mx-auto flex min-h-screen items-center justify-center px-6">
        <p className="text-sm opacity-70">Cargando…</p>
      </main>
    );
  }

  if (!sesion) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  const total = envios.length;
  const enTransito = envios.filter((e) => e.estado === "en_transito").length;
  const entregados = envios.filter((e) => e.estado === "entregado").length;

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Programa de Logística
          </h1>
          <p className="mt-1 text-sm opacity-70">
            Registra envíos y actualiza su estado de entrega.
          </p>
        </div>
        <div className="text-right text-sm">
          <div className="font-medium">{sesion.nombre}</div>
          {sesion.email && (
            <div className="text-xs opacity-60">{sesion.email}</div>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="mt-2 text-xs underline opacity-70 hover:opacity-100"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <section className="mb-8 grid grid-cols-3 gap-4">
        <Metrica etiqueta="Total" valor={total} />
        <Metrica etiqueta="En tránsito" valor={enTransito} />
        <Metrica etiqueta="Entregados" valor={entregados} />
      </section>

      <section className="mb-10 rounded-xl border border-black/10 p-6">
        <h2 className="mb-4 text-lg font-semibold">Nuevo envío</h2>
        <form
          onSubmit={crearEnvio}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        >
          <Campo
            label="Origen"
            value={form.origen}
            onChange={(v) => setForm((f) => ({ ...f, origen: v }))}
            placeholder="Bogotá"
          />
          <Campo
            label="Destino"
            value={form.destino}
            onChange={(v) => setForm((f) => ({ ...f, destino: v }))}
            placeholder="Medellín"
          />
          <Campo
            label="Destinatario"
            value={form.destinatario}
            onChange={(v) => setForm((f) => ({ ...f, destinatario: v }))}
            placeholder="Ana Gómez"
          />
          <Campo
            label="Peso (kg)"
            type="number"
            value={form.pesoKg}
            onChange={(v) => setForm((f) => ({ ...f, pesoKg: v }))}
            placeholder="3"
          />
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={enviando}
              className="rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50 dark:bg-white dark:text-black"
            >
              {enviando ? "Creando…" : "Crear envío"}
            </button>
          </div>
        </form>
        {error && (
          <p className="mt-4 rounded-lg bg-red-100 px-4 py-2 text-sm text-red-800">
            {error}
          </p>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Envíos registrados</h2>
        {cargando ? (
          <p className="text-sm opacity-70">Cargando…</p>
        ) : envios.length === 0 ? (
          <p className="text-sm opacity-70">
            Aún no hay envíos. Crea el primero arriba.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-black/10">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-black/10 bg-black/5">
                <tr>
                  <Th>Código</Th>
                  <Th>Ruta</Th>
                  <Th>Destinatario</Th>
                  <Th>Peso</Th>
                  <Th>Estado</Th>
                  <Th>Acciones</Th>
                </tr>
              </thead>
              <tbody>
                {envios.map((e) => (
                  <tr key={e.id} className="border-b border-black/5">
                    <td className="px-4 py-3 font-mono text-xs">{e.codigo}</td>
                    <td className="px-4 py-3">
                      {e.origen} → {e.destino}
                    </td>
                    <td className="px-4 py-3">{e.destinatario}</td>
                    <td className="px-4 py-3">{e.pesoKg} kg</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${COLOR_ESTADO[e.estado]}`}
                      >
                        {ETIQUETA_ESTADO[e.estado]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {SIGUIENTES[e.estado].map((s) => (
                          <button
                            key={s}
                            onClick={() => cambiarEstado(e.id, s)}
                            className="rounded-md border border-black/15 px-2.5 py-1 text-xs transition hover:bg-black/5"
                          >
                            {ETIQUETA_ESTADO[s]}
                          </button>
                        ))}
                        {SIGUIENTES[e.estado].length === 0 && (
                          <span className="text-xs opacity-40">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

function Metrica({ etiqueta, valor }: { etiqueta: string; valor: number }) {
  return (
    <div className="rounded-xl border border-black/10 p-4">
      <div className="text-2xl font-bold">{valor}</div>
      <div className="text-xs opacity-60">{etiqueta}</div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 font-medium">{children}</th>;
}

function Campo({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="rounded-lg border border-black/15 px-3 py-2 outline-none focus:border-black/40"
      />
    </label>
  );
}
