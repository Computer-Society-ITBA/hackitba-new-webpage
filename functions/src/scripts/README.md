# Scripts de Email Templates

Este directorio contiene scripts para gestionar los templates de email en Firestore (**base de datos: hackitba**).

## 📜 Scripts Disponibles

### `initEmailTemplates.ts`
Inicializa todos los templates de email en la base de datos **hackitba** de Firestore.

**Uso:**
```bash
npm run init-email-templates
```

**Qué hace:**
- Crea la colección `emailTemplates` en Firestore
- Añade 7 templates predefinidos con contenido HTML
- Incluye campos: `subject`, `html`, `description`, `variables`

---

### `testEmailTemplates.ts`
Verifica que todos los templates estén correctamente configurados.

**Uso:**
```bash
npm run test-email-templates
```

**Qué verifica:**
- Existencia de todos los templates esperados
- Validación de campos requeridos
- Consistencia entre variables declaradas y usadas
- Genera preview de ejemplo

---

## 🔐 Configuración de Autenticación

Estos scripts necesitan autenticación con Firebase. Hay tres opciones:

### Opción 1: Credenciales de Servicio (Recomendado)

1. Descarga credenciales desde [Firebase Console](https://console.firebase.google.com)
2. Guárdalas como `service-account-key.json` en el directorio `functions/`
3. Configura la variable de entorno:

**Windows:**
```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS="$PWD\service-account-key.json"
npm run init-email-templates
```

**macOS/Linux:**
```bash
export GOOGLE_APPLICATION_CREDENTIALS="./service-account-key.json"
npm run init-email-templates
```

### Opción 2: Firebase CLI

```bash
firebase login
firebase use webpage-36e40
npm run init-email-templates
```

### Opción 3: Emulador (Testing)

```bash
# Terminal 1
firebase emulators:start --only firestore

# Terminal 2
$env:FIRESTORE_EMULATOR_HOST="localhost:8080"
npm run init-email-templates
```

---

## 🆘 Troubleshooting

Si ves el error:
```
Error: Unable to detect a Project Id in the current environment
```

👉 Consulta [FIREBASE_AUTH_TROUBLESHOOTING.md](../../docs/FIREBASE_AUTH_TROUBLESHOOTING.md)

---

## 📚 Documentación

- [EMAIL_TEMPLATES_MIGRATION.md](../../docs/EMAIL_TEMPLATES_MIGRATION.md) - Guía de inicio rápido
- [EMAIL_TEMPLATES_GUIDE.md](../../docs/EMAIL_TEMPLATES_GUIDE.md) - Documentación completa
- [FIREBASE_AUTH_TROUBLESHOOTING.md](../../docs/FIREBASE_AUTH_TROUBLESHOOTING.md) - Solución de problemas

---

## ⚠️ Importante

- **NUNCA** comitees `service-account-key.json` a Git
- El archivo ya está en `.gitignore`
- Usa credenciales diferentes para dev/staging/production
