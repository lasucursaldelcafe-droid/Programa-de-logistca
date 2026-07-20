const ROLE_LABEL: Record<string, string> = {
  trabajador: "Trabajador",
  supervisor_sitio: "Supervisor de sitio",
};

const DEFAULT_APP_URL = "https://lasucursaldelcafe-droid.github.io/Programa-de-logistca/";

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
}

export function buildInvitationLinks(token: string, workerBaseUrl: string) {
  const base = normalizeBaseUrl(workerBaseUrl);
  return {
    webActivation: `${base}activar/${token}`,
    appActivation: `${base}#/activar/${token}`,
    webJoin: `${base}unirse`,
    appJoin: `${base}#/unirse`,
  };
}

export function buildInvitationEmail(invitation: {
  workerNombre: string;
  email: string;
  codigoAcceso: string;
  expiraEn: string;
  role?: string;
  token: string;
}, appUrl: string): { subject: string; text: string; html: string } {
  const links = buildInvitationLinks(invitation.token, appUrl);
  const rol = invitation.role ?? "trabajador";
  const expira = new Date(invitation.expiraEn).toLocaleDateString("es-CO", {
    dateStyle: "long",
  });

  const subject = "Invitación SPE — Activa tu cuenta de trabajador";
  const text = [
    `Hola ${invitation.workerNombre},`,
    "",
    `Fuiste invitado/a como ${ROLE_LABEL[rol] ?? rol} en el Sistema de Personal para Eventos (SPE).`,
    "",
    "══ CÓDIGO PERSONAL (un solo uso — no lo compartas) ══",
    invitation.codigoAcceso,
    "",
    "══ PASOS PARA ACTIVAR ══",
    `1. Abre: ${links.webJoin}`,
    "2. Ingresa tu correo y el código de arriba.",
    "3. Crea tu contraseña personal.",
    "4. Completa tu perfil si aplica a tu rol.",
    "",
    "Enlace directo de activación (web):",
    links.webActivation,
    "",
    "Enlace directo (App Android):",
    links.appActivation,
    "",
    `Correo registrado: ${invitation.email}`,
    `El código caduca el ${expira}.`,
    "",
    "Si el código ya fue usado o expiró, solicita una nueva invitación al administrador.",
    "",
    "— SPE Negocio",
  ].join("\n");

  const html = `
    <div style="font-family:Inter,Arial,sans-serif;max-width:560px;color:#1a1a1a">
      <h2 style="color:#f09040">Invitación SPE</h2>
      <p>Hola <strong>${escapeHtml(invitation.workerNombre)}</strong>,</p>
      <p>Fuiste invitado/a como <strong>${escapeHtml(ROLE_LABEL[rol] ?? rol)}</strong> en el Sistema de Personal para Eventos.</p>
      <p style="margin:24px 0 8px;font-size:13px;color:#666">Código personal (un solo uso)</p>
      <p style="font-size:28px;letter-spacing:6px;font-weight:700;background:#111;color:#f09040;padding:16px 20px;border-radius:8px;text-align:center">${escapeHtml(invitation.codigoAcceso)}</p>
      <ol style="line-height:1.6">
        <li>Abre <a href="${links.webJoin}">${links.webJoin}</a></li>
        <li>Ingresa tu correo: <strong>${escapeHtml(invitation.email)}</strong></li>
        <li>Ingresa el código de arriba</li>
        <li>Crea tu contraseña y completa tu perfil</li>
      </ol>
      <p><a href="${links.webActivation}" style="display:inline-block;background:#f09040;color:#000;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">Activar cuenta</a></p>
      <p style="font-size:12px;color:#666">El código caduca el ${escapeHtml(expira)}.</p>
    </div>
  `.trim();

  return { subject, text, html };
}

export function buildShiftAssignedEmail(
  shift: {
    workerNombre?: string;
    eventNombre?: string;
    siteNombre?: string;
    inicio: string;
    fin: string;
  },
  appUrl: string,
): { subject: string; text: string; html: string } {
  const base = normalizeBaseUrl(appUrl);
  const inicio = new Date(shift.inicio).toLocaleString("es-CO");
  const fin = new Date(shift.fin).toLocaleString("es-CO");
  const nombre = shift.workerNombre ?? "Equipo SPE";
  const evento = shift.eventNombre ?? "Evento";
  const sitio = shift.siteNombre ?? "Sitio";

  const subject = `Nuevo turno asignado — ${evento}`;
  const text = [
    `Hola ${nombre},`,
    "",
    "Te asignaron un turno en SPE:",
    "",
    `Evento: ${evento}`,
    `Sitio: ${sitio}`,
    `Inicio: ${inicio}`,
    `Fin: ${fin}`,
    "",
    "Entra a la app para aceptar o rechazar el turno:",
    `${base}worker/turnos`,
    "",
    "— SPE Negocio",
  ].join("\n");

  const html = `
    <div style="font-family:Inter,Arial,sans-serif;max-width:560px;color:#1a1a1a">
      <h2 style="color:#f09040">Nuevo turno asignado</h2>
      <p>Hola <strong>${escapeHtml(nombre)}</strong>,</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:8px 0;color:#666">Evento</td><td><strong>${escapeHtml(evento)}</strong></td></tr>
        <tr><td style="padding:8px 0;color:#666">Sitio</td><td><strong>${escapeHtml(sitio)}</strong></td></tr>
        <tr><td style="padding:8px 0;color:#666">Inicio</td><td>${escapeHtml(inicio)}</td></tr>
        <tr><td style="padding:8px 0;color:#666">Fin</td><td>${escapeHtml(fin)}</td></tr>
      </table>
      <p><a href="${base}worker/turnos" style="display:inline-block;background:#f09040;color:#000;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">Ver mis turnos</a></p>
    </div>
  `.trim();

  return { subject, text, html };
}

export function buildWorkerCredentialsEmail(
  data: { workerNombre: string; email: string },
  appUrl: string,
): { subject: string; text: string; html: string } {
  const base = normalizeBaseUrl(appUrl);
  const loginUrl = `${base}login`;
  const subject = "Acceso SPE — Tus credenciales de trabajador";
  const text = [
    `Hola ${data.workerNombre},`,
    "",
    "Tu cuenta en el Sistema de Personal para Eventos (SPE) ya está activa.",
    "",
    "Credenciales de acceso:",
    `• Usuario (correo): ${data.email}`,
    "• Contraseña: tu número de documento / cédula (sin puntos ni espacios)",
    "",
    "Inicia sesión:",
    loginUrl,
    "",
    "En la app Trabajador usa el mismo correo y tu documento como contraseña.",
    "",
    "Por seguridad, cambia tu contraseña en Configuración cuando puedas.",
    "",
    "— SPE Negocio",
  ].join("\n");

  const html = `
    <div style="font-family:Inter,Arial,sans-serif;max-width:560px;color:#1a1a1a">
      <h2 style="color:#f09040">Tu cuenta SPE está lista</h2>
      <p>Hola <strong>${escapeHtml(data.workerNombre)}</strong>,</p>
      <p>Ya puedes entrar al sistema con estas credenciales:</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:8px 0;color:#666">Usuario</td><td><strong>${escapeHtml(data.email)}</strong></td></tr>
        <tr><td style="padding:8px 0;color:#666">Contraseña</td><td><strong>Tu documento / cédula</strong> (sin puntos ni espacios)</td></tr>
      </table>
      <p><a href="${loginUrl}" style="display:inline-block;background:#f09040;color:#000;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">Iniciar sesión</a></p>
    </div>
  `.trim();

  return { subject, text, html };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function resolveAppUrl(raw?: string): string {
  const trimmed = raw?.trim();
  return trimmed ? normalizeBaseUrl(trimmed) : DEFAULT_APP_URL;
}
