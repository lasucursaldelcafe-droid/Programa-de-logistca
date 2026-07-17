# Reporte de faltantes — SPE (actualizado 17 jul 2026)

## Cambios desde el reporte anterior (7 jul)

| Tema | Antes | Ahora |
|------|-------|-------|
| Login GitHub Pages | ❌ Bloqueado | ⚠️ Fix en PR #21 (modo demo auto) |
| SPE Toolkit Windows | No existía | ✅ PR #20 mergeado |
| Google Sheets backend | No evaluado | ✅ Script + docs + cliente |
| Visual login/shell | Base | ✅ Mejorado (gradiente, UX demo) |
| Pruebas CI locales | — | ✅ build, nav, flows, smoke OK |

---

## Bloqueadores restantes

1. **Merge PR #21** para que Pages permita login demo
2. **Elegir backend producción:**
   - Firebase Secrets (ver `PRODUCCION-FIREBASE.md`)
   - Google Sheets (ver `OPCION-GOOGLE-SHEETS.md`)
3. **Release Win/Android** — requiere Firebase Secrets en CI

---

## Qué ya funciona

- Desarrollo local: `npm run dev:full`
- Build: `npm run build` / `build:pages`
- Navegación y flujos demo verificados
- Toolkit: `npm run toolkit:demo`, GUI Windows
- Documentación: informe, guías, Apps Script

---

## Checklist configuración

```
[ ] Merge PR #21 (login Pages)
[ ] Opción A: Firebase Secrets en GitHub
[ ] Opción B: Google Sheet + Apps Script desplegado
[ ] npm run seed:production (si Firebase)
[ ] Verificar login en sitio publicado
[ ] npm run electron:build / cap:sync (cuando CI pase)
```

Ver informe completo: `INFORME-VERIFICACION-JUL2026.md`
