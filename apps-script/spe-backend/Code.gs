/**
 * SPE Backend — Google Apps Script + Google Sheets
 *
 * Despliega como Web App (Ejecutar como: yo / Acceso: cualquiera con el enlace).
 * Copia este archivo en script.google.com → Nuevo proyecto → Pegar → Implementar.
 *
 * Hojas requeridas en el Spreadsheet vinculado:
 *   users, workers, shifts, events, sites, attendance, invitations
 */
const SHEET_NAMES = {
  users: "users",
  workers: "workers",
  shifts: "shifts",
  events: "events",
  sites: "sites",
  attendance: "attendance",
  invitations: "invitations",
};

const API_TOKEN = PropertiesService.getScriptProperties().getProperty("SPE_API_TOKEN") || "cambiar-token-seguro";

function doGet(e) {
  return handleRequest(e, "GET");
}

function doPost(e) {
  return handleRequest(e, "POST");
}

function handleRequest(e, method) {
  try {
    const token = (e.parameter && e.parameter.token) || (e.postData && JSON.parse(e.postData.contents || "{}").token);
    if (token !== API_TOKEN) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const action = e.parameter.action || (e.postData ? JSON.parse(e.postData.contents).action : null);
    if (!action) return jsonResponse({ error: "Missing action" }, 400);

    switch (action) {
      case "health":
        return jsonResponse({ ok: true, backend: "google-sheets", version: "1.0" });
      case "login":
        return loginUser(e);
      case "list":
        return listRows(e.parameter.collection || JSON.parse(e.postData.contents).collection);
      case "upsert":
        return upsertRow(e);
      case "delete":
        return deleteRow(e);
      default:
        return jsonResponse({ error: "Unknown action: " + action }, 400);
    }
  } catch (err) {
    return jsonResponse({ error: String(err) }, 500);
  }
}

function loginUser(e) {
  const body = e.postData ? JSON.parse(e.postData.contents) : e.parameter;
  const email = (body.email || "").toLowerCase().trim();
  const password = body.password || "";
  const sheet = getSheet(SHEET_NAMES.users);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  for (let i = 1; i < data.length; i++) {
    const row = rowToObject(headers, data[i]);
    if (row.email && row.email.toLowerCase() === email && row.password === password) {
      return jsonResponse({
        uid: row.uid || "sheets-" + i,
        email: row.email,
        nombre: row.nombre,
        role: row.role,
        workerId: row.workerId || null,
        perfilCompleto: row.perfilCompleto !== "false",
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
  for (let i = 1; i < data.length; i++) {
    items.push(rowToObject(headers, data[i]));
  }
  return jsonResponse({ items });
}

function upsertRow(e) {
  const body = JSON.parse(e.postData.contents);
  const sheet = getSheet(body.collection);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const idField = body.idField || "id";
  const record = body.record;
  const data = sheet.getDataRange().getValues();
  let rowIndex = -1;
  const idCol = headers.indexOf(idField);
  for (let i = 1; i < data.length; i++) {
    if (data[i][idCol] === record[idField]) {
      rowIndex = i + 1;
      break;
    }
  }
  const row = headers.map((h) => record[h] ?? "");
  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
  } else {
    sheet.appendRow(row);
  }
  return jsonResponse({ ok: true });
}

function deleteRow(e) {
  const body = JSON.parse(e.postData.contents);
  const sheet = getSheet(body.collection);
  const headers = sheet.getDataRange().getValues()[0];
  const idCol = headers.indexOf(body.idField || "id");
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][idCol] === body.id) {
      sheet.deleteRow(i + 1);
      return jsonResponse({ ok: true });
    }
  }
  return jsonResponse({ error: "Not found" }, 404);
}

function getSheet(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    initSheetHeaders(name, sheet);
  }
  return sheet;
}

function initSheetHeaders(name, sheet) {
  const schemas = {
    users: ["uid", "email", "password", "nombre", "role", "workerId", "perfilCompleto"],
    workers: ["id", "nombre", "documento", "telefono", "email", "perfiles", "estado", "rating"],
    shifts: ["id", "workerId", "workerNombre", "eventId", "siteId", "inicio", "fin", "estado"],
    events: ["id", "nombre", "fechaInicio", "fechaFin"],
    sites: ["id", "eventId", "nombre", "lat", "lng", "radioGeocerca"],
    attendance: ["id", "workerId", "shiftId", "tipo", "timestamp", "lat", "lng", "estado"],
    invitations: ["id", "email", "codigo", "rol", "estado", "creadoEn"],
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
  headers.forEach((h, i) => {
    if (h) obj[h] = row[i];
  });
  return obj;
}

function jsonResponse(obj, code) {
  const output = ContentService.createTextOutput(JSON.stringify(obj));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

/** Ejecutar una vez desde el editor para crear hojas y datos iniciales */
function setupSheets() {
  Object.keys(SHEET_NAMES).forEach((k) => getSheet(SHEET_NAMES[k]));
  Logger.log("SPE Sheets backend listo");
}
