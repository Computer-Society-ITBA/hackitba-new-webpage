# Participantes Sin Equipo - Documentación

## Descripción General

Se ha implementado un sistema para gestionar participantes que no tienen equipo. Estos participantes recibirán indicadores visuales especiales en sus dashboards hasta que se unan o creen un equipo.

## Cambios Implementados

### 1. Modelo de Datos (types.ts)
Se agregó el campo `hasTeam` al interfaz `User`:
```typescript
export interface User {
  // ... otros campos
  team?: string | null           // ID o código del equipo
  hasTeam?: boolean             // true si tienen equipo, false si no, undefined si no aplica
  // ... otros campos
}
```

### 2. Formulario de Registro de Evento (event-signup/page.tsx)
El formulario ahora captura el estado de equipo:
```typescript
const payload = {
  // ... otros campos
  team: formData.hasTeam === "yes" ? formData.teamCode : null,
  hasTeam: formData.hasTeam === "yes",   // Nueva propiedad
  // ... otros campos
}
```

Se envía `hasTeam: true` solo si el participante tiene un código de equipo válido.

### 3. Backend - Controlador de Usuarios (userControllers.ts)
El controlador `registerEvent` ahora recibe y procesa `hasTeam`:
```typescript
const { userId, hasTeam, ... } = req.body
await eventRegistration(userId, ..., hasTeam, ...)
```

### 4. Backend - Servicio de Usuarios (userService.ts)
La función `eventRegistration` ahora guarda el estado de equipo en Firestore:
```typescript
await userRef.update({
  // ... otros campos
  hasTeam: hasTeam,
  team: team,
  // ... otros campos
})
```

### 5. Dashboard de Participantes (dashboard/participante/page.tsx)

#### Indicador Visual de "Sin Equipo"
Se agregó una tarjeta de advertencia que aparece cuando el participante no tiene equipo:
```typescript
const hasTeam = user?.hasTeam === true && user?.team

{!hasTeam && (
  <div className="mb-6 p-4 border-2 border-brand-orange rounded-lg bg-brand-orange/5">
    <p className="text-brand-orange font-pixal font-bold mb-2">⚠️ You don't have a team yet</p>
    <p className="text-brand-cyan text-sm mb-4">
      You are currently without a team. You can create a new team or join an existing one to start working on your project.
    </p>
  </div>
)}
```

### 6. Componente TeamSection (team-section.tsx)

#### Visualización Mejorada para Sin Equipo
Cuando el usuario no tiene equipo, se muestra una interfaz dedic a con:
- Mensaje prominente indicando que no tiene equipo
- Opción para unirse a un equipo existente usando un código
- Divisor visual (OR)
- Botón para crear un nuevo equipo

```typescript
if (!userTeamLabel || !team) {
  return (
    <GlassCard>
      <div className="flex flex-col items-center justify-center py-12 space-y-6">
        <Users className="w-16 h-16 text-brand-orange/60" />
        <div className="text-center space-y-2 max-w-md">
          <p className="text-brand-yellow font-pixel text-lg">Without Team</p>
          <p className="text-brand-cyan/90 text-sm">
            You are currently a solo participant...
          </p>
        </div>
        <div className="w-full max-w-sm space-y-4 pt-4">
          {/* Opciones para unirse o crear equipo */}
        </div>
      </div>
    </GlassCard>
  )
}
```

## Flujo de Usuario

### Participante Sin Equipo

1. **Durante el Signup:**
   - El participante selecciona "No tengo equipo" en el formulario de evento
   - Se guarda `hasTeam: false` en Firestore

2. **En el Dashboard:**
   - Se muestra un indicador visual con ⚠️ "You don't have a team yet"
   - Tiene dos opciones:
     - **Unirse a un equipo:** Usando un código de equipo
  - **Crear un nuevo equipo:** Desde el paso "Team Status" del `event-signup` (inline, sin redirección)

3. **Al Crear o Unirse a un Equipo:**
   - El campo `team` se actualiza con el ID/código del equipo
   - El campo `hasTeam` se actualiza a `true`
   - El indicador visual desaparece del dashboard

## Flujo de Datos

```
event-signup/page.tsx
  ↓ (formData.hasTeam === "yes")
payload { hasTeam: boolean, team: string|null }
  ↓ (fetch to /api/users/register-event)
userControllers.ts (registerEvent)
  ↓ (await eventRegistration(..., hasTeam, ...))
userService.ts (eventRegistration)
  ↓ (update Firestore users/{userId})
Firebase Firestore
  ↓ (user.hasTeam, user.team)
auth-context.tsx (refreshUser)
  ↓ (setUser with updated data)
Dashboard (participante/page.tsx)
  ↓ (render "Without Team" warning if !hasTeam)
TeamSection.tsx
  ↓ (show team creation/join options)
```

## Estados de Un Participante

### 1. Sin Equipo (Sin Equipo)
- `hasTeam: false`
- `team: null`
- Aparece advertencia en dashboard
- Puede crear o unirse a un equipo

### 2. Esperando Equipo (Transición)
- `hasTeam: false` pero intenta unirse
- Sistema verifica el código
- Si es válido, actualiza `hasTeam: true` y `team: "código"`

### 3. Con Equipo
- `hasTeam: true`
- `team: "código_equipo"`
- No aparece advertencia
- Puede gestionar su equipo

## Consideraciones Técnicas

### Validación en Backend
- Se verifica que el equipo exista antes de actualizar el usuario
- Se generan logs para seguimiento de eventos

### Actualización en Tiempo Real
- Al actualizar el usuario en Firestore, se dispara `refreshUser()` en auth-context
- El dashboard se actualiza automáticamente

### Persistencia de Datos
- El estado `hasTeam` se persiste en Firestore
- Refleja el estado actual del participante independientemente de sesiones

## API Endpoints

### POST /api/users/register-event
**Payload:**
```json
{
  "userId": "string",
  "hasTeam": boolean,
  "team": "string|null",
  "...otherFields"
}
```

**Respuesta:**
```json
{
  "message": "Registro al evento exitoso"
}
```

## Pruebas Recomendadas

1. **Crear participante sin equipo:**
   - Registrar nuevo usuario
   - En event-signup, seleccionar "No tengo equipo"
   - Verificar `hasTeam: false` en Firestore

2. **Unirse a equipo existente:**
   - Obtener código de un equipo existente
   - En el dashboard, usar "Join Team"
   - Verificar `hasTeam: true` después

3. **Crear nuevo equipo:**
  - En `event-signup`, elegir "Create a team"
  - Completar nombre, motivación y prioridades en el mismo paso
  - Verificar que el equipo se crea y que el usuario aparece en él

4. **Visual de advertencia:**
   - Participante sin equipo debe ver ⚠️ en dashboard
   - Al unirse/crear equipo, la advertencia desaparece

## Próximas Mejoras Sugeridas

- [ ] Sistema de invitaciones entre participantes
- [ ] Búsqueda de equipos disponibles
- [ ] Notificaciones cuando se une/crea un equipo
- [ ] Historial de cambios de equipos
- [ ] Limitar el tiempo para que un participante busque equipo
