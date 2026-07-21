const AUTH_ERROR_MESSAGES: Record<string, string> = {
  "auth/api-key-not-valid.-please-pass-a-valid-api-key.":
    "Firebase no está configurado: falta una API key válida en el despliegue.",
  "auth/invalid-api-key": "Firebase no está configurado: API key inválida.",
  "auth/invalid-credential":
    "Correo o contraseña incorrectos. Personal de campo: contraseña = cédula (solo números).",
  "auth/user-not-found": "No existe una cuenta con ese correo.",
  "auth/wrong-password":
    "Contraseña incorrecta. Personal de campo: usa la cédula sin puntos ni espacios.",
  "auth/too-many-requests": "Demasiados intentos. Espera unos minutos e inténtalo de nuevo.",
  "auth/user-disabled": "Esta cuenta está inhabilitada. Contacta al administrador.",
  "auth/network-request-failed": "Sin conexión a internet. Revisa tu red e inténtalo de nuevo.",
  "auth/email-already-in-use":
    "Este correo ya tiene cuenta en SPE. Usa «Iniciar sesión» o «Olvidé mi contraseña» en la pantalla de login. " +
    "Si acabas de activar, puede que la cuenta ya se haya creado: prueba entrar con la contraseña que elegiste.",
  "auth/weak-password": "La contraseña es demasiado débil. Usa al menos 8 caracteres.",
  "permission-denied":
    "Firestore sin permisos: faltan reglas desplegadas o el documento users/{tu UID}. " +
    "Ejecuta Bootstrap Firestore en GitHub Actions o pega las reglas en Firebase Console.",
};

export function formatAuthError(error: unknown): string {
  if (error instanceof Error) {
    const code = extractFirebaseAuthCode(error.message);
    if (code && AUTH_ERROR_MESSAGES[code]) {
      return AUTH_ERROR_MESSAGES[code];
    }
    if (
      error.message.includes("Missing or insufficient permissions") ||
      error.message.includes("permission-denied")
    ) {
      return AUTH_ERROR_MESSAGES["permission-denied"] ?? error.message;
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
  const authMatch = message.match(/\(auth\/[^)]+\)/);
  if (authMatch) return authMatch[0].slice(1, -1);
  if (message.includes("permission-denied")) return "permission-denied";
  return null;
}
