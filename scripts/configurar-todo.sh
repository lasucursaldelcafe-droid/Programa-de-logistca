#!/usr/bin/env bash
# SPE — Configuración automática completa (Linux / macOS)
# Uso: ./scripts/configurar-todo.sh [demo|produccion|sheets]
set -euo pipefail
cd "$(dirname "$0")/.."

MODE="${1:-demo}"

echo "============================================"
echo "  SPE - Configuración automática"
echo "  Modo: $MODE"
echo "============================================"
echo

if ! command -v node >/dev/null 2>&1; then
  echo "ERROR: Instala Node.js 20+ desde https://nodejs.org/"
  exit 1
fi

case "$MODE" in
  demo)
    echo "[1/2] Desarrollo local (emuladores + cuentas demo)..."
    npm run setup:auto
    ;;
  produccion|production)
    if [[ ! -f firebase-web-config.json ]]; then
      echo "ERROR: Falta firebase-web-config.json"
      echo
      echo "Desde PC (sin celular):"
      echo "  1. https://console.firebase.google.com"
      echo "  2. Configuración → App web → copiar firebaseConfig"
      echo "  3. Guardar como firebase-web-config.json (ver firebase-web-config.example.json)"
      echo "  4. ./scripts/configurar-todo.sh produccion"
      exit 1
    fi
    echo "[1/2] Producción Firebase..."
    npm run setup:auto -- --production --seed
    ;;
  sheets)
    echo "Backend Sheets — necesitas URL de Apps Script y token."
    read -rp "URL Web App (/exec): " SHEETS_URL
    read -rp "SPE_API_TOKEN: " SHEETS_TOKEN
    npm run setup:auto -- --sheets --web-app-url "$SHEETS_URL" --api-token "$SHEETS_TOKEN"
    ;;
  *)
    echo "Uso: $0 [demo|produccion|sheets]"
    exit 1
    ;;
esac

echo
echo "[2/2] Listo."
if [[ -f CREDENCIALES-SPE.txt ]]; then
  echo "Ver: CREDENCIALES-SPE.txt"
fi
if [[ -f CHECKLIST-PRODUCCION.txt ]]; then
  echo "Ver: CHECKLIST-PRODUCCION.txt"
fi
echo
if [[ "$MODE" == "demo" ]]; then
  echo "Siguiente: npm run dev:full"
  echo "Login: admin@eventos.test / Admin123!"
else
  echo "Siguiente: npm run toolkit:secrets  (GitHub Pages)"
  echo "           npm start  (probar local)"
fi
