# Email Verification Implementation Guide

## Overview

Este documento explica cómo se ha implementado el sistema de verificación de email en HackItBA.

## Cambios Realizados

### 1. Backend (Cloud Functions)

#### Nuevo archivo: `services/emailVerificationService.ts`

Contiene funciones para manejar tokens de verificación:

- **`generateVerificationToken()`**: Genera un token único y aleatorio (32 bytes en formato hex)
- **`saveVerificationToken(userId, email, token)`**: Guarda el token en Firestore con vencimiento de 24 horas
- **`verifyEmailToken(token)`**: Valida el token y verifica que no haya expirado ni sido usado
- **`markTokenAsVerified(token, userId)`**: Marca el token como verificado y actualiza el usuario
- **`cleanupExpiredTokens()`**: Limpia tokens expirados de Firestore (opcional, puede ejecutarse como cron)

#### Cambios en `userService.ts`

- Agregado campo `emailVerified: false` al documento del usuario cuando se registra

#### Cambios en `userControllers.ts`

- Importadas funciones de verificación de email
- En la función `register()`:
  - Se genera un token de verificación
  - Se guarda el token en Firestore
  - Se envía un email con el link de verificación
  - Se sigue enviando el email de bienvenida
- Nueva función `verifyEmail()` para manejar la verificación del token

#### Cambios en `userRoutes.ts`

- Nuevo endpoint: `GET /api/users/verify-email?token={token}`
- Este endpoint es público (no requiere autenticación)

### 2. Firestore Database

#### Nueva Colección: `emailVerificationTokens`

Documenta un token de verificación con la siguiente estructura:

```json
{
  "userId": "string",
  "email": "string",
  "token": "string",
  "createdAt": "timestamp",
  "expiresAt": "timestamp (24 horas después de createdAt)",
  "verified": "boolean",
  "verifiedAt": "timestamp (opcional)"
}
```

#### Cambios en Colección `users`

Se agregó el campo `emailVerified: boolean` a cada documento de usuario:

```json
{
  "email": "user@example.com",
  "name": "Juan",
  "surname": "Pérez",
  "createdAt": "timestamp",
  "role": "participant",
  "onboardingStep": 1,
  "emailVerified": false,
  "emailVerifiedAt": "timestamp (opcional)"
}
```

### 3. Frontend (Next.js)

#### Nueva Página: `app/[locale]/auth/verify-email/page.tsx`

Componente que:
- Obtiene el token de la query string
- Llamoa al endpoint de verificación
- Muestra estados: cargando, éxito, error
- Redirige al dashboard después de 3 segundos en caso de éxito

## Flujo de Verificación

```
1. Usuario se registra
   ↓
2. Se genera token y se guarda en Firestore
   ↓
3. Se envía email con link: {APP_URL}/es/auth/verify-email?token={token}
   ↓
4. Usuario hace clic en el link
   ↓
5. Frontend obtiene el token y llama a GET /api/users/verify-email?token={token}
   ↓
6. Backend verifica el token:
   - ¿Existe el token?
   - ¿Está expirado?
   - ¿Ya fue usado?
   ↓
7. Si es válido:
   - Marca el documento emailVerificationTokens como verified=true
   - Actualiza el usuario con emailVerified=true
   ↓
8. Frontend muestra éxito y redirige al dashboard
```

## Environment Variables

No se necesitan nuevas variables de entorno. El sistema usa:
- `NEXT_PUBLIC_API_URL`: URL de la API (ya configurado)
- `APP_URL`: URL de la aplicación para generar el link (ya configurado en Firebase Functions)

## Testing

### 1. Test Local

Si estás usando emuladores de Firebase:

```bash
# Terminal 1: Inicia los emuladores
firebase emulators:start

# Terminal 2: Deploy local de functions
firebase deploy --only functions --project webpage-36e40
```

### 2. Test Manual

1. Abre la aplicación localmente
2. Regístrate con un email
3. Revisa los logs para ver el token generado
4. Copia el token y visita manualmente: `http://localhost:3000/es/auth/verify-email?token={token}`

### 3. Estructura de Respuesta

**Respuesta exitosa (200):**
```json
{
  "message": "Email verificado exitosamente",
  "email": "user@example.com"
}
```

**Respuesta de error (400/500):**
```json
{
  "error": "Token inválido o expirado"
}
```

## Security Considerations

1. **Token Uniqueness**: Se genera un token aleatorio de 32 bytes (256 bits)
2. **Token Expiration**: Los tokens expiran después de 24 horas
3. **One-time Use**: Un token solo puede usarse una vez (campo `verified`)
4. **Public Endpoint**: El endpoint de verificación es público (sin autenticación)
5. **No User Enumeration**: El endpoint no revela si un email existe

## Future Enhancements

1. **Email Verification Requirement**: Opcionalmente requerir email verificado para acceder a ciertas funciones
2. **Resend Token**: Crear endpoint para reenviar el token de verificación
3. **Redirect After Verification**: Parametrizar la página de redirección
4. **Notify on Verification**: Enviar un email confirmando que la cuenta está lista
5. **Cleanup Cron Job**: Agregar una tarea cron que limpie tokens expirados

## Rollback / Disable

Si necesitas desactivar esta funcionalidad:

1. Elimina la llamada a `sendEmailVerificationEmail()` en el controlador
2. Elimina la línea de `saveVerificationToken()` 
3. Elimina la ruta `/api/users/verify-email`
4. Los campos `emailVerified` en los documentos de usuario pueden quedarse sin causar problemas

## Troubleshooting

### El link no funciona
- Verifica que `APP_URL` esté correctamente configurado en Firebase Functions
- Verifica que la URL en el email contenga el token correcto
- Comprueba que el token existe en Firestore

### El token dice "Token inválido o expirado"
- Verifica la fecha de `expiresAt` en Firestore
- Asegúrate de que el documento `emailVerificationTokens` existe
- Verifica que el campo `verified` no esté marcado como `true`

### El email no se envía
- Verifica que la configuración de Resend esté correcta (ver EMAIL_SERVICE_SETUP.md)
- Revisa los logs de Cloud Functions
- Verifica que el template `emailVerification` existe en Firestore
