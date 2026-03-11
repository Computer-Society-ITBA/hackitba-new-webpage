# Solución de Problemas: Autenticación Firebase

## Error: "Unable to detect a Project Id in the current environment"

Este error ocurre cuando el script no puede autenticarse con Firebase. Aquí hay varias soluciones:

---

## ✅ Solución 1: Obtener Credenciales de Servicio (Recomendado para desarrollo local)

### Paso 1: Descargar Credenciales

1. Ve a [Firebase Console](https://console.firebase.google.com)
2. Selecciona tu proyecto: **webpage-36e40**
3. Ve a **Configuración del proyecto** (ícono de engranaje) → **Cuentas de servicio**
4. Haz clic en **Generar nueva clave privada**
5. Descarga el archivo JSON
6. Renómbralo a `service-account-key.json`
7. Colócalo en el directorio `functions/`

### Paso 2: Configurar Variable de Entorno

**En Windows PowerShell:**
```powershell
cd functions
$env:GOOGLE_APPLICATION_CREDENTIALS="$PWD\service-account-key.json"
npm run init-email-templates
```

**En macOS/Linux:**
```bash
cd functions
export GOOGLE_APPLICATION_CREDENTIALS="./service-account-key.json"
npm run init-email-templates
```

### Paso 3: ⚠️ Importante - Seguridad

Añade el archivo a `.gitignore` para no subirlo a Git:

```bash
echo "service-account-key.json" >> .gitignore
```

---

## ✅ Solución 2: Usar Firebase CLI

Si ya estás autenticado con Firebase CLI:

```bash
firebase login
firebase use webpage-36e40
cd functions
npm run init-email-templates
```

---

## ✅ Solución 3: Usar Emulador de Firestore (Para Testing)

Si solo quieres probar localmente sin conectar a producción:

### Paso 1: Iniciar el emulador

```bash
firebase emulators:start --only firestore
```

### Paso 2: En otra terminal

```bash
cd functions
$env:FIRESTORE_EMULATOR_HOST="localhost:8080"
npm run init-email-templates
```

**Nota:** Los datos se guardarán en el emulador local, no en producción.

---

## ✅ Solución 4: Ejecutar desde Firebase Functions Deploy

Alternativamente, puedes crear una función HTTP que inicialice los templates:

```typescript
// En functions/src/index.ts
export const initEmailTemplates = onRequest(async (req, res) => {
  const {initializeTemplates} = await import("./scripts/initEmailTemplates");
  await initializeTemplates();
  res.send("Templates initialized");
});
```

Luego:
```bash
firebase deploy --only functions:initEmailTemplates
# Llamar a la función desde el navegador
```

---

## 📋 Checklist de Verificación

- [ ] ¿Ejecutaste `firebase login`?
- [ ] ¿Confirmaste el proyecto con `firebase use webpage-36e40`?
- [ ] ¿Descargaste las credenciales de servicio?
- [ ] ¿Configuraste `GOOGLE_APPLICATION_CREDENTIALS`?
- [ ] ¿El archivo `service-account-key.json` está en `functions/`?
- [ ] ¿Añadiste `service-account-key.json` al `.gitignore`?

---

## 🚨 Errores Comunes

### "PERMISSION_DENIED"
- Verifica que las credenciales tengan permisos de escritura en Firestore
- Revisa las reglas de seguridad de Firestore

### "Module not found: ts-node"
```bash
cd functions
npm install --save-dev ts-node
```

### "Cannot find module 'firebase-admin'"
```bash
cd functions
npm install
```

---

## 💡 Recomendación

Para desarrollo local, usa **Solución 1** (credenciales de servicio).  
Para producción, ejecuta el script desde Cloud Functions o usa Firebase CLI.
