#!/usr/bin/env python3
"""CLI SPE Automation — usar: python -m tools.spe_automation.cli <comando>"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

# Permitir ejecutar desde raíz del repo
ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from tools.spe_automation.env_manager import (  # noqa: E402
    apply_firebase_to_all_apps,
    ensure_env_templates,
    firebase_status,
    github_secrets_template,
    parse_env,
)
from tools.spe_automation.health import run_health_report, run_npm_script, save_health_json  # noqa: E402
from tools.spe_automation.pdf_export import (  # noqa: E402
    generate_faltantes_pdf,
    generate_informe_pdf,
)


def cmd_setup(_: argparse.Namespace) -> int:
    ensure_env_templates()
    code, out = run_npm_script("setup")
    print(out)
    print("\n✓ Plantillas .env.local creadas. Usa 'firebase' para pegar credenciales.")
    return code


def cmd_firebase(args: argparse.Namespace) -> int:
    ensure_env_templates()
    if args.interactive:
        print("=== Configuración Firebase SPE ===\n")
        keys = [
            ("VITE_FIREBASE_API_KEY", "API Key"),
            ("VITE_FIREBASE_AUTH_DOMAIN", "Auth Domain"),
            ("VITE_FIREBASE_PROJECT_ID", "Project ID"),
            ("VITE_FIREBASE_STORAGE_BUCKET", "Storage Bucket"),
            ("VITE_FIREBASE_MESSAGING_SENDER_ID", "Messaging Sender ID"),
            ("VITE_FIREBASE_APP_ID", "App ID"),
            ("VITE_FIREBASE_VAPID_KEY", "VAPID Key (opcional, Enter para omitir)"),
        ]
        values: dict[str, str] = {}
        for key, label in keys:
            val = input(f"{label}: ").strip()
            if val:
                values[key] = val
        demo = input("¿Modo demo? (s/N): ").strip().lower() in ("s", "si", "y", "yes")
    else:
        env_file = Path(args.from_file) if args.from_file else ROOT / "apps" / "admin" / ".env.local"
        values = parse_env(env_file)
        demo = args.demo

    if not values and not demo:
        print("No hay valores. Usa --interactive o --from-file")
        return 1

    paths = apply_firebase_to_all_apps(values, demo_mode=demo)
    print("✓ Guardado en:")
    for p in paths:
        print(f"  - {p}")
    if not demo and values:
        tpl = ROOT / "github-secrets-commands.txt"
        tpl.write_text(github_secrets_template(values), encoding="utf-8")
        print(f"\n✓ Comandos GitHub Secrets: {tpl}")
    return 0


def cmd_pdf(args: argparse.Namespace) -> int:
    if args.faltantes:
        ok, msg = generate_faltantes_pdf()
    else:
        ok, msg = generate_informe_pdf()
    print(msg)
    return 0 if ok else 1


def cmd_health(_: argparse.Namespace) -> int:
    report = run_health_report()
    for section in ("node", "firebase", "site", "chrome"):
        r = report[section]
        mark = "✓" if r["ok"] else "✗"
        print(f"{mark} {section}: {r['message']}")
    print("\nArtefactos:")
    for a in report["artifacts"]:
        mark = "✓" if a["ok"] else "○"
        print(f"  {mark} {a['name']}")
    path = save_health_json()
    print(f"\nJSON: {path}")
    return 0


def cmd_run(args: argparse.Namespace) -> int:
    code, out = run_npm_script(args.script, timeout=args.timeout)
    print(out)
    return code


def main() -> int:
    parser = argparse.ArgumentParser(description="SPE Automation Toolkit")
    sub = parser.add_subparsers(dest="command", required=True)

    p_setup = sub.add_parser("setup", help="Crear .env.local + npm install")
    p_setup.set_defaults(func=cmd_setup)

    p_fb = sub.add_parser("firebase", help="Configurar Firebase en las 3 apps")
    p_fb.add_argument("-i", "--interactive", action="store_true", help="Asistente interactivo")
    p_fb.add_argument("-f", "--from-file", help="Leer desde archivo .env")
    p_fb.add_argument("--demo", action="store_true", help="Activar modo demo")
    p_fb.set_defaults(func=cmd_firebase)

    p_pdf = sub.add_parser("pdf", help="Generar PDF de informes")
    p_pdf.add_argument("--faltantes", action="store_true", help="Reporte de faltantes")
    p_pdf.set_defaults(func=cmd_pdf)

    p_h = sub.add_parser("health", help="Diagnóstico del proyecto")
    p_h.set_defaults(func=cmd_health)

    p_run = sub.add_parser("run", help="Ejecutar script npm")
    p_run.add_argument("script", help="Nombre del script npm")
    p_run.add_argument("--timeout", type=int, default=600)
    p_run.set_defaults(func=cmd_run)

    args = parser.parse_args()
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main())
