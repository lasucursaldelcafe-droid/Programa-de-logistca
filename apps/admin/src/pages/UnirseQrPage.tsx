import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { parseQrPayload, workerDocumentPassword } from "@spe/shared";
import { AuthShell, authButtonClass, authInputClass } from "../components/AuthShell";
import { ScanQrButton } from "../components/ScanQrButton";
import { useAuth } from "../contexts/AuthContext";
import {
  onboardFromSiteQr,
  resolveSiteQrPreview,
  toUserFacingError,
  type SiteQrPreview,
} from "../hooks/useDataStore";
import { scannedQrToJoinPath } from "../lib/qrScanner";

export function UnirseQrPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user, login } = useAuth();
  const [preview, setPreview] = useState<SiteQrPreview | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(true);
  const [form, setForm] = useState({
    nombre: "",
    documento: "",
    email: "",
    telefono: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const qrId = params.get("qr")?.trim() ?? "";
  const token = params.get("t")?.trim() ?? "";
  const rawFallback = params.get("raw")?.trim() ?? "";

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoadingPreview(true);
      setPreviewError(null);
      try {
        let id = qrId;
        let t = token;
        if ((!id || !t) && rawFallback) {
          const parsed = parseQrPayload(rawFallback);
          if (parsed) {
            id = parsed.qrId;
            t = parsed.token;
          }
        }
        if (!id || !t) {
          throw new Error(
            "QR incompleto. Escanea el código del sitio o abre el enlace completo.",
          );
        }
        const data = await resolveSiteQrPreview(id, t);
        if (!cancelled) setPreview(data);
      } catch (err) {
        if (!cancelled) {
          setPreviewError(
            toUserFacingError(err, "No se pudo leer el QR del sitio.").message,
          );
        }
      } finally {
        if (!cancelled) setLoadingPreview(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [qrId, token, rawFallback]);

  useEffect(() => {
    // Si ya tiene sesión de trabajador, ir a marcar entrada con este QR.
    if (!user || !preview) return;
    if (user.role === "trabajador") {
      const payload = `spe:qr:${preview.qrId}:${token || params.get("t") || ""}`;
      navigate(`/worker/entrada?qr=${encodeURIComponent(payload)}`, { replace: true });
    } else if (user.role === "supervisor_sitio") {
      navigate("/comunicacion", { replace: true });
    }
  }, [user, preview, navigate, token, params]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!preview) return;
    setSubmitting(true);
    setError(null);
    try {
      const qrToken = token || params.get("t") || "";
      const result = await onboardFromSiteQr({
        qrId: preview.qrId,
        token: qrToken,
        nombre: form.nombre,
        documento: form.documento,
        email: form.email,
        telefono: form.telefono,
      });
      await login(result.email, workerDocumentPassword(form.documento));
      navigate("/completar-perfil", { replace: true });
    } catch (err) {
      setError(toUserFacingError(err, "No se pudo completar el registro.").message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingPreview) {
    return (
      <AuthShell title="Unirme por QR" subtitle="Validando código del sitio…">
        <p className="text-sm text-neutral-400">Un momento…</p>
      </AuthShell>
    );
  }

  if (previewError || !preview) {
    return (
      <AuthShell
        title="QR no válido"
        subtitle="No pudimos abrir el registro con este código."
        footer={
          <Link to="/login" className="text-accent hover:underline">
            Ir al login
          </Link>
        }
      >
        <p className="rounded-lg bg-alert/10 px-3 py-2 text-sm text-alert">
          {previewError ?? "Código QR no encontrado."}
        </p>
        <div className="mt-4">
          <ScanQrButton
            label="Escanear otro QR con la cámara"
            className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-black disabled:opacity-50"
            onScanned={(_normalized, raw) => {
              const path = scannedQrToJoinPath(raw);
              if (path) navigate(path, { replace: true });
            }}
          />
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Configura tu usuario"
      subtitle={`${preview.siteNombre} · ${preview.eventNombre}`}
      footer={
        <>
          ¿Ya tienes cuenta?{" "}
          <Link to="/login" className="text-accent hover:underline">
            Iniciar sesión
          </Link>
        </>
      }
    >
      <div className="mb-4 rounded-lg border border-accent/30 bg-accent/5 px-3 py-2 text-xs text-neutral-300">
        Al registrarte se habilita tu puesto en este sitio. Los administradores recibirán un aviso
        para configurar tus perfiles.
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block text-sm">
          <span className="mb-1 block text-neutral-300">Nombre completo *</span>
          <input
            value={form.nombre}
            onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
            className={authInputClass}
            required
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-neutral-300">Cédula / documento (será tu clave) *</span>
          <input
            value={form.documento}
            onChange={(e) => setForm((f) => ({ ...f, documento: e.target.value }))}
            className={authInputClass}
            inputMode="numeric"
            required
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-neutral-300">Correo (usuario de acceso) *</span>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className={authInputClass}
            required
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-neutral-300">Teléfono</span>
          <input
            value={form.telefono}
            onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
            className={authInputClass}
          />
        </label>
        {error && (
          <p className="rounded-lg bg-alert/10 px-3 py-2 text-sm text-alert">{error}</p>
        )}
        <button type="submit" disabled={submitting} className={authButtonClass}>
          {submitting ? "Creando cuenta…" : "Crear cuenta y habilitar puesto"}
        </button>
      </form>
      <p className="mt-3 text-xs text-neutral-500">
        Contraseña inicial = tu cédula (solo números, sin puntos). Luego podrás completar el perfil.
      </p>
    </AuthShell>
  );
}
