#!/usr/bin/env node
/**
 * Token OAuth de Firebase CLI (firebase login:ci) — NO requiere JSON de cuenta de servicio.
 * Client ID/secret públicos del Firebase CLI (firebase-tools).
 */
const FIREBASE_CLI_CLIENT_ID =
  "563584335869-fgrhmrh898pt7kojlsbd5qmr4l24dlfm.apps.googleusercontent.com";
const FIREBASE_CLI_CLIENT_SECRET = "j9pW8X8bd2MDk";

/** @returns {Promise<string>} */
export async function getAccessTokenFromRefreshToken(refreshToken) {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: FIREBASE_CLI_CLIENT_ID,
    client_secret: FIREBASE_CLI_CLIENT_SECRET,
    refresh_token: refreshToken,
  });

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OAuth token falló (${res.status}): ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  if (!data.access_token) {
    throw new Error("OAuth: respuesta sin access_token");
  }
  return data.access_token;
}
