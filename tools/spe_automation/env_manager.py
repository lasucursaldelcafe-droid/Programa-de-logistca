from __future__ import annotations

import re
from pathlib import Path

from .config import ENV_APPS, FIREBASE_KEYS, OPTIONAL_KEYS, ROOT


def parse_env(path: Path) -> dict[str, str]:
    if not path.is_file():
        return {}
    out: dict[str, str] = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        s = line.strip()
        if not s or s.startswith("#") or "=" not in s:
            continue
        key, _, value = s.partition("=")
        out[key.strip()] = value.strip()
    return out


def write_env(path: Path, values: dict[str, str], demo_mode: bool = False) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    existing = path.read_text(encoding="utf-8") if path.is_file() else ""
    lines = existing.splitlines() if existing else []
    merged = parse_env(path) if path.is_file() else {}
    merged.update(values)
    merged["VITE_DEMO_MODE"] = "true" if demo_mode else "false"
    merged["VITE_USE_FIREBASE_EMULATORS"] = "false" if not demo_mode else merged.get(
        "VITE_USE_FIREBASE_EMULATORS", "false"
    )

    keys_order = [
        "VITE_DEMO_MODE",
        "VITE_USE_FIREBASE_EMULATORS",
        *FIREBASE_KEYS,
        *OPTIONAL_KEYS,
    ]
    seen: set[str] = set()
    out_lines: list[str] = []

    for raw in lines:
        s = raw.strip()
        if not s or s.startswith("#") or "=" not in s:
            out_lines.append(raw)
            continue
        key = s.split("=", 1)[0].strip()
        if key in merged:
            out_lines.append(f"{key}={merged[key]}")
            seen.add(key)
        else:
            out_lines.append(raw)

    for key in keys_order:
        if key not in seen and key in merged:
            out_lines.append(f"{key}={merged[key]}")
            seen.add(key)

    for key, val in merged.items():
        if key not in seen:
            out_lines.append(f"{key}={val}")

    path.write_text("\n".join(out_lines) + "\n", encoding="utf-8")


def apply_firebase_to_all_apps(firebase: dict[str, str], demo_mode: bool = False) -> list[Path]:
    written: list[Path] = []
    for env_path in ENV_APPS:
        write_env(env_path, firebase, demo_mode=demo_mode)
        written.append(env_path)
    return written


def firebase_status() -> dict[str, object]:
    admin_env = ENV_APPS[0]
    data = parse_env(admin_env)
    missing = [k for k in FIREBASE_KEYS if not data.get(k)]
    placeholder = [k for k in FIREBASE_KEYS if data.get(k) in ("", "demo-api-key", "demo-personal-eventos")]
    return {
        "configured": len(missing) == 0 and len(placeholder) == 0,
        "missing": missing,
        "placeholder": placeholder,
        "demo_mode": data.get("VITE_DEMO_MODE") == "true",
        "env_exists": admin_env.is_file(),
    }


def github_secrets_template(firebase: dict[str, str]) -> str:
    lines = ["# Pegar en GitHub → Settings → Secrets and variables → Actions", ""]
    for key in FIREBASE_KEYS + OPTIONAL_KEYS:
        val = firebase.get(key, "")
        if val:
            lines.append(f"{key}={val}")
    lines.append("")
    lines.append("# O con GitHub CLI (una por una):")
    for key in FIREBASE_KEYS + OPTIONAL_KEYS:
        val = firebase.get(key, "")
        if val:
            safe = val.replace('"', '\\"')
            lines.append(f'gh secret set {key} --body "{safe}"')
    return "\n".join(lines)


def ensure_env_templates() -> None:
    template = """VITE_DEMO_MODE=false
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_USE_FIREBASE_EMULATORS=false
"""
    for p in ENV_APPS:
        if not p.is_file():
            p.write_text(template, encoding="utf-8")
