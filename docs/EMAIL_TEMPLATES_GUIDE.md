# Guía de Templates de Email

Este documento explica cómo funcionan los templates de email almacenados en Firestore.

## Descripción General

Los templates de email están ahora almacenados en Firestore (**base de datos: hackitba**) en lugar de estar hardcodeados en el código. Esto permite:

- ✅ **Edición sin deployment**: Modifica los emails sin necesidad de redesplegar el código
- ✅ **Control centralizado**: Gestiona todos los templates desde Firestore
- ✅ **Multilenguaje**: Fácil de extender para soportar múltiples idiomas
- ✅ **Versionado**: Historial de cambios en los templates

## Estructura de la Colección

Los templates se almacenan en la colección `emailTemplates` de Firestore. Cada documento representa un template específico.

### Estructura de un Template

```typescript
{
  subject: string,          // Asunto del email (puede contener variables)
  html: string,            // Contenido HTML (puede contener variables)
  description: string,     // Descripción del propósito del template
  variables: string[],     // Lista de variables disponibles
  createdAt: Timestamp,    // Fecha de creación
  updatedAt: Timestamp     // Fecha de última modificación
}
```

### Variables en los Templates

Las variables se definen usando la sintaxis `{{nombreVariable}}` y son reemplazadas dinámicamente cuando se envía el email.

**Ejemplo:**
```html
<h2>¡Hola {{name}}!</h2>
<a href="{{dashboardUrl}}">Ir al Dashboard</a>
```

## Templates Disponibles

### 1. `welcome`
**Propósito:** Email de bienvenida para nuevos usuarios registrados

**Variables:**
- `name`: Nombre del usuario
- `dashboardUrl`: URL al dashboard
- `appUrl`: URL base de la aplicación

---

### 2. `eventConfirmation`
**Propósito:** Confirmación de registro al evento

**Variables:**
- `name`: Nombre del participante
- `roleText`: Rol del participante (Participante, Juez, Mentor, Colaborador)
- `dashboardUrl`: URL específica según el rol
- `participantFeatures`: HTML adicional para participantes
- `appUrl`: URL base de la aplicación

---

### 3. `emailVerification`
**Propósito:** Verificación de dirección de correo electrónico

**Variables:**
- `verificationLink`: Link de verificación único
- `appUrl`: URL base de la aplicación

---

### 4. `passwordReset`
**Propósito:** Reseteo de contraseña

**Variables:**
- `resetLink`: Link único para resetear contraseña
- `appUrl`: URL base de la aplicación

---

### 5. `teamNotification_joined`
**Propósito:** Notificación cuando un miembro se une al equipo

**Variables:**
- `name`: Nombre del nuevo miembro
- `teamName`: Nombre del equipo
- `dashboardUrl`: URL al dashboard del equipo
- `appUrl`: URL base de la aplicación

---

### 6. `teamNotification_removed`
**Propósito:** Notificación cuando un miembro es removido del equipo

**Variables:**
- `name`: Nombre del miembro removido
- `teamName`: Nombre del equipo
- `dashboardUrl`: URL al dashboard del equipo
- `appUrl`: URL base de la aplicación

---

### 7. `teamNotification_updated`
**Propósito:** Notificación cuando el equipo es actualizado

**Variables:**
- `name`: Nombre relacionado
- `teamName`: Nombre del equipo
- `details`: Detalles de la actualización
- `dashboardUrl`: URL al dashboard del equipo
- `appUrl`: URL base de la aplicación

## Inicialización de Templates

### Opción 1: Usando el Script de Inicialización

Ejecuta el siguiente comando desde el directorio `functions`:

```bash
cd functions
npx ts-node src/scripts/initEmailTemplates.ts
```

Este script creará automáticamente todos los templates en Firestore con los valores por defecto.

### Opción 2: Creación Manual en Firestore Console

1. Abre Firestore Console en Firebase
2. Navega o crea la colección `emailTemplates`
3. Crea un nuevo documento con el ID del template (ej: `welcome`)
4. Añade los campos: `subject`, `html`, `description`, `variables`
5. Guarda el documento

## Editar Templates

### Desde Firestore Console

1. Abre [Firebase Console](https://console.firebase.google.com)
2. Navega a Firestore Database
3. **Selecciona la base de datos: hackitba** (desplegable arriba)
4. Busca la colección `emailTemplates`
5. Selecciona el template que deseas editar
6. Modifica los campos `subject` o `html`
7. Guarda los cambios

**✨ Los cambios son inmediatos, no requieren redeploy**

### Usando Scripts

```typescript
import admin from "firebase-admin";

admin.firestore()
  .collection("emailTemplates")
  .doc("welcome")
  .update({
    subject: "Nuevo asunto",
    html: "<div>Nuevo contenido {{name}}</div>",
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
```

## Mejores Prácticas

### 1. **Mantén las variables documentadas**
Siempre actualiza el campo `variables` cuando añadas o elimines variables del template.

### 2. **Usa nombres descriptivos**
Los IDs de templates deben ser descriptivos: `passwordReset` en lugar de `template1`.

### 3. **Prueba antes de usar en producción**
Envía emails de prueba después de modificar templates.

### 4. **Mantén un backup**
Exporta los templates periódicamente:

```bash
# Desde el directorio del proyecto
firebase firestore:export gs://your-bucket/email-templates-backup
```

### 5. **Versiona templates importantes**
Para templates críticos, considera crear copias antes de modificarlos:

```typescript
// Duplicar template antes de modificar
const currentTemplate = await db.collection("emailTemplates").doc("welcome").get();
await db.collection("emailTemplates").doc("welcome_v1_backup").set(currentTemplate.data());
```

## Añadir Nuevos Templates

### 1. Crear el Template en Firestore

```typescript
await admin.firestore()
  .collection("emailTemplates")
  .doc("newTemplate")
  .set({
    subject: "Asunto del nuevo template",
    html: `<div>Contenido con {{variable}}</div>`,
    description: "Descripción del propósito",
    variables: ["variable", "otraVariable"],
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
```

### 2. Crear la Función de Envío

En `functions/src/services/emailService.ts`:

```typescript
export const sendNewEmail = async (
  email: string,
  variable: string,
  otraVariable: string
) => {
  try {
    logger.info(`Queuing new email to ${email}`);

    const template = await getEmailTemplate("newTemplate");
    if (!template) {
      throw new Error("New email template not found");
    }

    const variables = {
      variable,
      otraVariable,
      appUrl: APP_URL,
    };

    const subject = replaceTemplateVariables(template.subject, variables);
    const html = replaceTemplateVariables(template.html, variables);

    await getDb().collection(MAIL_COLLECTION).add({
      to: email,
      message: {
        subject,
        html,
      },
    });

    logger.info(`New email queued successfully for ${email}`);
    return {success: true};
  } catch (error) {
    logger.error(`Error queuing new email to ${email}:`, error);
    throw error;
  }
};
```

## Solución de Problemas

### Template no encontrado

**Error:** `Email template X not found in database`

**Solución:**
1. Verifica que el template existe en Firestore
2. Confirma que el ID del documento coincide exactamente
3. Ejecuta el script de inicialización si es un template estándar

### Variables no reemplazadas

**Problema:** Aparece `{{variable}}` en el email en lugar del valor

**Solución:**
1. Verifica que la variable está siendo pasada en el objeto `variables`
2. Confirma que el nombre de la variable coincide exactamente (case-sensitive)
3. Revisa que la sintaxis sea `{{variable}}` (doble llave)

### Permisos de Firestore

**Error:** `Missing or insufficient permissions`

**Solución:**
- Verifica las reglas de seguridad de Firestore
- Asegúrate de que Cloud Functions tenga permisos de lectura en `emailTemplates`

## Referencia de API

### `getEmailTemplate(templateId: string)`
Obtiene un template de Firestore.

**Retorna:** `Promise<{subject: string, html: string} | null>`

### `replaceTemplateVariables(template: string, variables: Record<string, string>)`
Reemplaza variables en un template.

**Parámetros:**
- `template`: String del template con placeholders
- `variables`: Objeto con valores a reemplazar

**Retorna:** `string` con variables reemplazadas

## Soporte Multilenguaje (Futuro)

Para soportar múltiples idiomas, considera esta estructura:

```
emailTemplates/
  ├── welcome_es/
  │   ├── subject: "¡Bienvenido!"
  │   └── html: "..."
  ├── welcome_en/
  │   ├── subject: "Welcome!"
  │   └── html: "..."
```

O usar subcollecciones:

```
emailTemplates/welcome/
  └── locales/
      ├── es/
      └── en/
```
