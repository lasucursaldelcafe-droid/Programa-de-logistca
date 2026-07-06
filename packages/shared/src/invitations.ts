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

export function buildInvitationEmailContent(
  invitation: Pick<Invitation, "workerNombre" | "email" | "codigoAcceso" | "expiraEn">,
  activationUrl: string,
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
      "Pasos para activar tu cuenta (solo una vez):",
      "",
      "1. Abre este enlace en la App Trabajador (web o Android):",
      activationUrl,
      "",
      "2. Ingresa tu código personal de un solo uso (no lo compartas):",
      invitation.codigoAcceso,
      "",
      "3. Crea tu contraseña y completa tu perfil.",
      "",
      `Correo registrado: ${invitation.email}`,
      `El código caduca el ${expira}.`,
      "",
      "Si el enlace ya fue usado o expiró, solicita una nueva invitación al administrador.",
      "",
      "— SPE Negocio",
    ].join("\n"),
  };
}

export function buildInvitationMailtoUrl(
  invitation: Pick<Invitation, "workerNombre" | "email" | "codigoAcceso" | "expiraEn">,
  activationUrl: string,
): string {
  const { subject, body } = buildInvitationEmailContent(invitation, activationUrl);
  return `mailto:?to=${encodeURIComponent(invitation.email)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function validateAccessCode(provided: string, expected: string): boolean {
  const normalized = provided.replace(/\s/g, "").trim();
  return normalized.length > 0 && normalized === expected;
}
