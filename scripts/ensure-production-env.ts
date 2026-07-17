/**
 * Falla el build si VITE_DEMO_MODE=false y faltan credenciales Firebase de producción.
 * Con --pages solo advierte: permite publicar la UI en GitHub Pages mientras se configuran Secrets.
 */
const PAGES_MODE =
  process.argv.includes("--pages") || process.env.PAGES_DEPLOY_ALLOW_MISSING_FIREBASE === "true";
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
    const detail = [
      missing.length > 0 ? `faltantes: ${missing.join(", ")}` : "",
      placeholder.length > 0 ? `de prueba: ${placeholder.join(", ")}` : "",
    ]
      .filter(Boolean)
      .join("; ");

    if (PAGES_MODE) {
      console.warn("⚠ GitHub Pages: Firebase sin configurar — el workflow usará VITE_DEMO_MODE=true.");
      console.warn(`  (${detail})`);
      console.warn("  Login demo en el navegador hasta configurar Secrets; ver docs-source/PRODUCCION-FIREBASE.md");
      return;
    }

    console.error("✗ Producción requiere credenciales Firebase reales (VITE_DEMO_MODE=false).");
    console.error(`  ${detail}`);
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
