from __future__ import annotations

import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

ENV_APPS = [
    ROOT / "apps" / "admin" / ".env.local",
    ROOT / "apps" / "worker" / ".env.local",
    ROOT / "apps" / "master" / ".env.local",
]

FIREBASE_KEYS = [
    "VITE_FIREBASE_API_KEY",
    "VITE_FIREBASE_AUTH_DOMAIN",
    "VITE_FIREBASE_PROJECT_ID",
    "VITE_FIREBASE_STORAGE_BUCKET",
    "VITE_FIREBASE_MESSAGING_SENDER_ID",
    "VITE_FIREBASE_APP_ID",
]

OPTIONAL_KEYS = ["VITE_FIREBASE_VAPID_KEY"]

PAGES_URL = os.environ.get(
    "SPE_PAGES_URL",
    "https://lasucursaldelcafe-droid.github.io/Programa-de-logistca/",
)

INFORME_HTML = ROOT / "INFORME-REVISION-PRESENTACION.html"
INFORME_PDF = ROOT / "INFORME-REVISION-SPE.pdf"
FALTANTES_MD = ROOT / "REPORTE-FALTANTES-SPE.md"

CHROME_PATHS_WINDOWS = [
    Path(r"C:\Program Files\Google\Chrome\Application\chrome.exe"),
    Path(r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"),
    Path(r"C:\Program Files\Microsoft\Edge\Application\msedge.exe"),
]

CHROME_PATHS_LINUX = [
    Path("/usr/bin/google-chrome"),
    Path("/usr/bin/google-chrome-stable"),
    Path("/usr/bin/chromium"),
    Path("/usr/bin/chromium-browser"),
]


def is_windows() -> bool:
    return sys.platform.startswith("win")


def find_chrome() -> Path | None:
    paths = CHROME_PATHS_WINDOWS if is_windows() else CHROME_PATHS_LINUX
    for p in paths:
        if p.is_file():
            return p
    return None


def npm_cmd() -> str:
    return "npm.cmd" if is_windows() else "npm"
