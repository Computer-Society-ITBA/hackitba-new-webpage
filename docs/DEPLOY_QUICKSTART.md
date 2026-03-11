# Guía Rápida: Deploy del Frontend en Vercel

## Resumen de Pasos

### 1️⃣ Preparar Variables Locales (Solo primera vez)

```bash
# Copiar archivo de ejemplo
cp .env.local.example .env.local

# Editar y completar con tus valores de Firebase
nano .env.local  # o usa tu editor preferido

# Verificar que todo esté correcto
npm run check-env
```

### 2️⃣ Subir Variables a Vercel

**Opción A: Dashboard de Vercel** (Más seguro)
1. Ir a https://vercel.com/dashboard
2. Seleccionar tu proyecto
3. Settings → Environment Variables
4. Agregar cada variable manualmente

**Opción B: Script Automático** (Más rápido)
```bash
# Asegúrate de tener Vercel CLI
npm i -g vercel

# Ejecutar script
./scripts/upload-env-to-vercel.sh
```

### 3️⃣ Deploy

```bash
# Login en Vercel (solo primera vez)
vercel login

# Deploy a producción
vercel --prod

# O simplemente haz push a tu rama principal si tienes integración con Git
git push origin main
```

## Variables Críticas Requeridas

### Públicas (van al navegador)
- ✅ `NEXT_PUBLIC_FIREBASE_API_KEY`
- ✅ `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- ✅ `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- ✅ `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- ✅ `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- ✅ `NEXT_PUBLIC_API_URL` → URL de tus Cloud Functions

### Privadas (solo servidor)
- 🔒 `FIREBASE_PROJECT_ID`
- 🔒 `FIREBASE_CLIENT_EMAIL`
- 🔒 `FIREBASE_PRIVATE_KEY` → Clave del Service Account
- 🔒 `FIREBASE_STORAGE_BUCKET`
- 🔒 `CRON_SECRET` → Token aleatorio para Cron Jobs

## Verificar Deploy

1. **Ver logs de build**: Dashboard de Vercel → Deployments → [último deploy] → Building
2. **Verificar variables**: Dashboard → Settings → Environment Variables
3. **Probar la app**: Abrir la URL de producción

## Troubleshooting

### ❌ Variables no aparecen en el cliente
**Solución**: Las variables `NEXT_PUBLIC_*` requieren un nuevo build
```bash
vercel --force --prod
```

### ❌ Error de autenticación de Firebase
**Solución**: Verifica que `FIREBASE_PRIVATE_KEY` incluya los saltos de línea correctos
- En Vercel, pega la clave completa incluyendo:
  ```
  -----BEGIN PRIVATE KEY-----
  ...contenido...
  -----END PRIVATE KEY-----
  ```

### ❌ Cron jobs no funcionan
**Solución**: Verifica que `CRON_SECRET` esté configurado:
```bash
# Generar un nuevo secret
openssl rand -base64 32

# Agregarlo en Vercel
vercel env add CRON_SECRET production
```

### ❌ API URL incorrecta
**Solución**: `NEXT_PUBLIC_API_URL` debe apuntar a tus Cloud Functions:
```
https://us-central1-TU_PROJECT_ID.cloudfunctions.net/api
```

## Comandos Útiles

```bash
# Ver variables configuradas en Vercel
vercel env ls

# Descargar variables de Vercel a .env.local
vercel env pull

# Ver logs en tiempo real
vercel logs --follow

# Redeploy sin cambios
vercel --prod --force

# Deploy de rama específica
vercel --prod --name mi-proyecto
```

## Próximos Pasos

1. ✅ Configurar variables de entorno
2. ✅ Hacer deploy a producción
3. 🔄 Configurar dominio personalizado (opcional)
4. 🔄 Configurar integración con GitHub/GitLab
5. 🔄 Configurar notificaciones de deploy

---

📚 **Documentación completa**: [ENVIRONMENT_VARIABLES.md](ENVIRONMENT_VARIABLES.md)
