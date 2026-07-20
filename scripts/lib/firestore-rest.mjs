#!/usr/bin/env node
/**
 * Auth + Firestore vía REST (sin Admin SDK / sin JSON de cuenta de servicio).
 */

/** @typedef {{ uid: string; idToken: string; email: string }} AuthSession */

/**
 * @param {string} apiKey
 * @param {string} email
 * @param {string} password
 * @returns {Promise<AuthSession>}
 */
export async function signInOrCreateUser(apiKey, email, password) {
  const signIn = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    },
  );
  const signInData = await signIn.json();

  if (signIn.ok && signInData.localId) {
    return {
      uid: signInData.localId,
      idToken: signInData.idToken,
      email: signInData.email ?? email,
    };
  }

  const errMsg = signInData.error?.message ?? "";

  if (errMsg === "INVALID_LOGIN_CREDENTIALS" || errMsg === "INVALID_PASSWORD") {
    throw new Error(
      "El usuario ya existe pero la contraseña no coincide con SPE_PROD_PASSWORD. " +
        "Restablece la clave en Firebase Console → Authentication.",
    );
  }

  if (errMsg !== "EMAIL_NOT_FOUND") {
    throw new Error(`Auth signIn: ${errMsg || signIn.status}`);
  }

  const signUp = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    },
  );
  const signUpData = await signUp.json();
  if (!signUp.ok || !signUpData.localId) {
    throw new Error(`Auth signUp: ${signUpData.error?.message ?? signUp.status}`);
  }

  return {
    uid: signUpData.localId,
    idToken: signUpData.idToken,
    email: signUpData.email ?? email,
  };
}

/**
 * @param {Record<string, unknown>} value
 * @returns {object}
 */
function toFirestoreValue(value) {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === "string") return { stringValue: value };
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number") {
    if (Number.isInteger(value)) return { integerValue: String(value) };
    return { doubleValue: value };
  }
  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map(toFirestoreValue) } };
  }
  if (typeof value === "object") {
    const fields = {};
    for (const [k, v] of Object.entries(value)) {
      fields[k] = toFirestoreValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(value) };
}

/**
 * @param {Record<string, unknown>} data
 * @returns {{ fields: Record<string, object> }}
 */
export function toFirestoreDocument(data) {
  const fields = {};
  for (const [k, v] of Object.entries(data)) {
    fields[k] = toFirestoreValue(v);
  }
  return { fields };
}

/**
 * @param {object} opts
 * @param {string} opts.accessToken
 * @param {string} opts.projectId
 * @param {string} opts.collection
 * @param {string} opts.docId
 * @param {Record<string, unknown>} opts.data
 */
export async function upsertFirestoreDocument(opts) {
  const { accessToken, projectId, collection, docId, data } = opts;
  const url =
    `https://firestore.googleapis.com/v1/projects/${projectId}` +
    `/databases/(default)/documents/${collection}/${docId}`;

  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(toFirestoreDocument(data)),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Firestore PATCH ${collection}/${docId} (${res.status}): ${text.slice(0, 300)}`);
  }

  return res.json();
}
