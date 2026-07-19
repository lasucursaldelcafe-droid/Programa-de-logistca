/**
 * SPE Backend — Google Apps Script + Google Sheets
 * Despliegue automático: npm run setup:sheets-auto (clasp login en navegador, sin JSON)
 */
const SHEET_NAMES = {
  users: "users",
  workers: "workers",
  shifts: "shifts",
  events: "events",
  sites: "sites",
  attendance: "attendance",
  invitations: "invitations",
  qrCodes: "qrCodes",
  notifications: "notifications",
  setupConfig: "setupConfig",
  reports: "reports",
  payrollRates: "payrollRates",
  conversations: "conversations",
  messages: "messages",
  videoRooms: "videoRooms",
};

function getApiToken() {
  return PropertiesService.getScriptProperties().getProperty("SPE_API_TOKEN") || "cambiar-token-seguro";
}

/** Acepta token configurado o token de migración SPE (bootstrap GitHub). */
function isAuthorizedToken(token) {
  if (!token) return false;
  if (token === getApiToken()) return true;
  if (token === "54fcc140d21cd5101df28b00673cc359f799e9bca53ff72c") return true;
  return false;
}

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  try {
    const body = e.postData ? JSON.parse(e.postData.contents || "{}") : {};
    const token = (e.parameter && e.parameter.token) || body.token;
    if (!isAuthorizedToken(token)) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const action = (e.parameter && e.parameter.action) || body.action;
    if (!action) return jsonResponse({ error: "Missing action" }, 400);

    switch (action) {
      case "health":
        return jsonResponse({ ok: true, backend: "google-sheets", version: "1.1" });
      case "bootstrap":
        return bootstrapBackend();
      case "login":
        return loginUser(body);
      case "list":
        return listRows((e.parameter && e.parameter.collection) || body.collection);
      case "upsert":
        return upsertRow(body);
      case "delete":
        return deleteRow(body);
      default:
        return jsonResponse({ error: "Unknown action: " + action }, 400);
    }
  } catch (err) {
    return jsonResponse({ error: String(err) }, 500);
  }
}

function bootstrapBackend() {
  Object.keys(SHEET_NAMES).forEach(function (k) {
    getSheet(SHEET_NAMES[k]);
  });
  return jsonResponse({ ok: true, message: "Hojas SPE creadas", collections: Object.keys(SHEET_NAMES) });
}

function loginUser(body) {
  const email = (body.email || "").toLowerCase().trim();
  const password = body.password || "";
  const sheet = getSheet(SHEET_NAMES.users);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  for (var i = 1; i < data.length; i++) {
    const row = rowToObject(headers, data[i]);
    if (row.email && String(row.email).toLowerCase() === email && String(row.password) === password) {
      return jsonResponse({
        uid: row.uid || "sheets-" + i,
        email: row.email,
        nombre: row.nombre,
        role: row.role,
        workerId: row.workerId || null,
        perfilCompleto: row.perfilCompleto !== "false" && row.perfilCompleto !== false,
      });
    }
  }
  return jsonResponse({ error: "Credenciales inválidas" }, 401);
}

function listRows(collection) {
  const sheet = getSheet(collection);
  if (!sheet) return jsonResponse({ error: "Collection not found" }, 404);
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return jsonResponse({ items: [] });
  const headers = data[0];
  const items = [];
  for (var i = 1; i < data.length; i++) {
    items.push(rowToObject(headers, data[i]));
  }
  return jsonResponse({ items: items });
}

function upsertRow(body) {
  const sheet = getSheet(body.collection);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const idField = body.idField || "id";
  const record = body.record;
  const data = sheet.getDataRange().getValues();
  var rowIndex = -1;
  const idCol = headers.indexOf(idField);
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][idCol]) === String(record[idField])) {
      rowIndex = i + 1;
      break;
    }
  }
  const row = headers.map(function (h) {
    return record[h] !== undefined && record[h] !== null ? record[h] : "";
  });
  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, rowIndex, row.length).setValues([row]);
  } else {
    sheet.appendRow(row);
  }
  return jsonResponse({ ok: true });
}

function deleteRow(body) {
  const sheet = getSheet(body.collection);
  const headers = sheet.getDataRange().getValues()[0];
  const idCol = headers.indexOf(body.idField || "id");
  const data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][idCol]) === String(body.id)) {
      sheet.deleteRow(i + 1);
      return jsonResponse({ ok: true });
    }
  }
  return jsonResponse({ error: "Not found" }, 404);
}

function getSheet(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    initSheetHeaders(name, sheet);
  }
  return sheet;
}

function initSheetHeaders(name, sheet) {
  const schemas = {
    users: ["uid", "email", "password", "nombre", "role", "workerId", "perfilCompleto", "telefono", "habilitado"],
    workers: ["id", "nombre", "documento", "telefono", "email", "perfiles", "estado", "rating", "habilitado", "cuentaCreada", "rolPlataforma", "creadoEn"],
    shifts: ["id", "workerId", "workerNombre", "eventId", "eventNombre", "siteId", "siteNombre", "inicio", "fin", "estado"],
    events: ["id", "nombre", "fechaInicio", "fechaFin", "sitioIds", "temaLaboral", "reglasOperativas", "tiempoMinimoEstadiaMinutos", "supervisionActiva"],
    sites: ["id", "eventId", "nombre", "lat", "lng", "radioGeocerca"],
    attendance: ["id", "workerId", "workerNombre", "shiftId", "siteId", "siteNombre", "eventId", "eventNombre", "qrId", "estado", "entrada", "salida", "ubicacionActual", "alertasGeocerca", "creadoEn"],
    invitations: ["id", "token", "workerId", "workerNombre", "email", "codigoAcceso", "role", "estado", "creadaEn", "expiraEn", "creadaPor", "creadaPorNombre", "usadaEn", "uid"],
    qrCodes: ["id", "eventId", "eventNombre", "siteId", "siteNombre", "token", "secret", "modo", "intervaloRotacionSegundos", "ventanaInicio", "ventanaFin", "radioGeocerca", "descripcionDatos", "activo", "creadoEn", "creadoPor"],
    notifications: ["id", "tipo", "titulo", "mensaje", "timestamp", "urgente", "destinatarios", "shiftId", "eventId", "siteId", "attendanceId", "actorUid", "actorNombre", "leidaPor", "accionTurno"],
    setupConfig: ["id", "completado", "pasoActual", "pasosCompletados", "eventoId", "actualizadoEn", "actualizadoPor", "actualizadoPorNombre"],
    reports: ["id", "workerId", "workerNombre", "shiftId", "siteId", "siteNombre", "eventId", "tipo", "mensaje", "estado", "creadoEn", "resueltoEn", "resueltoPor", "resueltoPorNombre"],
    payrollRates: ["id", "perfil", "tarifaPorHora", "costoRefrigerioAlmuerzo", "costoRefrigerioCena", "costoRefrigerioSnack"],
    conversations: ["id", "eventId", "eventNombre", "siteId", "siteNombre", "tipo", "titulo", "participantIds", "lastMessageAt", "lastMessagePreview", "creadoEn", "creadoPor"],
    messages: ["id", "conversationId", "senderUid", "senderNombre", "texto", "creadoEn", "leidoPor"],
    videoRooms: ["id", "conversationId", "eventId", "eventNombre", "roomName", "creadoPor", "creadoPorNombre", "creadoEn", "activo"],
  };
  const headers = schemas[name] || ["id"];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  if (name === "users") {
    sheet.appendRow(["sheets-admin", "admin@eventos.test", "Admin123!", "Administrador", "administrador", "", "true"]);
    sheet.appendRow(["sheets-master", "master@eventos.test", "Master123!", "Master Plataforma", "super_admin", "", "true"]);
  }
}

function rowToObject(headers, row) {
  const obj = {};
  headers.forEach(function (h, i) {
    if (h) obj[h] = row[i];
  });
  return obj;
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/** Ejecutar desde clasp: npm run apps-script:bootstrap */
function setupSheets() {
  bootstrapBackend();
  Logger.log("SPE Sheets backend listo");
}

/** clasp run setSpeApiToken --params '["tu-token"]' */
function setSpeApiToken(token) {
  PropertiesService.getScriptProperties().setProperty("SPE_API_TOKEN", token);
  Logger.log("SPE_API_TOKEN configurado");
}
