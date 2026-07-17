#!/usr/bin/env node
/** Copia CREDENCIALES-SHEETS-AUTO.txt → config/bootstrap.json para deploy automático */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CRED = resolve(ROOT, "CREDENCIALES-SHEETS-AUTO.txt");
const OUT = resolve(ROOT, "config/bootstrap.json");

const text = existsSync(CRED) ? readFileSync(CRED, "utf-8") : "";
const url = text.match(/Web App URL:\s*(https:\/\/script\.google\.com\/macros\/s\/[^\s]+\/exec)/i)?.[1];
const token = text.match(/API Token:\s*(\S+)/i)?.[1];

if (!url || !token) {
  console.error("✗ Falta CREDENCIALES-SHEETS-AUTO.txt con URL y token");
  process.exit(1);
}

writeFileSync(
  OUT,
  JSON.stringify(
    {
      backend: "sheets",
      demoMode: false,
      sheetsWebAppUrl: url,
      sheetsApiToken: token,
      firebase: {},
    },
    null,
    2,
  ) + "\n",
);
console.log("✓ Escrito config/bootstrap.json — git add, commit y push a main");
