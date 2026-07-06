import type { Invitation } from "./types";

/** Código numérico de un solo uso (6 dígitos). */
export function generateAccessCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function buildWorkerActivationUrl(
  token: string,
  workerBaseUrl: string,
  options?: { useHashRouter?: boolean },
): string {
  const base = workerBaseUrl.endsWith("/") ? workerBaseUrl : `${workerBaseUrl}/`;
  if (options?.useHashRouter) {
    return `${base}#/activar/${token}`;
  }
  return `${base}activar/${token}`;
}

export function buildWorkerJoinUrl(
  workerBaseUrl: string,
  options?: { useHashRouter?: boolean },
): string {
  const base = workerBaseUrl.endsWith("/") ? workerBaseUrl : `${workerBaseUrl}/`;
  if (options?.useHashRouter) {
    return `${base}#/unirse`;
  }
  return `${base}unirse`;
}

export interface InvitationLinks {
  /** Activación directa — navegador web */
  webActivation: string;
  /** Activación directa — App Android (HashRouter) */
  appActivation: string;
  /** Registro manual con correo + código — web */
  webJoin: string;
  /** Registro manual — App Android */
  appJoin: string;
}

export function buildInvitationLinks(
  token: string,
  workerBaseUrl: string,
): InvitationLinks {
  return {
    webActivation: buildWorkerActivationUrl(token, workerBaseUrl, { useHashRouter: false }),
    appActivation: buildWorkerActivationUrl(token, workerBaseUrl, { useHashRouter: true }),
    webJoin: buildWorkerJoinUrl(workerBaseUrl, { useHashRouter: false }),
    appJoin: buildWorkerJoinUrl(workerBaseUrl, { useHashRouter: true }),
  };
}

export function buildInvitationEmailContent(
  invitation: Pick<Invitation, "workerNombre" | "email" | "codigoAcceso" | "expiraEn">,
  links: InvitationLinks,
): { subject: string; body: string } {
  const expira = new Date(invitation.expiraEn).toLocaleDateString("es-CO", {
    dateStyle: "long",
  });

  return {
    subject: "Invitación SPE — Activa tu cuenta de trabajador",
    body: [
      `Hola ${invitation.workerNombre},`,
      "",
      "Fuiste invitado/a a unirte como trabajador en el Sistema de Personal para Eventos (SPE).",
      "",
      "══ CÓDIGO PERSONAL (un solo uso — no lo compartas) ══",
      invitation.codigoAcceso,
      "",
      "══ OPCIÓN A — App Android / Windows (recomendada en celular) ══",
      "1. Abre la app «SPE Eventos» instalada en tu dispositivo.",
      "2. Toca «Unirme con código de invitación».",
      "3. Ingresa tu correo y el código de arriba.",
      "4. Crea tu contraseña y completa tu perfil.",
      "",
      "══ OPCIÓN B — Navegador web ══",
      `1. Abre: ${links.webJoin}`,
      "2. Ingresa tu correo y el código de arriba.",
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
    ].join("\n"),
  };
}

export function buildInvitationMailtoUrl(
  invitation: Pick<Invitation, "workerNombre" | "email" | "codigoAcceso" | "expiraEn">,
  links: InvitationLinks,
): string {
  const { subject, body } = buildInvitationEmailContent(invitation, links);
  return `mailto:?to=${encodeURIComponent(invitation.email)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function validateAccessCode(provided: string, expected: string): boolean {
  const normalized = provided.replace(/\s/g, "").trim();
  return normalized.length > 0 && normalized === expected;
}
