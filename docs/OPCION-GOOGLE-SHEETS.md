# Opción Google Sheets + Apps Script

Alternativa **sin Firebase** para operar SPE con datos en una hoja de cálculo de Google.

## Cuándo usar esta opción

| Criterio | Firebase | Google Sheets | Demo (navegador) |
|----------|----------|---------------|------------------|
| Costo | Gratis tier limitado | Gratis (Google) | Gratis |
| Setup | Medio (Secrets, Auth) | Bajo (copiar script) | Ninguno |
| Multi-usuario real | ✅ | ✅ (con límites) | ❌ solo local |
| Tiempo real | ✅ Firestore | ⚠️ polling 5–30 s | ✅ instantáneo local |
| Seguridad producción | Alta | Media (token API) | Baja |
| Ideal para | Producción final | MVP / piloto / empresa pequeña | Demos y Pages |

**Recomendación:** usar **Sheets** como puente mientras se configura Firebase, o para pilotos de 1 evento con &lt;50 usuarios concurrentes.

---

## Pasos de despliegue (15 min)

### 1. Crear Google Sheet

1. [Google Sheets](https://sheets.google.com) → Hoja en blanco → nombre: `SPE Backend`
2. Copiar el ID de la URL: `https://docs.google.com/spreadsheets/d/ESTE_ID/edit`

### 2. Apps Script

1. En la hoja: **Extensiones → Apps Script**
2. Pegar contenido de `apps-script/spe-backend/Code.gs`
3. **Propiedades del script** → Añadir `SPE_API_TOKEN` = un token largo aleatorio
4. Ejecutar función `setupSheets` (autorizar permisos)
5. **Implementar → Nueva implementación → Aplicación web**
   - Ejecutar como: **Yo**
   - Acceso: **Cualquiera**
6. Copiar URL de la Web App (termina en `/exec`)

### 3. Configurar la app SPE

En `apps/admin/.env.local` (y GitHub Secrets si aplica):

```env
VITE_DEMO_MODE=false
VITE_USE_FIREBASE_EMULATORS=false
VITE_DATA_BACKEND=sheets
VITE_SHEETS_WEB_APP_URL=https://script.google.com/macros/s/XXXX/exec
VITE_SHEETS_API_TOKEN=tu-token-seguro
```

### 4. Cuentas iniciales (hoja `users`)

| email | password | role |
|-------|----------|------|
| admin@eventos.test | Admin123! | administrador |
| master@eventos.test | Master123! | super_admin |

---

## API del script

Todas las peticiones incluyen `token` y `action`:

| action | Método | Descripción |
|--------|--------|-------------|
| `health` | GET | Estado del backend |
| `login` | POST | `{ email, password }` → usuario |
| `list` | GET | `?collection=workers` |
| `upsert` | POST | `{ collection, record, idField }` |
| `delete` | POST | `{ collection, id, idField }` |

---

## Integración en el código (roadmap)

| Fase | Estado |
|------|--------|
| Script Apps Script + hojas | ✅ Incluido en repo |
| Cliente `packages/shared/src/sheetsClient.ts` | ✅ Scaffold |
| Auth + datos vía Sheets en la app | 🔜 Fase 2 (tras validar piloto) |
| Sincronización Sheets ↔ Firebase | Opcional futuro |

---

## Límites de Google

- Apps Script: ~6 min/ejecución, cuotas diarias de lectura/escritura
- Sheets: ~10 millones celdas por hoja
- No usar para &gt;100 escrituras/minuto sostenidas

Para eventos grandes (200+ trabajadores, mapa en vivo) → migrar a **Firebase**.
