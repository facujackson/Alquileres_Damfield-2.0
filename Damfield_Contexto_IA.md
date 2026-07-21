# Damfield Alquileres — Contexto técnico para IA (v2.14)

## Descripción general

App web de gestión de alquileres de canchas y espacios deportivos para el complejo Damfield. Construida en **React 18 + Vite**, deployada en **Vercel**, con datos persistidos en **Firebase Realtime Database** vía una capa de abstracción propia (`cloudStorage.js`).

Todo el código de la UI vive en un único archivo: `src/App.jsx` (~2320 líneas). No hay CSS externo — todos los estilos son inline como objetos JS.

---

## Stack técnico

- **Frontend**: React 18 + Vite, single-file app (`src/App.jsx`)
- **Base de datos**: Firebase Realtime Database
- **Abstracción de datos**: `src/cloudStorage.js` → expone `window.storage.get/set`
- **Deploy**: Vercel (GitHub → auto-deploy). Script `publicar.command` hace git push con `--force`
- **Fuente**: Manrope (system font stack), todo inline styles

---

## Paleta de colores (redesign v2.14)

| Token | Valor | Uso |
|---|---|---|
| fondo app | `#101317` | background principal |
| surface | `#15181d` | cards, headers |
| surface-alt | `#1e2228` | inputs, secciones |
| border | `#333a42` | bordes generales |
| texto principal | `#eef1f5` | texto primario |
| texto secundario | `#7f8792` | labels, placeholders |
| acento tostado | `#c9ad7f` | botón principal, highlights |
| danger | `#c96b5f` | errores, eliminar |
| success | `#22c55e` | pagado, confirmaciones |
| warning | `#f59e0b` | saldo pendiente, descuentos |

---

## Reglas absolutas — NO tocar bajo ninguna circunstancia

```js
// Funciones de Firebase — no modificar
dbGet(key)           // lee de Firebase
dbSet(key, val)      // escribe en Firebase
expandRecurrence(b)  // expande reservas recurrentes
hasConflict()        // detecta conflictos de horario
CONFLICT_GROUPS      // grupos de espacios con conflicto
```

El archivo `.github_token` nunca debe commitearse (está en `.gitignore`).

---

## Estructura de datos en Firebase

### Bookings (`bookings: []`)
```js
{
  id: "b_1234567890",
  space: "futbol_11",           // id del espacio
  date: "2026-07-10",          // YYYY-MM-DD
  startHour: 18,               // número float (ej: 18.5 = 18:30)
  endHour: 20,
  clientId: "c_xxx",
  clientName: "Juan García",
  clientPhone: "+54 9 341...",
  clientEmail: "...",
  clientOrg: "Club Atlético...",
  totalAmount: 121000,
  señaAmount: 40000,
  descuentoTipo: "none"|"pct"|"monto",
  descuentoValor: "",
  descuentoMotivo: "",          // obligatorio si hay descuento
  pagos: [{ id, monto, fecha, forma, nota }],
  asistio: null|true|false,
  sinCargo: false,              // derivado automáticamente si descuento=100%
  isBloqueo: false,
  bloqueoMotivo: "",
  notes: "",
  recurrence: "none"|"weekly"|"count"|"until",
  recurrenceCount: 4,
  recurrenceUntil: "2026-12-31",
  recurrenceId: "r_xxx"        // agrupa reservas recurrentes
}
```

### Clients (`clients: []`)
```js
{
  id: "c_xxx",
  name: "Juan García",
  phone: "+54 9 341...",
  email: "...",
  org: "Club..."
}
```

### Users (`users: []`)
```js
{
  id: "u1"|"u2"|"u3"|"u_xxx",
  name: "Administrador",
  username: "admin",
  password: "admin123",
  role: "admin"|"vendedor"|"readonly",
  email: ""
}
```

### Activity Log (`activityLog: []`)
```js
[{ id, user, action, detail, timestamp }]  // max 500 entradas, newest first
```

---

## Espacios disponibles

| ID | Label | Grupo | Precio |
|---|---|---|---|
| `futbol_11` | Fútbol 11 | futbol | $121.000 |
| `futbol_7` | Fútbol 7 | futbol | $90.000 |
| `hockey` | Hockey | hockey | $90.000 |
| `tenis_1` al `tenis_4` | Tenis 1-4 | otros | a convenir |
| `padel_1` / `padel_2` | Pádel 1-2 | otros | a convenir |
| `escritorio_1..28` | Escritorio 1-28 | coworking | a convenir |

`ESCRITORIO_MAX = 28` — no modificar.

---

## Vistas de la app

### Nav principal (`view`)
- `reservas` — calendario de reservas
- `clientes` — gestión de clientes
- `finanzas` — resumen financiero
- `usuarios` — gestión de usuarios (solo admin)

### Sub-vistas de reservas (`reservaView`)
- `dia` — vista diaria por espacio
- `semana` — grilla semanal (días × espacios)
- `mes` — calendario mensual
- `lista` — lista scrolleable con filtros

---

## Horarios y slots

```js
const ALL_HOURS = Array.from({length:18}, (_,i) => i+6);       // 6 a 23 (enteros)
const ALL_SLOTS = Array.from({length:36}, (_,i) => 6+i*0.5);   // 6:00 a 23:30 (medias horas)
const DEFAULT_HOURS = [18,19,20,21,22];                         // horas visibles por defecto
const pad = n => String(Math.floor(n)).padStart(2,"0");
const fmtHour = h => h%1===0 ? pad(h)+":00" : pad(h)+":30";
```

Las filas de media hora (`:30`) solo aparecen en el calendario cuando existe una reserva que empieza a esa hora. El calendario es compacto por defecto.

---

## Lógica de cobros

```js
function getNetAmount(bk) {
  if(bk.sinCargo || bk.isBloqueo) return 0;
  const base = Number(bk.totalAmount) || 0;
  if(!bk.descuentoTipo || bk.descuentoTipo==="none") return base;
  if(bk.descuentoTipo==="pct") return Math.max(0, base - base*(Number(bk.descuentoValor)||0)/100);
  if(bk.descuentoTipo==="monto") return Math.max(0, base - (Number(bk.descuentoValor)||0));
  return base;
}
function getTotalPagado(bk) {
  if(bk.sinCargo || bk.isBloqueo) return 0;
  if(bk.pagos?.length > 0) return bk.pagos.reduce((s,p) => s+(Number(p.monto)||0), 0);
  // backward compat con campo legacy
  return Number(bk.señaPaid ? bk.señaAmount : 0) + Number(bk.saldoPaid ? (getNetAmount(bk)-Number(bk.señaAmount)) : 0);
}
```

**Cortesía / Sin cargo**: si el descuento es 100% (porcentaje ≥ 100 o monto ≥ total), la reserva se marca automáticamente `sinCargo: true` al guardar. Siempre requiere cliente asignado. Siempre requiere `descuentoMotivo`.

**Descuentos**: cualquier descuento (cualquier porcentaje o monto) requiere que el usuario complete el campo `descuentoMotivo`.

---

## Roles de usuario

| Rol | Permisos |
|---|---|
| `admin` | Todo: reservas, clientes, finanzas, usuarios, historial de actividad |
| `vendedor` | Reservas (crear/editar/eliminar), clientes, finanzas. NO usuarios |
| `readonly` | Solo lectura — no puede crear, editar ni eliminar nada |

---

## Formulario de reserva (mobile = bottom sheet, desktop = modal con tabs)

**Mobile — 3 pasos:**
1. **Datos básicos**: espacio, fecha, hora inicio/fin, recurrencia
2. **Cliente**: nombre (obligatorio), teléfono, email, organización
3. **Cobro**: total, descuento (con motivo obligatorio si aplica), forma de pago, monto a cobrar ahora

**Desktop — tabs:**
- Tab "Reserva": espacio, fecha, horario, bloqueo, recurrencia
- Tab "Cliente": búsqueda/creación de cliente
- Tab "Cobro": total, seña, descuento (con motivo), pagos registrados
- Asistencia: aparece solo si la reserva ya pasó

---

## Semana vista — badges de estado

En cada celda del calendario semanal se muestra:
- `🎁 Sin cargo` → si `sinCargo` o `getNetAmount === 0`
- `⚠ $X restante` → si hay saldo pendiente
- `✓ Pagado` → si está pagado completo

---

## Persistencia de sesión

Login guardado en `localStorage` con key `damfield_session`. Al cargar la app, se restaura automáticamente si existe.

---

## Usuarios por defecto (hardcoded como fallback)

```
admin / admin123 / rol: admin
vendedor / venta123 / rol: vendedor  
lectura / lectura123 / rol: readonly
```

Si se cambian desde la app, los cambios se persisten en Firebase. El botón "Restaurar accesos" en el login resetea a los defaults.

---

## Componentes internos principales

- `BookingSheet` — bottom sheet mobile para crear/editar reservas
- `FG` — Field Group, wrapper de label + input para desktop
- `DamfieldLogo` — SVG inline del logo
- `useIsMobile()` — hook que detecta viewport < 768px

---

## Cosas que NO hacer

- No crear archivos CSS externos — todo inline
- No crear nuevos archivos JS/JSX — todo en App.jsx
- No tocar `dbGet`, `dbSet`, `expandRecurrence`, `hasConflict`, `CONFLICT_GROUPS`
- No cambiar `ESCRITORIO_MAX`
- No commitear `.github_token`
- No separar componentes en archivos separados
