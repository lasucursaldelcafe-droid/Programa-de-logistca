/**
 * Falla el build si VITE_DEMO_MODE=false y faltan credenciales Firebase de producción.
 */
const DEMO_MODE = process.env.VITE_DEMO_MODE === "true";

const REQUIRED = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_STORAGE_BUCKET",
  "VITE_FIREBASE_MESSAGING_SENDER_ID",
  "VITE_FIREBASE_APP_ID",
] as const;

const PLACEHOLDER_VALUES = new Set([
  "",
  "demo-api-key",
  "demo-personal-eventos",
  "000000000000",
  "1:000000000000:web:demo",
]);

function main(): void {
  if (DEMO_MODE) {
    console.log("○ Build en modo demo — sin validación Firebase");
    return;
  }

  const missing: string[] = [];
  const placeholder: string[] = [];

  for (const key of REQUIRED) {
    const value = process.env[key]?.trim() ?? "";
    if (!value) missing.push(key);
    else if (PLACEHOLDER_VALUES.has(value)) placeholder.push(key);
  }

  if (missing.length > 0 || placeholder.length > 0) {
    console.error("✗ Producción requiere credenciales Firebase reales (VITE_DEMO_MODE=false).");
    if (missing.length > 0) {
      console.error("  Variables faltantes:", missing.join(", "));
    }
    if (placeholder.length > 0) {
      console.error("  Variables con valor de prueba:", placeholder.join(", "));
    }
    console.error(
      "\nConfigura GitHub Secrets o apps/admin/.env.production con los valores de Firebase Console.",
    );
    process.exit(1);
  }

  if (process.env.VITE_USE_FIREBASE_EMULATORS === "true") {
    console.error("✗ En producción VITE_USE_FIREBASE_EMULATORS debe ser false.");
    process.exit(1);
  }

  console.log("✓ Entorno de producción Firebase validado");
}

main();
