import { isNativePlatform } from "./platform";

const BIOMETRIC_SERVER = "spe-eventos-auth";
const PREF_BIOMETRIC_ENABLED = "spe-biometric-enabled";

type NativeBiometricModule = {
  isAvailable: () => Promise<{ isAvailable: boolean; biometryType?: string }>;
  verifyIdentity: (opts: {
    reason: string;
    title?: string;
    subtitle?: string;
  }) => Promise<void>;
  setCredentials: (opts: {
    username: string;
    password: string;
    server: string;
  }) => Promise<void>;
  getCredentials: (opts: { server: string }) => Promise<{ username: string; password: string }>;
  deleteCredentials: (opts: { server: string }) => Promise<void>;
};

async function loadNativeBiometric(): Promise<NativeBiometricModule | null> {
  if (!isNativePlatform()) return null;
  try {
    const mod = await import("@capgo/capacitor-native-biometric");
    return mod.NativeBiometric as unknown as NativeBiometricModule;
  } catch {
    return null;
  }
}

export async function isBiometricAvailable(): Promise<boolean> {
  const native = await loadNativeBiometric();
  if (native) {
    try {
      const r = await native.isAvailable();
      return r.isAvailable;
    } catch {
      return false;
    }
  }
  return typeof window !== "undefined" && "PublicKeyCredential" in window;
}

export async function isBiometricEnabled(): Promise<boolean> {
  try {
    const { Preferences } = await import("@capacitor/preferences");
    const { value } = await Preferences.get({ key: PREF_BIOMETRIC_ENABLED });
    return value === "1";
  } catch {
    return localStorage.getItem(PREF_BIOMETRIC_ENABLED) === "1";
  }
}

export async function setBiometricEnabled(enabled: boolean): Promise<void> {
  const val = enabled ? "1" : "0";
  try {
    const { Preferences } = await import("@capacitor/preferences");
    await Preferences.set({ key: PREF_BIOMETRIC_ENABLED, value: val });
  } catch {
    localStorage.setItem(PREF_BIOMETRIC_ENABLED, val);
  }
  if (!enabled) {
    await clearBiometricCredentials();
  }
}

export async function saveBiometricCredentials(
  email: string,
  password: string,
): Promise<void> {
  const native = await loadNativeBiometric();
  if (!native) return;
  await native.setCredentials({
    username: email,
    password,
    server: BIOMETRIC_SERVER,
  });
  await setBiometricEnabled(true);
}

export async function clearBiometricCredentials(): Promise<void> {
  const native = await loadNativeBiometric();
  if (!native) return;
  try {
    await native.deleteCredentials({ server: BIOMETRIC_SERVER });
  } catch {
    // sin credenciales guardadas
  }
}

export async function loginWithBiometric(): Promise<{
  email: string;
  password: string;
} | null> {
  const native = await loadNativeBiometric();
  if (!native) return null;
  const enabled = await isBiometricEnabled();
  if (!enabled) return null;

  await native.verifyIdentity({
    reason: "Confirma tu identidad para entrar a SPE",
    title: "Ingreso rápido",
    subtitle: "Huella o reconocimiento facial",
  });

  const cred = await native.getCredentials({ server: BIOMETRIC_SERVER });
  return { email: cred.username, password: cred.password };
}
