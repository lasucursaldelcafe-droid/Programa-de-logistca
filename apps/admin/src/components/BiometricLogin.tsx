import { useEffect, useState } from "react";
import {
  isBiometricAvailable,
  isBiometricEnabled,
  loginWithBiometric,
  saveBiometricCredentials,
} from "../lib/biometricAuth";

interface BiometricLoginProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onError: (message: string) => void;
  onSuccessLogin?: (email: string, password: string) => void;
}

export function BiometricLoginButton({
  onLogin,
  onError,
  onSuccessLogin,
}: BiometricLoginProps) {
  const [available, setAvailable] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void (async () => {
      setAvailable(await isBiometricAvailable());
      setEnabled(await isBiometricEnabled());
    })();
  }, []);

  if (!available || !enabled) return null;

  async function handleBiometric() {
    setBusy(true);
    try {
      const cred = await loginWithBiometric();
      if (!cred) {
        onError("No hay credenciales guardadas para biometría.");
        return;
      }
      await onLogin(cred.email, cred.password);
      onSuccessLogin?.(cred.email, cred.password);
    } catch (err) {
      onError(err instanceof Error ? err.message : "No se pudo verificar biometría.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={handleBiometric}
      className="min-h-11 w-full rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-neutral-200 hover:border-accent disabled:opacity-40"
    >
      {busy ? "Verificando…" : "Ingresar con huella o rostro"}
    </button>
  );
}

interface BiometricOptInProps {
  email: string;
  password: string;
}

export function BiometricOptIn({ email, password }: BiometricOptInProps) {
  const [available, setAvailable] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    void isBiometricAvailable().then(setAvailable);
  }, []);

  if (!available) return null;

  async function enable() {
    try {
      await saveBiometricCredentials(email, password);
      setSaved(true);
    } catch {
      setSaved(false);
    }
  }

  if (saved) {
    return (
      <p className="text-xs text-positive">Biometría activada para próximos ingresos.</p>
    );
  }

  return (
    <button
      type="button"
      onClick={enable}
      className="w-full text-sm text-accent hover:underline"
    >
      Activar ingreso con huella o rostro
    </button>
  );
}
