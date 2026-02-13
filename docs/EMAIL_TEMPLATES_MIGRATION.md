# Migración a Templates de Email en Firestore

## 🎯 ¿Qué cambió?

Los templates de email ahora se cargan desde Firestore en lugar de estar hardcodeados en el código. Esto permite editar los textos de los emails sin necesidad de redesplegar el código.

**Base de datos:** Los templates se almacenan en la base de datos **hackitba** de Firestore.

## 🚀 Inicio Rápido

### Prerequisitos

Asegúrate de estar autenticado con Firebase:

```bash
firebase login
```

### 1. Inicializar Templates en Firestore

Ejecuta el siguiente comando desde el directorio raíz del proyecto:

```bash
# Opción 1: Usando Firebase CLI (Recomendado)
firebase use webpage-36e40
cd functions
npm run init-email-templates
# o manualmente:
npx ts-node src/scripts/initEmailTemplates.ts
```

Si obtienes un error de autenticación, prueba:

```bash
# Opción 2: Configurar credenciales
# Descarga las credenciales de servicio desde Firebase Console
# Colócalas en: functions/service-account-key.json
# Luego ejecuta:
export GOOGLE_APPLICATION_CREDENTIALS="./service-account-key.json"
npx ts-node src/scripts/initEmailTemplates.ts
```

**Windows PowerShell:**
```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS=".\service-account-key.json"
npx ts-node src/scripts/initEmailTemplates.ts
```

Este comando creará automáticamente en Firestore todos los templates de email con los contenidos actuales.

### 2. Verificar en Firebase Console

1. Abre [Firebase Console](https://console.firebase.google.com)
2. Ve a Firestore Database
3. **Selecciona la base de datos: hackitba** (no la default)
4. Busca la colección `emailTemplates`
5. Deberías ver 7 documentos (templates)

### 3. ¡Listo para usar!

El servicio de email ya está configurado para usar los templates de Firestore. No necesitas hacer nada más.

## 📝 Templates Creados

El script crea los siguientes templates:

- ✅ `welcome` - Email de bienvenida
- ✅ `eventConfirmation` - Confirmación de registro al evento
- ✅ `emailVerification` - Verificación de email
- ✅ `passwordReset` - Reseteo de contraseña
- ✅ `teamNotification_joined` - Nuevo miembro en equipo
- ✅ `teamNotification_removed` - Miembro removido de equipo
- ✅ `teamNotification_updated` - Equipo actualizado

## ✏️ Editar Templates

### Opción 1: Desde Firebase Console (Recomendado)

1. Abre Firebase Console → Firestore
2. Navega a `emailTemplates` → selecciona el template
3. Edita los campos `subject` o `html`
4. Guarda los cambios

**Los cambios son inmediatos**, no necesitas redesplegar.

### Opción 2: Programáticamente

```typescript
import admin from "firebase-admin";

await admin.firestore()
  .collection("emailTemplates")
  .doc("welcome")
  .update({
    subject: "Nuevo asunto",
    html: "<div>Nuevo contenido {{name}}</div>"
  });
```

## 🔧 Variables Disponibles

Los templates usan la sintaxis `{{variable}}` para contenido dinámico.

**Ejemplo:**
```html
<h2>¡Hola {{name}}!</h2>
<a href="{{dashboardUrl}}">Ver Dashboard</a>
```

Variables comunes:
- `{{name}}` - Nombre del usuario
- `{{dashboardUrl}}` - URL al dashboard
- `{{appUrl}}` - URL base de la aplicación
- `{{teamName}}` - Nombre del equipo
- `{{verificationLink}}` - Link de verificación
- `{{resetLink}}` - Link de reseteo de contraseña

Ver [EMAIL_TEMPLATES_GUIDE.md](./EMAIL_TEMPLATES_GUIDE.md) para la lista completa de variables por template.

## 📚 Documentación Completa

Para más información sobre estructura de templates, mejores prácticas y solución de problemas, consulta:

👉 [EMAIL_TEMPLATES_GUIDE.md](./EMAIL_TEMPLATES_GUIDE.md)

## ⚠️ Importante

- **Siempre ejecuta el script de inicialización** en cada ambiente (dev, staging, production)
- **Haz backup** antes de modificar templates importantes
- **Prueba los emails** después de hacer cambios

## 🐛 Solución de Problemas

### Error: "Unable to detect a Project Id in the current environment"

Este error indica que falta autenticación con Firebase. **Solución rápida:**

1. **Descarga credenciales de servicio:**
   - Ve a [Firebase Console](https://console.firebase.google.com) → proyecto **webpage-36e40**
   - **Configuración** → **Cuentas de servicio** → **Generar nueva clave privada**
   - Guarda el archivo como `functions/service-account-key.json`

2. **Configura la variable de entorno:**
   ```powershell
   # Windows PowerShell
   cd functions
   $env:GOOGLE_APPLICATION_CREDENTIALS="$PWD\service-account-key.json"
   npm run init-email-templates
   ```

3. **⚠️ Añade a .gitignore:**
   ```bash
   echo "service-account-key.json" >> functions/.gitignore
   ```

📚 **Guía completa:** Ver [FIREBASE_AUTH_TROUBLESHOOTING.md](./FIREBASE_AUTH_TROUBLESHOOTING.md)

### Error: "Email template X not found"

**Solución:** Ejecuta el script de inicialización:
```bash
cd functions
npx ts-node src/scripts/initEmailTemplates.ts
```

### Variables no se reemplazan

**Solución:** Verifica que:
1. La sintaxis sea `{{variable}}` (doble llave)
2. El nombre de la variable coincida exactamente
3. La variable esté siendo pasada en el código

## 📞 Soporte

Para dudas o problemas, consulta la [documentación completa](./EMAIL_TEMPLATES_GUIDE.md) o revisa el código en:

- Service: `functions/src/services/emailService.ts`
- Script: `functions/src/scripts/initEmailTemplates.ts`
