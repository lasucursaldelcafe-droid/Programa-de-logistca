#!/usr/bin/env python3
"""
SPE — Automatización máxima (Python).
Genera tokens, valida Pages, escribe credenciales locales y bootstrap.

Uso: python3 scripts/spe-max-auto.py
     npm run auto:max   (vía package.json)
"""
from __future__ import annotations

import json
import os
import secrets
import subprocess
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CONFIG = ROOT / "config"
PAGES_URL = "https://lasucursaldelcafe-droid.github.io/Programa-de-logistca/"
LOGIN_URL = PAGES_URL + "login"
MAPA_URL = PAGES_URL + "mapa"


def log(msg: str, level: str = "info") -> None:
    icons = {"info": "→", "ok": "✓", "warn": "!", "err": "✗"}
    print(f"{icons.get(level, '→')} {msg}")


def run(cmd: list[str], cwd: Path | None = None) -> int:
    log(" ".join(cmd))
    r = subprocess.run(cmd, cwd=cwd or ROOT, check=False)
    return r.returncode


def http_ok(url: str, timeout: int = 15) -> tuple[bool, int]:
    try:
        req = urllib.request.Request(url, method="GET", headers={"User-Agent": "SPE-auto-setup/1.0"})
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return True, resp.status
    except urllib.error.HTTPError as e:
        return False, e.code
    except Exception:
        return False, 0


def generate_token() -> str:
    return secrets.token_hex(24)


def write_credenciales_local(sheets_url: str, api_token: str) -> Path:
    path = CONFIG / "credenciales.local.json"
    ejemplo = CONFIG / "credenciales.local.ejemplo.json"
    base: dict = {}
    if ejemplo.exists():
        base = json.loads(ejemplo.read_text(encoding="utf-8"))
    base.setdefault("google", {})["email"] = "lasucursaldelcafe@gmail.com"
    base.setdefault("sheets", {})
    base["sheets"]["webAppUrl"] = sheets_url
    base["sheets"]["apiToken"] = api_token
    path.write_text(json.dumps(base, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return path


def write_pendientes_report(
    api_token: str,
    sheets_url: str,
    pages_ok: bool,
    manual_steps: list[str],
) -> Path:
    report = {
        "generadoEn": datetime.now(timezone.utc).isoformat(),
        "appUrl": PAGES_URL,
        "loginDemo": {"email": "admin@eventos.test", "password": "Admin123!"},
        "pagesResponde": pages_ok,
        "sheetsApiTokenGenerado": api_token,
        "sheetsWebAppUrl": sheets_url or "(PENDIENTE — ver manual)",
        "bootstrapPlantilla": {
            "backend": "sheets",
            "demoMode": False,
            "sheetsWebAppUrl": sheets_url or "PEGAR_URL_EXEC_AQUI",
            "sheetsApiToken": api_token,
        },
        "githubSecrets": {
            "VITE_DATA_BACKEND": "sheets",
            "VITE_DEMO_MODE": "false",
            "VITE_SHEETS_WEB_APP_URL": sheets_url or "PEGAR_URL_EXEC",
            "VITE_SHEETS_API_TOKEN": api_token,
            "VITE_GOOGLE_MAPS_API_KEY": "PEGAR_CLAVE_GOOGLE_MAPS",
        },
        "pasosManuales": manual_steps,
    }
    out = CONFIG / "pendientes-setup.json"
    out.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return out


def write_credenciales_txt(api_token: str, sheets_url: str) -> Path:
    path = ROOT / "CREDENCIALES-SPE-GENERADAS.txt"
    lines = [
        "SPE — Credenciales generadas automáticamente",
        f"Fecha: {datetime.now(timezone.utc).isoformat()}",
        "",
        f"API Token (Apps Script SPE_API_TOKEN): {api_token}",
        f"Web App URL: {sheets_url or '(ejecuta npm run setup:sheets-auto en PC con Google login)'}",
        "",
        "Cuentas demo:",
        "  admin@eventos.test / Admin123!",
        "  master@eventos.test / Master123!",
        "",
        "App:",
        f"  {LOGIN_URL}?spe_backend=demo",
        "",
        "GitHub Secrets (pegar en settings/secrets/actions):",
        f"  VITE_SHEETS_API_TOKEN = {api_token}",
        "  VITE_DATA_BACKEND = sheets",
        "  VITE_DEMO_MODE = false",
        f"  VITE_SHEETS_WEB_APP_URL = (URL /exec de Apps Script)",
        "",
        "NO SUBAS ESTE ARCHIVO A GIT.",
    ]
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return path


def read_sheets_url_from_file() -> str:
    for name in ("CREDENCIALES-SHEETS-AUTO.txt", "CREDENCIALES-SPE-GENERADAS.txt", "sheets-web-app-url.txt"):
        p = ROOT / name
        if not p.exists():
            continue
        text = p.read_text(encoding="utf-8", errors="ignore")
        for line in text.splitlines():
            if "script.google.com" in line and "/exec" in line:
                part = line.split(":", 1)[-1].strip()
                if part.startswith("http"):
                    return part
            if line.strip().startswith("http") and "/exec" in line:
                return line.strip()
    p = ROOT / "sheets-web-app-url.txt"
    if p.exists():
        t = p.read_text(encoding="utf-8").strip()
        if t.startswith("http"):
            return t
    return ""


def main() -> int:
    print("\n=== SPE MAX AUTO (Python) ===\n")

    if run(["npm", "install"], ROOT) != 0:
        log("npm install falló", "warn")

    run(["npm", "run", "config:sync"], ROOT)
    run(["npm", "run", "diagnostico"], ROOT)

    ok, status = http_ok(PAGES_URL)
    log(f"GitHub Pages: {status} {'OK' if ok else 'FAIL'}", "ok" if ok else "warn")

    api_token = generate_token()
    log(f"Token API generado: {api_token[:12]}…", "ok")

    sheets_url = read_sheets_url_from_file()
    if sheets_url:
        log(f"URL Sheets encontrada: {sheets_url[:50]}…", "ok")
    else:
        log("Sin URL Sheets aún — requiere setup:sheets-auto con Google login", "warn")

    cred_path = write_credenciales_local(sheets_url, api_token)
    log(f"Escrito {cred_path.relative_to(ROOT)} (gitignore)", "ok")

    txt_path = write_credenciales_txt(api_token, sheets_url)
    log(f"Escrito {txt_path.name} (gitignore)", "ok")

    manual: list[str] = []
    if not sheets_url:
        manual.extend([
            "PC Windows: ejecutar scripts/windows/SPE-Setup-Completo.ps1 (Google login + clasp)",
            "O celular: Apps Script manual → pegar URL /exec en config/bootstrap.json",
        ])
    manual.extend([
        "GitHub → Settings → Secrets → pegar VITE_SHEETS_* y VITE_GOOGLE_MAPS_API_KEY",
        "Push config/bootstrap.json con backend sheets → deploy automático",
        "Probar: /login → admin@eventos.test → /mapa",
    ])

    report_path = write_pendientes_report(api_token, sheets_url, ok, manual)
    log(f"Reporte: {report_path.relative_to(ROOT)}", "ok")

    if sheets_url:
        run(["npm", "run", "config:sync"], ROOT)
        # Health check Sheets
        try:
            health_url = f"{sheets_url.rstrip('/')}?action=health&token={api_token}"
            req = urllib.request.Request(health_url, headers={"User-Agent": "SPE-auto/1.0"})
            with urllib.request.urlopen(req, timeout=20) as resp:
                data = json.loads(resp.read().decode())
                if data.get("ok"):
                    log("Sheets backend responde OK", "ok")
                else:
                    log("Sheets respondió pero ok=false — revisa token en Apps Script", "warn")
        except Exception as e:
            log(f"Sheets health falló (normal si aún no desplegaste): {e}", "warn")

    run(["npm", "run", "check:nav"], ROOT)
    run(["npm", "run", "verify:flows"], ROOT)

    print("\n--- SOLO TÚ (manual) ---")
    for i, step in enumerate(manual, 1):
        print(f"  {i}. {step}")
    print(f"\nDetalle completo: {report_path}")
    print(f"Token para Apps Script SPE_API_TOKEN: {api_token}\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
