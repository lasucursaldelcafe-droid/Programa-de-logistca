"""Credenciales y configuración Firebase para SPE."""
from __future__ import annotations

import json
import re
import subprocess
from pathlib import Path

from .config import FIREBASE_KEYS, OPTIONAL_KEYS, ROOT
from .env_manager import apply_firebase_to_all_apps, write_env

# Configuración emuladores locales (npm run dev:full + seed)
DEMO_EMULATOR_CONFIG: dict[str, str] = {
    "VITE_FIREBASE_API_KEY": "demo-api-key",
    "VITE_FIREBASE_AUTH_DOMAIN": "demo-personal-eventos.firebaseapp.com",
    "VITE_FIREBASE_PROJECT_ID": "demo-personal-eventos",
    "VITE_FIREBASE_STORAGE_BUCKET": "demo-personal-eventos.appspot.com",
    "VITE_FIREBASE_MESSAGING_SENDER_ID": "000000000000",
    "VITE_FIREBASE_APP_ID": "1:000000000000:web:demo",
}

DEMO_ACCOUNTS = [
    {"email": "master@eventos.test", "password": "Master123!", "role": "super_admin", "app": "Master (puerto 5175)"},
    {"email": "admin@eventos.test", "password": "Admin123!", "role": "administrador", "app": "Admin (puerto 5173)"},
]

KEY_MAP = {
    "apiKey": "VITE_FIREBASE_API_KEY",
    "authDomain": "VITE_FIREBASE_AUTH_DOMAIN",
    "projectId": "VITE_FIREBASE_PROJECT_ID",
    "storageBucket": "VITE_FIREBASE_STORAGE_BUCKET",
    "messagingSenderId": "VITE_FIREBASE_MESSAGING_SENDER_ID",
    "appId": "VITE_FIREBASE_APP_ID",
}


def parse_firebase_config(text: str) -> dict[str, str]:
    """Convierte JSON o snippet JS de Firebase Console a variables VITE_*."""
    text = text.strip()
    if not text:
        return {}

    # JSON puro
    if text.startswith("{"):
        try:
            data = json.loads(text)
            return _map_firebase_dict(data)
        except json.JSONDecodeError:
            pass

    # Bloque firebaseConfig = { ... }
    match = re.search(r"\{[^{}]*apiKey[^{}]*\}", text, re.DOTALL)
    if match:
        block = match.group(0)
        block = re.sub(r"(\w+)\s*:", r'"\1":', block)  # keys sin comillas
        block = block.replace("'", '"')
        try:
            data = json.loads(block)
            return _map_firebase_dict(data)
        except json.JSONDecodeError:
            pass

    # Líneas KEY=value
    out: dict[str, str] = {}
    for line in text.splitlines():
        s = line.strip()
        if "=" in s and s.upper().startswith("VITE_FIREBASE"):
            k, _, v = s.partition("=")
            out[k.strip()] = v.strip()
    return out


def _map_firebase_dict(data: dict) -> dict[str, str]:
    out: dict[str, str] = {}
    for src, dest in KEY_MAP.items():
        val = data.get(src)
        if val is not None and str(val).strip():
            out[dest] = str(val).strip()
    vapid = data.get("vapidKey") or data.get("VITE_FIREBASE_VAPID_KEY")
    if vapid:
        out["VITE_FIREBASE_VAPID_KEY"] = str(vapid).strip()
    return out


def validate_production_config(values: dict[str, str]) -> tuple[bool, list[str]]:
    errors: list[str] = []
    placeholders = {"", "demo-api-key", "demo-personal-eventos", "000000000000"}
    for key in FIREBASE_KEYS:
        val = (values.get(key) or "").strip()
        if not val:
            errors.append(f"Falta {key}")
        elif key == "VITE_FIREBASE_API_KEY" and val in placeholders:
            errors.append("API Key es de demostración — usa credenciales reales de Firebase Console")
        elif key == "VITE_FIREBASE_PROJECT_ID" and val == "demo-personal-eventos":
            errors.append("Project ID es de emulador — usa tu proyecto Firebase real")
    return len(errors) == 0, errors


def apply_demo_emulator_config() -> list[Path]:
    """Escribe credenciales de emulador en las 3 apps (desarrollo local 100%)."""
    extra = {
        **DEMO_EMULATOR_CONFIG,
        "VITE_USE_FIREBASE_EMULATORS": "true",
    }
    return apply_firebase_to_all_apps(extra, demo_mode=True)


def apply_production_config(values: dict[str, str]) -> tuple[list[Path], list[str]]:
    ok, errors = validate_production_config(values)
    if not ok:
        return [], errors
    prod = {**values, "VITE_USE_FIREBASE_EMULATORS": "false"}
    paths = apply_firebase_to_all_apps(prod, demo_mode=False)
    return paths, []


def write_credentials_file(mode: str, extra: dict[str, str] | None = None) -> Path:
    """Genera CREDENCIALES-SPE.txt (gitignored) con instrucciones de acceso."""
    path = ROOT / "CREDENCIALES-SPE.txt"
    lines = [
        "═══════════════════════════════════════════════════════",
        "  SPE — Credenciales y acceso",
        f"  Modo: {mode}",
        "═══════════════════════════════════════════════════════",
        "",
    ]

    if mode == "desarrollo_emuladores":
        lines.extend([
            "DESARROLLO LOCAL (emuladores Firebase)",
            "",
            "1. Ejecuta: npm run dev:full",
            "   (o desde SPE Toolkit → Desarrollo → Servidor desarrollo)",
            "",
            "2. Cuentas creadas automáticamente por seed:",
            "",
        ])
        for acc in DEMO_ACCOUNTS:
            lines.append(f"   {acc['app']}")
            lines.append(f"     Email:    {acc['email']}")
            lines.append(f"     Password: {acc['password']}")
            lines.append(f"     Rol:      {acc['role']}")
            lines.append("")
        lines.extend([
            "3. Trabajador: crear desde Admin → Personal → Invitación",
            "",
            "Emuladores:",
            "  Auth UI:      http://localhost:4000",
            "  Admin web:    http://localhost:5173",
            "  Master web:   http://localhost:5175  (npm run dev:master)",
            "  Worker web:   http://localhost:5174  (npm run dev:worker)",
        ])
    else:
        lines.extend([
            "PRODUCCIÓN (Firebase real)",
            "",
            "Variables guardadas en:",
            "  apps/admin/.env.local",
            "  apps/master/.env.local",
            "  apps/worker/.env.local",
            "",
            "GitHub Secrets (para Pages y releases):",
            "  Ver github-secrets-commands.txt",
            "",
            "Cuentas de plataforma:",
        ])
        if extra:
            for k, v in extra.items():
                lines.append(f"  {k}: {v}")
        else:
            lines.extend([
                "  Ejecuta: npm run seed:production",
                "  (requiere service-account.json de Firebase)",
                "",
                "  O crea usuarios manualmente en Firebase Console → Authentication",
                "  y documentos en Firestore users/{uid} con campo role.",
            ])

    lines.append("")
    lines.append("No compartas este archivo. Está en .gitignore.")
    path.write_text("\n".join(lines), encoding="utf-8")
    return path


def push_github_secrets(values: dict[str, str]) -> tuple[bool, str]:
    """Sube secrets a GitHub con gh CLI si está autenticado."""
    import shutil

    gh = shutil.which("gh")
    if not gh:
        return False, "GitHub CLI (gh) no instalado. Usa github-secrets-commands.txt manualmente."

    check = subprocess.run([gh, "auth", "status"], capture_output=True, text=True)
    if check.returncode != 0:
        return False, "gh no autenticado. Ejecuta: gh auth login"

    ok, errors = validate_production_config(values)
    if not ok:
        return False, "Config inválida: " + "; ".join(errors)

    pushed: list[str] = []
    failed: list[str] = []
    for key in FIREBASE_KEYS + OPTIONAL_KEYS:
        val = values.get(key, "").strip()
        if not val:
            continue
        r = subprocess.run(
            [gh, "secret", "set", key, "--body", val],
            cwd=ROOT,
            capture_output=True,
            text=True,
        )
        if r.returncode == 0:
            pushed.append(key)
        else:
            failed.append(f"{key}: {r.stderr.strip() or r.stdout.strip()}")

    if failed:
        return False, "Algunos secrets fallaron:\n" + "\n".join(failed)
    return True, f"Secrets subidos ({len(pushed)}): {', '.join(pushed)}"


def load_config_file(path: Path | None = None) -> dict[str, str]:
    """Lee firebase-web-config.json o .env en la raíz del proyecto."""
    candidates = [
        path,
        ROOT / "firebase-web-config.json",
        ROOT / "apps" / "admin" / ".env.local",
    ]
    for c in candidates:
        if c and c.is_file():
            if c.suffix == ".json":
                try:
                    return parse_firebase_config(c.read_text(encoding="utf-8"))
                except OSError:
                    continue
            else:
                from .env_manager import parse_env
                return parse_env(c)
    return {}
