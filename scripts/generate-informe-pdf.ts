import puppeteer from "puppeteer-core";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const HTML = resolve(ROOT, "INFORME-REVISION-PRESENTACION.html");
const PDF = resolve(ROOT, "INFORME-REVISION-SPE.pdf");

const CHROME_PATHS = [
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
];

async function main(): Promise<void> {
  const chrome = CHROME_PATHS.find((p) => existsSync(p));
  if (!chrome) throw new Error("Chrome/Chromium no encontrado para generar PDF");

  const browser = await puppeteer.launch({
    executablePath: chrome,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.goto(`file://${HTML}`, { waitUntil: "networkidle0", timeout: 60000 });
  await page.pdf({
    path: PDF,
    format: "A4",
    printBackground: true,
    margin: { top: "14mm", right: "12mm", bottom: "18mm", left: "12mm" },
    displayHeaderFooter: true,
    headerTemplate: `<div style="font-size:8px;color:#64748b;width:100%;padding:0 10mm;font-family:Segoe UI,sans-serif;">SPE — Sistema de Personal para Eventos</div>`,
    footerTemplate: `<div style="font-size:8px;color:#64748b;width:100%;padding:0 10mm;font-family:Segoe UI,sans-serif;display:flex;justify-content:space-between;"><span>Informe de revisión · Julio 2026</span><span>Pág. <span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`,
  });

  await browser.close();
  console.log(`✓ PDF generado: ${PDF}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
