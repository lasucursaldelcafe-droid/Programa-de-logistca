import { execSync } from "node:child_process";
import {
  fetchTursoCredentials,
  resolveOrgSlug,
  resolvePlatformToken,
  TursoApiError,
} from "./turso-client";
import { ENV_LOCAL, parseEnvFile, writeEnvUpdates } from "./env-file";

const DEFAULT_DB_NAME = "programa-de-logistica";

function log(msg: string, level: "info" | "ok" | "warn" | "err" = "info"): void {
  const prefix = { info: ">", ok: "+", warn: "!", err: "x" }[level];
  console.log(`${prefix} ${msg}`);
}

async function main(): Promise<void> {
  const env = parseEnvFile(ENV_LOCAL);
  const platformToken = resolvePlatformToken(env);

  if (!platformToken) {
    log("Sin TURSO_PLATFORM_TOKEN — se mantiene SQLite local (file:./data/logistica.db)", "warn");
    log("Añade TURSO_PLATFORM_TOKEN a .env.local y vuelve a ejecutar npm run setup:turso", "info");
    return;
  }

  const orgSlug = await resolveOrgSlug(env, platformToken);
  const dbName = process.env.TURSO_DB_NAME?.trim() || DEFAULT_DB_NAME;

  log(`Turso org=${orgSlug} db=${dbName}`);

  try {
    const creds = await fetchTursoCredentials({
      platformToken,
      orgSlug,
      dbName,
      createIfMissing: true,
    });
    writeEnvUpdates(creds);
    log(`Credenciales Turso guardadas en .env.local`, "ok");
    log(`URL: ${creds.TURSO_DATABASE_URL}`);

    log("Inicializando esquema en Turso...");
    execSync("npm run db:init", {
      stdio: "inherit",
      env: { ...process.env, ...creds },
    });
    log("Esquema Turso listo", "ok");
  } catch (err) {
    if (err instanceof TursoApiError) {
      log(err.message, "err");
      process.exit(1);
    }
    throw err;
  }
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
