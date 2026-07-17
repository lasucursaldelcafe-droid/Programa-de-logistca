"""Configuración completa: demo local o producción."""
from __future__ import annotations

from pathlib import Path

from .config import ROOT
from .credentials import (
    DEMO_ACCOUNTS,
    apply_demo_emulator_config,
    apply_production_config,
    push_github_secrets,
    write_credentials_file,
)
from .env_manager import ensure_env_templates, github_secrets_template
from .health import run_npm_script


def run_demo_setup(install_deps: bool = True, write_readme: bool = True) -> dict[str, object]:
    """Configura emuladores + .env en 3 apps para desarrollo local al 100%."""
    ensure_env_templates()
    paths = apply_demo_emulator_config()
    cred_path = write_credentials_file("desarrollo_emuladores") if write_readme else None

    npm_code = 0
    npm_out = ""
    if install_deps:
        npm_code, npm_out = run_npm_script("setup", timeout=300)

    return {
        "mode": "demo",
        "env_paths": [str(p) for p in paths],
        "credentials_file": str(cred_path) if cred_path else None,
        "accounts": DEMO_ACCOUNTS,
        "npm_code": npm_code,
        "npm_output": npm_out,
        "next_steps": [
            "npm run dev:full",
            "Login: admin@eventos.test / Admin123!",
            "Login: master@eventos.test / Master123!",
        ],
    }


def run_production_setup(
    values: dict[str, str],
    push_gh: bool = False,
    install_deps: bool = True,
) -> dict[str, object]:
    """Valida, escribe .env producción y opcionalmente sube GitHub Secrets."""
    ensure_env_templates()
    paths, errors = apply_production_config(values)
    if errors:
        return {"ok": False, "errors": errors}

    tpl_path = ROOT / "github-secrets-commands.txt"
    tpl_path.write_text(github_secrets_template(values), encoding="utf-8")
    cred_path = write_credentials_file("produccion")

    gh_ok, gh_msg = (False, "No solicitado")
    if push_gh:
        gh_ok, gh_msg = push_github_secrets(values)

    npm_code = 0
    if install_deps:
        npm_code, _ = run_npm_script("setup", timeout=300)

    return {
        "ok": True,
        "env_paths": [str(p) for p in paths],
        "github_template": str(tpl_path),
        "credentials_file": str(cred_path),
        "github_push_ok": gh_ok,
        "github_push_message": gh_msg,
        "npm_code": npm_code,
        "next_steps": [
            "npm start  (desarrollo con Firebase real)",
            "Sube secrets a GitHub si aún no: gh auth login && toolkit secrets",
            "Crea cuentas: npm run seed:production -- --service-account ruta.json",
        ],
    }
