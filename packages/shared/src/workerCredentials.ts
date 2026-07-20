/** Normaliza documento/cédula para usarla como contraseña inicial de Firebase Auth. */
export function workerDocumentPassword(documento: string): string {
  const normalized = documento.replace(/[\s.\-]/g, "").trim();
  if (normalized.length < 6) {
    throw new Error(
      "El documento debe tener al menos 6 caracteres (sin puntos ni espacios) para usarlo como contraseña.",
    );
  }
  return normalized;
}

export function buildWorkerCredentialsEmailContent(data: {
  workerNombre: string;
  email: string;
  appUrl: string;
}): { subject: string; body: string } {
  const loginUrl = data.appUrl.endsWith("/") ? `${data.appUrl}login` : `${data.appUrl}/login`;
  return {
    subject: "Acceso SPE — Tus credenciales de trabajador",
    body: [
      `Hola ${data.workerNombre},`,
      "",
      "Tu cuenta en el Sistema de Personal para Eventos (SPE) ya está activa.",
      "",
      "Credenciales de acceso:",
      `• Usuario (correo): ${data.email}`,
      "• Contraseña: tu número de documento / cédula (sin puntos ni espacios)",
      "",
      "Inicia sesión aquí:",
      loginUrl,
      "",
      "En la app Trabajador usa el mismo correo y tu documento como contraseña.",
      "",
      "Por seguridad, cambia tu contraseña en Configuración cuando puedas.",
      "",
      "— SPE Negocio",
    ].join("\n"),
  };
}
