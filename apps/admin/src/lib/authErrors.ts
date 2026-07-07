const AUTH_ERROR_MESSAGES: Record<string, string> = {
  "auth/api-key-not-valid.-please-pass-a-valid-api-key.": "Firebase no está configurado: falta una API key válida en el despliegue.",
  "auth/invalid-api-key": "Firebase no está configurado: API key inválida.",
  "auth/invalid-credential": "Correo o contraseña incorrectos.",
  "auth/user-not-found": "No existe una cuenta con ese correo.",
  "auth/wrong-password": "Contraseña incorrecta.",
  "auth/too-many-requests": "Demasiados intentos. Espera unos minutos e inténtalo de nuevo.",
  "auth/user-disabled": "Esta cuenta está inhabilitada. Contacta al administrador.",
  "auth/network-request-failed": "Sin conexión a internet. Revisa tu red e inténtalo de nuevo.",
};

export function formatAuthError(error: unknown): string {
  if (error instanceof Error) {
    const code = extractFirebaseAuthCode(error.message);
    if (code && AUTH_ERROR_MESSAGES[code]) {
      return AUTH_ERROR_MESSAGES[code];
    }
    if (error.message.includes("Firebase no está configurado")) {
      return error.message;
    }
    if (error.message.includes("auth/")) {
      return "No se pudo iniciar sesión. Verifica correo y contraseña.";
    }
    return error.message;
  }
  return "No se pudo iniciar sesión.";
}

function extractFirebaseAuthCode(message: string): string | null {
  const match = message.match(/\(auth\/[^)]+\)/);
  if (!match) return null;
  return match[0].slice(1, -1);
}
