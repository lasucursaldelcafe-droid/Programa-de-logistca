#!/usr/bin/env python3
"""CLI SPE Automation — usar: python -m tools.spe_automation.cli <comando>"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from tools.spe_automation.credentials import (  # noqa: E402
    load_config_file,
    parse_firebase_config,
    push_github_secrets,
    validate_production_config,
)
from tools.spe_automation.env_manager import (  # noqa: E402
    apply_firebase_to_all_apps,
    ensure_env_templates,
    firebase_status,
    github_secrets_template,
    parse_env,
)
from tools.spe_automation.health import run_health_report, run_npm_script, save_health_json  # noqa: E402
from tools.spe_automation.pdf_export import generate_faltantes_pdf, generate_informe_pdf  # noqa: E402
from tools.spe_automation.setup_full import run_demo_setup, run_production_setup  # noqa: E402
from tools.spe_automation.setup_auto import apply_sheets_bridge, run_auto_production  # noqa: E402


def cmd_auto(args: argparse.Namespace) -> int:
    """Pipeline completo: demo, Firebase producción o Sheets desde PC."""
    if args.demo:
        return cmd_demo(argparse.Namespace(no_install=args.no_install, start=args.start))

    if args.sheets:
        if not args.web_app_url or not args.api_token:
            print("Sheets: --web-app-url y --api-token requeridos")
            print("Ver docs-source/OPCION-GOOGLE-SHEETS.md")
            return 1
        result = apply_sheets_bridge(args.web_app_url, args.api_token)
        print("✓ Backend Sheets configurado:")
        for p in result["env_paths"]:
            print(f"  - {p}")
        print(f"✓ {result['sheets_guide']}")
        return 0

    values: dict[str, str] = {}
    if args.json:
        values = parse_firebase_config(Path(args.json).read_text(encoding="utf-8"))
    elif args.paste:
        values = parse_firebase_config(args.paste)
    else:
        values = load_config_file()

    result = run_auto_production(
        values or None,
        push_github=args.push_github,
        seed=args.seed,
        deploy_rules=not args.no_deploy_rules,
    )
    if not result.get("ok"):
        print("✗ No se pudo configurar producción:")
        for e in result.get("errors", []):
            print(f"  - {e}")
        print("\nDesde PC: pega firebaseConfig en firebase-web-config.json y repite.")
        return 1

    print("✓ Configuración automática producción:")
    for p in result["env_paths"]:
        print(f"  - {p}")
    print(f"✓ Checklist: {result['checklist']}")
    print(f"✓ GitHub: {result['github_template']}")
    if args.push_github:
        mark = "✓" if result["github_push_ok"] else "✗"
        print(f"{mark} Secrets: {result['github_push_message']}")
    if args.seed:
        mark = "✓" if result["seed_ok"] else "✗"
        print(f"{mark} Seed: {result['seed_message'][:200]}")
    for step in result["next_steps"]:
        print(f"  → {step}")
    return 0


def cmd_setup(_: argparse.Namespace) -> int:
    ensure_env_templates()
    code, out = run_npm_script("setup")
    print(out)
    print("\n✓ Plantillas .env.local creadas.")
    print("  Siguiente: spe-cli demo   (desarrollo local)")
    print("         o: spe-cli firebase --interactive   (producción)")
    return code


def cmd_demo(args: argparse.Namespace) -> int:
    """Configura emuladores + cuentas de prueba (desarrollo 100%)."""
    result = run_demo_setup(install_deps=not args.no_install)
    print("✓ Modo desarrollo configurado en:")
    for p in result["env_paths"]:
        print(f"  - {p}")
    if result.get("credentials_file"):
        print(f"\n✓ Credenciales guardadas: {result['credentials_file']}")
    print("\nCuentas (tras npm run dev:full):")
    for acc in result["accounts"]:
        print(f"  {acc['email']} / {acc['password']}  ({acc['role']})")
    print("\nSiguiente paso:")
    print("  npm run dev:full")
    if args.start:
        print("\n> Iniciando dev:full…")
        code, out = run_npm_script("dev:full", timeout=3600)
        print(out)
        return code
    return result.get("npm_code", 0)


def cmd_init(args: argparse.Namespace) -> int:
    """Configuración completa: demo o producción desde JSON/archivo."""
    if args.demo:
        return cmd_demo(argparse.Namespace(no_install=args.no_install, start=args.start))

    values: dict[str, str] = {}
    if args.json:
        values = parse_firebase_config(Path(args.json).read_text(encoding="utf-8"))
    elif args.paste:
        values = parse_firebase_config(args.paste)
    else:
        values = load_config_file()

    if not values:
        print("No hay configuración. Usa --demo, --json archivo.json o pega config en firebase-web-config.json")
        return 1

    result = run_production_setup(values, push_gh=args.push_github, install_deps=not args.no_install)
    if not result.get("ok"):
        print("✗ Errores:")
        for e in result.get("errors", []):
            print(f"  - {e}")
        return 1

    print("✓ Producción configurada:")
    for p in result["env_paths"]:
        print(f"  - {p}")
    print(f"✓ Plantilla GitHub: {result['github_template']}")
    print(f"✓ Credenciales: {result['credentials_file']}")
    if args.push_github:
        mark = "✓" if result["github_push_ok"] else "✗"
        print(f"{mark} GitHub Secrets: {result['github_push_message']}")
    for step in result["next_steps"]:
        print(f"  → {step}")
    return 0


def cmd_firebase(args: argparse.Namespace) -> int:
    ensure_env_templates()
    if args.demo:
        return cmd_demo(argparse.Namespace(no_install=False, start=False))

    if args.interactive:
        print("=== Configuración Firebase SPE (producción) ===\n")
        keys = [
            ("VITE_FIREBASE_API_KEY", "API Key"),
            ("VITE_FIREBASE_AUTH_DOMAIN", "Auth Domain"),
            ("VITE_FIREBASE_PROJECT_ID", "Project ID"),
            ("VITE_FIREBASE_STORAGE_BUCKET", "Storage Bucket"),
            ("VITE_FIREBASE_MESSAGING_SENDER_ID", "Messaging Sender ID"),
            ("VITE_FIREBASE_APP_ID", "App ID"),
            ("VITE_FIREBASE_VAPID_KEY", "VAPID Key (opcional)"),
        ]
        values: dict[str, str] = {}
        for key, label in keys:
            val = input(f"{label}: ").strip()
            if val:
                values[key] = val
    elif args.from_file:
        if Path(args.from_file).suffix == ".json":
            values = parse_firebase_config(Path(args.from_file).read_text(encoding="utf-8"))
        else:
            values = parse_env(Path(args.from_file))
    else:
        env_file = ROOT / "apps" / "admin" / ".env.local"
        values = parse_env(env_file)

    if not values:
        print("No hay valores. Usa --interactive, --from-file o --demo")
        return 1

    ok, errors = validate_production_config(values)
    if not ok:
        print("✗ Configuración inválida:")
        for e in errors:
            print(f"  - {e}")
        return 1

    result = run_production_setup(values, push_gh=args.push_github)
    for p in result["env_paths"]:
        print(f"✓ {p}")
    print(f"✓ {result['github_template']}")
    return 0


def cmd_secrets(args: argparse.Namespace) -> int:
    values = parse_env(ROOT / "apps" / "admin" / ".env.local")
    if args.json:
        values = parse_firebase_config(Path(args.json).read_text(encoding="utf-8"))
    ok, msg = push_github_secrets(values)
    print(msg)
    if not ok:
        tpl = ROOT / "github-secrets-commands.txt"
        tpl.write_text(github_secrets_template(values), encoding="utf-8")
        print(f"Plantilla manual: {tpl}")
    return 0 if ok else 1


def cmd_status(_: argparse.Namespace) -> int:
    st = firebase_status()
    print(json.dumps(st, indent=2, ensure_ascii=False))
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
    parser = argparse.ArgumentParser(
        description="SPE Automation Toolkit — credenciales, PDF, desarrollo"
    )
    sub = parser.add_subparsers(dest="command", required=True)

    p_auto = sub.add_parser(
        "auto",
        help="Pipeline completo (demo / Firebase / Sheets) — sin celular",
    )
    p_auto.add_argument("--demo", action="store_true", help="Emuladores locales")
    p_auto.add_argument("--json", help="firebase-web-config.json")
    p_auto.add_argument("--paste", help="Snippet firebaseConfig")
    p_auto.add_argument("--sheets", action="store_true", help="Backend Google Sheets")
    p_auto.add_argument("--web-app-url", help="URL Apps Script /exec")
    p_auto.add_argument("--api-token", help="SPE_API_TOKEN del script")
    p_auto.add_argument("--push-github", action="store_true")
    p_auto.add_argument("--seed", action="store_true", help="Crear cuentas con service-account.json")
    p_auto.add_argument("--no-deploy-rules", action="store_true")
    p_auto.add_argument("--no-install", action="store_true")
    p_auto.add_argument("--start", action="store_true")
    p_auto.set_defaults(func=cmd_auto)

    p_setup = sub.add_parser("setup", help="Crear .env.local + npm install")
    p_setup.set_defaults(func=cmd_setup)

    p_demo = sub.add_parser("demo", help="Desarrollo local 100% (emuladores + cuentas)")
    p_demo.add_argument("--no-install", action="store_true")
    p_demo.add_argument("--start", action="store_true", help="Lanzar dev:full al terminar")
    p_demo.set_defaults(func=cmd_demo)

    p_init = sub.add_parser("init", help="Configuración completa demo o producción")
    p_init.add_argument("--demo", action="store_true", help="Modo emuladores")
    p_init.add_argument("--json", help="firebase-web-config.json")
    p_init.add_argument("--paste", help="Snippet JSON de Firebase Console")
    p_init.add_argument("--push-github", action="store_true", help="Subir secrets con gh CLI")
    p_init.add_argument("--no-install", action="store_true")
    p_init.add_argument("--start", action="store_true")
    p_init.set_defaults(func=cmd_init)

    p_fb = sub.add_parser("firebase", help="Configurar Firebase producción")
    p_fb.add_argument("-i", "--interactive", action="store_true")
    p_fb.add_argument("-f", "--from-file", help=".env o firebase-web-config.json")
    p_fb.add_argument("--demo", action="store_true", help="Modo emuladores")
    p_fb.add_argument("--push-github", action="store_true")
    p_fb.set_defaults(func=cmd_firebase)

    p_sec = sub.add_parser("secrets", help="Subir VITE_FIREBASE_* a GitHub")
    p_sec.add_argument("--json", help="Leer desde JSON")
    p_sec.set_defaults(func=cmd_secrets)

    p_st = sub.add_parser("status", help="Estado Firebase actual")
    p_st.set_defaults(func=cmd_status)

    p_pdf = sub.add_parser("pdf", help="Generar PDF de informes")
    p_pdf.add_argument("--faltantes", action="store_true")
    p_pdf.set_defaults(func=cmd_pdf)

    p_h = sub.add_parser("health", help="Diagnóstico del proyecto")
    p_h.set_defaults(func=cmd_health)

    p_run = sub.add_parser("run", help="Ejecutar script npm")
    p_run.add_argument("script")
    p_run.add_argument("--timeout", type=int, default=600)
    p_run.set_defaults(func=cmd_run)

    args = parser.parse_args()
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main())
