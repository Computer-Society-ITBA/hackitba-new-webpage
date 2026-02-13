# Admin Team Assignment System

Sistema completo para gestionar participantes sin equipo desde el dashboard de administrador.

## 🎯 Características Implementadas

### 1. Dashboard de Admin - Participantes Pendientes

**Ubicación:** `/[locale]/dashboard/admin`

El dashboard de admin ahora muestra una nueva sección al inicio con:

- **Contador de participantes pendientes**: Badge con el número de solicitudes
- **Lista de participantes**: Muestra información detallada:
  - Nombre completo
  - Email
  - Universidad y carrera
  - Estado actual (En Proceso)
- **Acciones disponibles**:
  - Selector de equipo (dropdown con todos los equipos disponibles)
  - Botón "Aprobar" (verde): Asigna al participante al equipo seleccionado
  - Botón "Rechazar" (rojo): Rechaza la solicitud

### 2. Validación de Roles

**Middleware:** `requireAdmin`

Solo usuarios con rol `admin` pueden:
- Ver participantes pendientes (`GET /api/users/pending-participants`)
- Aprobar/rechazar participantes (`POST /api/users/approve-and-assign-team`)

Si un usuario sin permisos intenta acceder, recibe:
```json
{
  "error": "Acceso denegado. Solo administradores."
}
```

### 3. Notificaciones por Email

Se envían emails automáticos cuando:

#### Participante Aceptado
- **Subject:** "¡Has sido aceptado! - Equipo asignado en HackITBA"
- **Contenido:**
  - Mensaje de felicitación
  - Nombre del equipo asignado
  - Link directo al dashboard de participante
  - Botón CTA para ver el equipo

#### Participante Rechazado
- **Subject:** "Actualización sobre tu solicitud - HackITBA"
- **Contenido:**
  - Mensaje informativo
  - Razón del rechazo (si se proporcionó)
  - Opciones alternativas (crear equipo propio o unirse a uno)
  - Link al dashboard

## 📡 API Endpoints

### GET /api/users/pending-participants
Obtiene la lista de participantes con estado `in_process`.

**Autenticación:** Requerida (Bearer Token)
**Rol requerido:** Admin

**Respuesta exitosa:**
```json
{
  "participants": [
    {
      "id": "userId123",
      "name": "Juan",
      "surname": "Pérez",
      "email": "juan@example.com",
      "university": "ITBA",
      "career": "Ingeniería Informática",
      "teamAssignmentStatus": "in_process",
      "createdAt": "2026-02-12T10:00:00Z"
    }
  ],
  "count": 1
}
```

### POST /api/users/approve-and-assign-team
Aprueba o rechaza un participante y opcionalmente lo asigna a un equipo.

**Autenticación:** Requerida (Bearer Token)
**Rol requerido:** Admin

**Body (Aprobar):**
```json
{
  "userId": "userId123",
  "status": "accepted",
  "teamCode": "TEAM001"
}
```

**Body (Rechazar):**
```json
{
  "userId": "userId123",
  "status": "rejected",
  "reason": "No hay equipos disponibles"
}
```

**Respuesta exitosa:**
```json
{
  "message": "Participant status updated successfully",
  "userId": "userId123",
  "status": "accepted",
  "teamCode": "TEAM001"
}
```

## 🔄 Flujo Completo

1. **Participante se registra sin equipo** (`hasTeam: false`)
   - Se establece automáticamente `teamAssignmentStatus: "in_process"`
   - Aparece en el dashboard del participante: "Estado: En Proceso"

2. **Admin revisa participantes pendientes**
   - Accede al dashboard de admin
   - Ve la lista de participantes con estado "En Proceso"

3. **Admin toma una decisión:**

   **Opción A: Aprobar**
   - Selecciona un equipo del dropdown
   - Click en "Aprobar"
   - Sistema:
     - Asigna `team`, `assignedTeam`, `hasTeam: true`
     - Cambia `teamAssignmentStatus` a `"accepted"`
     - Envía email de aceptación
   - Participante puede ver su equipo en el dashboard

   **Opción B: Rechazar**
   - Click en "Rechazar"
   - Ingresa razón opcional
   - Sistema:
     - Cambia `teamAssignmentStatus` a `"rejected"`
     - Envía email de rechazo con razón
   - Participante puede crear/unirse a equipo manualmente

## 🎨 Interfaz de Usuario

### Dashboard de Participante
```
┌─────────────────────────────────────────┐
│ ⏳ Estado: En Proceso                   │
│                                         │
│ Tu solicitud está siendo revisada por   │
│ el staff. Te asignaremos un equipo      │
│ pronto o podrás unirte a uno existente. │
└─────────────────────────────────────────┘
```

### Dashboard de Admin
```
┌────────────────────────────────────────────────────────┐
│ 👥 Participantes Pendientes  [3]                       │
├────────────────────────────────────────────────────────┤
│ Juan Pérez  [En Proceso]                               │
│ 📧 juan@example.com                                    │
│ 🎓 ITBA - Ing. Informática                             │
│ [Seleccionar equipo ▼] [✓ Aprobar] [✗ Rechazar]      │
└────────────────────────────────────────────────────────┘
```

## 🔧 Configuración

### Variables de Entorno
Las siguientes variables deben estar configuradas en Firebase Functions:

- `APP_URL`: URL de la aplicación (para links en emails)
  - Ejemplo: `https://hackitba.com`

### Permisos de Firestore
Asegúrate de que las reglas de Firestore permitan:
- Admins pueden leer/escribir usuarios
- Admins pueden leer equipos

## 🧪 Testing

### Probar como Admin
1. Crear usuario con rol `admin` en Firestore
2. Login en la aplicación
3. Navegar a `/es/dashboard/admin`
4. Verificar que se muestren los participantes pendientes

### Probar Flujo Completo
1. Registrar un participante sin equipo
2. Verificar que aparezca en el dashboard de admin
3. Aprobar y asignar a un equipo
4. Verificar que:
   - El participante vea el equipo en su dashboard
   - Se envíe el email de confirmación
   - El participante desaparezca de la lista de pendientes

## 📊 Estados Posibles

| Estado | Descripción | Visible para Admin | Acciones Participante |
|--------|-------------|-------------------|----------------------|
| `null` / `undefined` | Sin solicitud | No | Crear/Unirse a equipo |
| `in_process` | Esperando asignación | Sí | Solo ver estado |
| `pending` | Pendiente (alias) | Sí | Solo ver estado |
| `accepted` | Aprobado y asignado | No | Ver equipo asignado |
| `rejected` | Rechazado | No | Crear/Unirse a equipo |

## 🚨 Manejo de Errores

### Usuario no encontrado
```json
{
  "error": "User not found"
}
```

### Equipo no existe
```json
{
  "error": "Team not found"
}
```

### Permisos insuficientes
```json
{
  "error": "Acceso denegado. Solo administradores."
}
```

### Error al enviar email
- El sistema registra el error en logs
- No falla la operación de aprobación/rechazo
- Admin puede verificar en Firebase Extensions > Trigger Email

## 📈 Mejoras Futuras

- [ ] Dashboard de estadísticas (cuántos aprobados/rechazados)
- [ ] Filtros y búsqueda en lista de pendientes
- [ ] Asignación automática basada en categorías
- [ ] Plantillas de email personalizables
- [ ] Historial de decisiones de admin
- [ ] Notificaciones push además de email
