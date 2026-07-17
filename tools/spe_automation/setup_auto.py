"""Pipeline automático: Firebase producción + FCM + GitHub + seed opcional."""
from __future__ import annotations

import json
import subprocess
from pathlib import Path

from .config import ROOT, npm_cmd
from .credentials import (
    apply_production_config,
    load_config_file,
    push_github_secrets,
    validate_production_config,
    write_credentials_file,
)
from .env_manager import github_secrets_template


def _run_npm(script: str, extra_args: list[str] | None = None, timeout: int = 600) -> tuple[int, str]:
    cmd = [npm_cmd(), "run", script]
    if extra_args:
        cmd.extend(["--", *extra_args])
    r = subprocess.run(
        cmd,
        cwd=ROOT,
        capture_output=True,
        text=True,
        timeout=timeout,
        shell=False,
    )
    out = (r.stdout or "") + (r.stderr or "")
    return r.returncode, out


def apply_sheets_bridge(web_app_url: str, api_token: str) -> dict[str, object]:
    """Configura backend Google Sheets (Apps Script) como puente sin Firebase completo."""
    from .env_manager import apply_firebase_to_all_apps

    values = {
        "VITE_DATA_BACKEND": "sheets",
        "VITE_SHEETS_WEB_APP_URL": web_app_url.strip(),
        "VITE_SHEETS_API_TOKEN": api_token.strip(),
        "VITE_FIREBASE_API_KEY": "sheets-bridge",
        "VITE_FIREBASE_AUTH_DOMAIN": "sheets.local",
        "VITE_FIREBASE_PROJECT_ID": "sheets-bridge",
        "VITE_FIREBASE_STORAGE_BUCKET": "sheets.local",
        "VITE_FIREBASE_MESSAGING_SENDER_ID": "0",
        "VITE_FIREBASE_APP_ID": "sheets-bridge",
        "VITE_USE_FIREBASE_EMULATORS": "false",
    }
    paths = apply_firebase_to_all_apps(values, demo_mode=False)
    cred = write_credentials_file("sheets_bridge")
    guide = ROOT / "CONFIGURACION-SHEETS.txt"
    guide.write_text(
        "\n".join(
            [
                "SPE — Backend Google Sheets (Apps Script)",
                "",
                f"URL Web App: {web_app_url}",
                f"Token API: {api_token[:8]}…",
                "",
                "Script: apps-script/spe-backend/Code.gs",
                "Guía: docs-source/OPCION-GOOGLE-SHEETS.md",
                "",
                "Limitación: GPS entre varios celulares requiere Firebase en producción.",
            ]
        ),
        encoding="utf-8",
    )
    return {
        "ok": True,
        "mode": "sheets",
        "env_paths": [str(p) for p in paths],
        "credentials_file": str(cred),
        "sheets_guide": str(guide),
    }


def run_auto_production(
    values: dict[str, str] | None = None,
    *,
    push_github: bool = False,
    seed: bool = False,
    deploy_rules: bool = True,
) -> dict[str, object]:
    """Configura producción Firebase de punta a punta desde PC."""
    config = values or load_config_file()
    if not config:
        return {
            "ok": False,
            "errors": [
                "Falta firebase-web-config.json en la raíz del proyecto.",
                "Copia el SDK web desde Firebase Console (PC) y vuelve a ejecutar.",
            ],
        }

    paths, errors = apply_production_config(config)
    if errors:
        return {"ok": False, "errors": errors}

    tpl_path = ROOT / "github-secrets-commands.txt"
    tpl_path.write_text(github_secrets_template(config), encoding="utf-8")
    cred_path = write_credentials_file("produccion")

    fcm_code, fcm_out = _run_npm("setup:fcm")
    fcm_ok = fcm_code == 0

    rules_ok = False
    rules_msg = "Omitido"
    project_id = config.get("VITE_FIREBASE_PROJECT_ID", "")
    sa_path = ROOT / "service-account.json"
    if deploy_rules and sa_path.is_file() and project_id:
        try:
            r = subprocess.run(
                [
                    "npx",
                    "firebase",
                    "deploy",
                    "--only",
                    "firestore:rules",
                    "--project",
                    project_id,
                ],
                cwd=ROOT,
                capture_output=True,
                text=True,
                timeout=120,
                env={**dict(__import__("os").environ), "GOOGLE_APPLICATION_CREDENTIALS": str(sa_path)},
            )
            rules_ok = r.returncode == 0
            rules_msg = r.stdout.strip() or r.stderr.strip() or ("OK" if rules_ok else "Falló")
        except (subprocess.TimeoutExpired, FileNotFoundError) as exc:
            rules_msg = str(exc)

    gh_ok, gh_msg = (False, "No solicitado")
    if push_github:
        gh_ok, gh_msg = push_github_secrets(config)

    seed_ok = False
    seed_msg = "No solicitado"
    if seed and sa_path.is_file():
        code, out = _run_npm("seed:production", [f"--service-account={sa_path}"])
        seed_ok = code == 0
        seed_msg = out.strip()[-500:] if out else ("OK" if seed_ok else "Falló")

    checklist_path = ROOT / "CHECKLIST-PRODUCCION.txt"
    checklist_path.write_text(
        _build_checklist(config, fcm_ok, rules_ok, gh_ok, seed_ok),
        encoding="utf-8",
    )

    return {
        "ok": True,
        "mode": "production",
        "env_paths": [str(p) for p in paths],
        "github_template": str(tpl_path),
        "credentials_file": str(cred_path),
        "checklist": str(checklist_path),
        "fcm_updated": fcm_ok,
        "fcm_log": fcm_out[-300:] if fcm_out else "",
        "firestore_rules": {"ok": rules_ok, "message": rules_msg},
        "github_push_ok": gh_ok,
        "github_push_message": gh_msg,
        "seed_ok": seed_ok,
        "seed_message": seed_msg,
        "next_steps": [
            "gh auth login && npm run toolkit:secrets",
            "Firebase Console → Authentication → Email/contraseña ACTIVADO",
            "service-account.json → npm run seed:production",
            "npm start  (probar login admin)",
        ],
    }


def _build_checklist(
    config: dict[str, str],
    fcm_ok: bool,
    rules_ok: bool,
    gh_ok: bool,
    seed_ok: bool,
) -> str:
    pid = config.get("VITE_FIREBASE_PROJECT_ID", "?")
    lines = [
        "══════════════════════════════════════════════",
        "  SPE — Checklist producción (automático)",
        f"  Proyecto Firebase: {pid}",
        "══════════════════════════════════════════════",
        "",
        f"[{'x' if True else ' '}] .env.local en admin, worker, master",
        f"[{'x' if fcm_ok else ' '}] firebase-messaging-sw.js sincronizado",
        f"[{'x' if rules_ok else ' '}] Reglas Firestore desplegadas",
        f"[{'x' if gh_ok else ' '}] GitHub Secrets subidos",
        f"[{'x' if seed_ok else ' '}] Cuentas admin/master en Auth",
        "",
        "Manual en Firebase Console (solo PC, una vez):",
        "  [ ] Authentication → Sign-in → Email/Password ON",
        "  [ ] Firestore Database creada",
        "  [ ] (Opcional) Cloud Messaging → VAPID key → VITE_FIREBASE_VAPID_KEY",
        "",
        "Archivos generados:",
        "  github-secrets-commands.txt",
        "  CREDENCIALES-SPE.txt",
        "",
    ]
    return "\n".join(lines)
