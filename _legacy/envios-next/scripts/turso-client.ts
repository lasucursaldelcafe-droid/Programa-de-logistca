/**
 * Cliente Turso Platform API — crea BD y tokens sin CLI interactivo.
 * Patrón alineado con empresario-virtual/scripts/turso_client.py
 */

const TURSO_PLATFORM_API = "https://api.turso.tech/v1";

export class TursoApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly detail: string,
  ) {
    super(`Turso API ${status}: ${detail.slice(0, 300)}`);
    this.name = "TursoApiError";
  }
}

async function tursoRequest(
  method: string,
  path: string,
  platformToken: string,
  body?: Record<string, unknown>,
  query = "",
): Promise<Record<string, unknown>> {
  const res = await fetch(`${TURSO_PLATFORM_API}${path}${query}`, {
    method,
    headers: {
      Authorization: `Bearer ${platformToken}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const raw = await res.text();
  if (!res.ok) {
    throw new TursoApiError(res.status, raw);
  }
  return raw.trim() ? (JSON.parse(raw) as Record<string, unknown>) : {};
}

function hostnameToLibsqlUrl(hostname: string): string {
  const host = hostname.trim().replace(/^libsql:\/\//, "");
  return `libsql://${host}`;
}

export async function listOrganizations(
  platformToken: string,
): Promise<Array<Record<string, unknown>>> {
  const payload = await tursoRequest("GET", "/organizations", platformToken);
  const orgs = payload.organizations;
  return Array.isArray(orgs) ? (orgs as Array<Record<string, unknown>>) : [];
}

export async function getDatabase(
  orgSlug: string,
  dbName: string,
  platformToken: string,
): Promise<Record<string, unknown>> {
  const payload = await tursoRequest(
    "GET",
    `/organizations/${orgSlug}/databases/${dbName}`,
    platformToken,
  );
  const db = payload.database ?? payload;
  if (!db || typeof db !== "object") {
    throw new TursoApiError(500, `Respuesta inesperada: ${JSON.stringify(payload)}`);
  }
  return db as Record<string, unknown>;
}

export async function createDatabase(
  orgSlug: string,
  dbName: string,
  platformToken: string,
  group = "default",
): Promise<Record<string, unknown>> {
  const payload = await tursoRequest(
    "POST",
    `/organizations/${orgSlug}/databases`,
    platformToken,
    { name: dbName, group },
  );
  const db = payload.database ?? payload;
  if (!db || typeof db !== "object") {
    throw new TursoApiError(
      500,
      `Respuesta inesperada al crear BD: ${JSON.stringify(payload)}`,
    );
  }
  return db as Record<string, unknown>;
}

export async function ensureDatabase(
  orgSlug: string,
  dbName: string,
  platformToken: string,
  createIfMissing = true,
): Promise<Record<string, unknown>> {
  try {
    return await getDatabase(orgSlug, dbName, platformToken);
  } catch (err) {
    if (
      err instanceof TursoApiError &&
      err.status === 404 &&
      createIfMissing
    ) {
      return await createDatabase(orgSlug, dbName, platformToken);
    }
    throw err;
  }
}

export function databaseLibsqlUrl(db: Record<string, unknown>): string {
  const hostname =
    (db.Hostname as string | undefined) ??
    (db.hostname as string | undefined) ??
    (db.url as string | undefined) ??
    "";
  if (hostname.trim()) {
    return hostnameToLibsqlUrl(hostname);
  }
  throw new TursoApiError(
    500,
    `No se encontró hostname en la BD. Respuesta: ${JSON.stringify(db)}`,
  );
}

export async function createDbAuthToken(
  orgSlug: string,
  dbName: string,
  platformToken: string,
): Promise<string> {
  const payload = await tursoRequest(
    "POST",
    `/organizations/${orgSlug}/databases/${dbName}/auth/tokens`,
    platformToken,
    {},
    "?expiration=never&authorization=full-access",
  );
  const jwt = String(payload.jwt ?? "").trim();
  if (!jwt) {
    throw new TursoApiError(500, `Token vacío: ${JSON.stringify(payload)}`);
  }
  return jwt;
}

export async function fetchTursoCredentials(options: {
  platformToken: string;
  orgSlug: string;
  dbName: string;
  createIfMissing?: boolean;
}): Promise<Record<string, string>> {
  const db = await ensureDatabase(
    options.orgSlug,
    options.dbName,
    options.platformToken,
    options.createIfMissing ?? true,
  );
  const url = databaseLibsqlUrl(db);
  const authToken = await createDbAuthToken(
    options.orgSlug,
    options.dbName,
    options.platformToken,
  );
  return {
    TURSO_DATABASE_URL: url,
    TURSO_AUTH_TOKEN: authToken,
    TURSO_ORG: options.orgSlug,
    TURSO_PLATFORM_TOKEN: options.platformToken,
  };
}

export function resolvePlatformToken(env: Record<string, string>): string | null {
  for (const key of ["TURSO_PLATFORM_TOKEN", "TURSO_API_TOKEN"]) {
    const fromEnv = process.env[key]?.trim();
    if (fromEnv) return fromEnv;
    const fromFile = env[key]?.trim();
    if (fromFile) return fromFile;
  }
  return null;
}

export async function resolveOrgSlug(
  env: Record<string, string>,
  platformToken: string,
  fallback = "empresario-virtual",
): Promise<string> {
  const fromEnv =
    env.TURSO_ORG?.trim() || process.env.TURSO_ORG?.trim() || "";
  if (fromEnv) return fromEnv;

  const orgs = await listOrganizations(platformToken);
  if (orgs.length === 1) {
    const slug = String(orgs[0].slug ?? orgs[0].Slug ?? "");
    if (slug) return slug;
  }
  return fallback;
}
