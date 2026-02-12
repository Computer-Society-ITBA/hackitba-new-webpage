# Configuración de Variables de Entorno

## Para Desarrollo Local

1. Copia el archivo de ejemplo:
   ```bash
   cp .env.local.example .env.local
   ```

2. Completa los valores en `.env.local` con tu configuración de Firebase

## Para Deploy en Vercel

### Opción 1: Dashboard de Vercel (Recomendado)

1. Ve a tu proyecto en [Vercel Dashboard](https://vercel.com/dashboard)
2. Navega a **Settings** → **Environment Variables**
3. Agrega cada variable una por una:

#### Variables Públicas (todas las que empiezan con NEXT_PUBLIC_)
```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
NEXT_PUBLIC_API_URL
```

#### Variables Privadas (NO expongas estas en el código cliente)
```
FIREBASE_PROJECT_ID
FIREBASE_CLIENT_EMAIL
FIREBASE_PRIVATE_KEY (asegúrate de escapar los \n correctamente)
FIREBASE_STORAGE_BUCKET
CRON_SECRET (genera un token aleatorio seguro)
```

4. Para cada variable:
   - **Name**: nombre de la variable
   - **Value**: el valor correspondiente
   - **Environment**: selecciona `Production`, `Preview`, y/o `Development` según necesites

5. Después de agregar todas las variables, haz un nuevo deploy o redeploy el proyecto

### Opción 2: Vercel CLI

Si tienes el CLI de Vercel instalado:

```bash
# Instalar Vercel CLI si no lo tienes
npm i -g vercel

# Login
vercel login

# Agregar variables de entorno manualmente
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY
vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID
# ... repite para cada variable
```

#### Script Automatizado (Recomendado)

Usa el script incluido para subir todas las variables desde tu `.env.local`:

```bash
./scripts/upload-env-to-vercel.sh
```

Este script:
- Verifica que tengas Vercel CLI instalado
- Lee todas las variables de `.env.local`
- Te permite elegir el entorno (Production/Preview/Development)
- Sube todas las variables automáticamente

⚠️ **Importante**: Asegúrate de que `.env.local` tenga valores de producción, no de desarrollo local.

### Opción 3: Archivo vercel.json (NO RECOMENDADO para secretos)

⚠️ **ADVERTENCIA**: NO agregues secretos o claves privadas directamente en `vercel.json` ya que este archivo se sube a git.

Solo úsalo para variables públicas o configuración no sensible.

## Valores Importantes

### FIREBASE_PRIVATE_KEY
La clave privada debe incluir los saltos de línea. En Vercel, pégala tal cual:
```
-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASC...
...
-----END PRIVATE KEY-----
```

### CRON_SECRET
Genera un token aleatorio seguro:
```bash
openssl rand -base64 32
```

### NEXT_PUBLIC_API_URL
Para producción, usa tu URL de Cloud Functions:
```
https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/api
```

## Verificar Variables

Después de configurar:

1. Haz un nuevo deploy:
   ```bash
   vercel --prod
   ```

2. O redeploy desde el dashboard de Vercel

3. Verifica que las variables estén disponibles revisando los logs de build o runtime

## Servicio de Email (Resend)

### Configuración para Cloud Functions

Las siguientes variables deben configurarse en `functions/.env.local` para desarrollo y en Firebase Console para producción.

#### Variables Requeridas:
```
RESEND_API_KEY=your_resend_api_key_here
APP_URL=https://hackitba.com (o tu dominio personalizado)
```

#### Obtener API Key de Resend:

1. Ve a [https://resend.com](https://resend.com)
2. Crea una cuenta o inicia sesión
3. Navega a **API Keys** en el dashboard
4. Crea una nueva API Key
5. Copia el valor completo
6. Pega en `functions/.env.local` o en Firebase Console (Environment Variables)

#### Configurar en Firebase Console:

1. Ve a [Firebase Console](https://console.firebase.google.com)
2. Selecciona tu proyecto
3. Navega a **Functions** → **Runtime environment variables**
4. Agrega:
   - `RESEND_API_KEY`: Tu API key de Resend
   - `APP_URL`: URL de tu aplicación (ej: https://hackitba.com)

5. Redeploy las Cloud Functions:
   ```bash
   firebase deploy --only functions:api
   ```

## Troubleshooting

- Si las variables `NEXT_PUBLIC_*` no aparecen en el cliente, asegúrate de hacer un nuevo build
- Las variables privadas solo están disponibles en funciones de servidor (API routes, Server Components)
- Después de cambiar variables de entorno, siempre necesitas un redeploy
- Para emails: verifica que `RESEND_API_KEY` esté correctamente configurada en Cloud Functions
- Si los emails no se envían, revisa los logs de Cloud Functions en Firebase Console
