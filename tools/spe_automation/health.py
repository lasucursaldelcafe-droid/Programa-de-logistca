from __future__ import annotations

import json
import shutil
import subprocess
import urllib.error
import urllib.request
from pathlib import Path

from .config import ENV_APPS, INFORME_PDF, PAGES_URL, ROOT, find_chrome, npm_cmd
from .env_manager import firebase_status, parse_env


def check_node() -> tuple[bool, str]:
    npm = shutil.which(npm_cmd().replace(".cmd", "")) or shutil.which("npm")
    if not npm:
        return False, "Node.js / npm no encontrado. Instala desde https://nodejs.org"
    try:
        r = subprocess.run([npm, "-v"], capture_output=True, text=True, timeout=10)
        return True, f"npm {r.stdout.strip()}"
    except Exception as e:
        return False, str(e)


def check_python_deps() -> tuple[bool, str]:
    # tkinter is stdlib; no pip required for core toolkit
    return True, "Python OK (tkinter incluido)"


def check_firebase_env() -> tuple[bool, str]:
    st = firebase_status()
    if st["demo_mode"] and st.get("emulators"):
        return True, "Modo desarrollo: emuladores Firebase (npm run dev:full)"
    if st["demo_mode"]:
        return True, "Modo demo activo en .env.local"
    if st["configured"]:
        return True, "Firebase producción configurado en apps/admin/.env.local"
    missing = st.get("missing", [])
    if missing:
        return False, f"Faltan variables: {', '.join(missing)}"
    return False, "Firebase con valores de prueba — usa SPE Toolkit → Configurar"


def check_site_live() -> tuple[bool, str]:
    try:
        req = urllib.request.Request(PAGES_URL, method="HEAD")
        with urllib.request.urlopen(req, timeout=15) as resp:
            return resp.status < 400, f"Sitio responde HTTP {resp.status}"
    except urllib.error.HTTPError as e:
        return e.code < 500, f"HTTP {e.code}"
    except Exception as e:
        return False, f"No alcanzable: {e}"


def check_artifacts() -> list[tuple[str, bool, str]]:
    items = [
        ("INFORME-REVISION-SPE.pdf", INFORME_PDF.is_file(), str(INFORME_PDF)),
        ("INFORME-REVISION-PRESENTACION.html", (ROOT / "INFORME-REVISION-PRESENTACION.html").is_file(), ""),
        ("REPORTE-FALTANTES-SPE.md", (ROOT / "REPORTE-FALTANTES-SPE.md").is_file(), ""),
        ("package.json", (ROOT / "package.json").is_file(), ""),
    ]
    return [(name, ok, detail) for name, ok, detail in items]


def run_health_report() -> dict[str, object]:
    node_ok, node_msg = check_node()
    fb_ok, fb_msg = check_firebase_env()
    site_ok, site_msg = check_site_live()
    chrome = find_chrome()

    return {
        "node": {"ok": node_ok, "message": node_msg},
        "firebase": {"ok": fb_ok, "message": fb_msg},
        "site": {"ok": site_ok, "message": site_msg},
        "chrome": {"ok": chrome is not None, "message": str(chrome) if chrome else "No encontrado"},
        "artifacts": [{"name": n, "ok": o, "detail": d} for n, o, d in check_artifacts()],
        "env_files": [str(p.relative_to(ROOT)) for p in ENV_APPS if p.is_file()],
    }


def run_npm_script(script: str, timeout: int = 600) -> tuple[int, str]:
    npm = npm_cmd()
    try:
        proc = subprocess.run(
            [npm, "run", script],
            cwd=ROOT,
            capture_output=True,
            text=True,
            timeout=timeout,
            shell=is_windows_shell(),
        )
        out = (proc.stdout or "") + (proc.stderr or "")
        return proc.returncode, out[-8000:] if len(out) > 8000 else out
    except subprocess.TimeoutExpired:
        return 1, f"Tiempo agotado ejecutando npm run {script}"
    except Exception as e:
        return 1, str(e)


def is_windows_shell() -> bool:
    import sys
    return sys.platform.startswith("win")


def save_health_json(path: Path | None = None) -> Path:
    path = path or ROOT / "spe-health-report.json"
    path.write_text(json.dumps(run_health_report(), indent=2, ensure_ascii=False), encoding="utf-8")
    return path
