# Habana Mix - Academia de Baile

Sitio web para la academia de baile Habana Mix, desarrollado con Next.js y Supabase.

## Configuración Inicial

### 1. Configurar Supabase

1. Crea un proyecto en [Supabase](https://supabase.com)
2. Ve a Settings > API y copia:
   - Project URL
   - anon public key

### 2. Configurar Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```bash
cp .env.local.example .env.local
```

Edita `.env.local` con tus credenciales de Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_proyecto
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_llave_anon
```

### 3. Ejecutar Scripts de Base de Datos

En el dashboard de Supabase, ve al SQL Editor y ejecuta los scripts en orden:

1. `scripts/001_habana_mix_schema.sql` - Esquema completo de la base de datos
2. `migrate/002_admin_credentials_table.sql` - Tabla de credenciales de administrador
3. `migrate/003_create_initial_admin.sql` - Crear usuario administrador inicial
4. `migrate/004_add_salt_column.sql` - Agregar columna salt a tabla existente
5. `migrate/005_hero_config_table.sql` - Tabla de configuración del hero
6. `migrate/006_admin_storage_policies.sql` - Políticas de storage para admin
7. `migrate/008_update_location_table_structure.sql` - Tabla de configuración de ubicación (Google Maps)
8. `migrate/009_about_config_table.sql` - Tabla de configuración de quienes somos
9. `migrate/010_add_badge_to_about.sql` - Agregar sello decorativo a quienes somos
10. `migrate/011_footer_config_table.sql` - Tabla de configuración del footer
11. `migrate/012_events_crud_functions.sql` - Funciones CRUD para eventos
12. `migrate/013_add_updated_to_events.sql` - Agregar campo updated_by a tablas de contenido

**Credenciales iniciales del administrador:**
- Usuario: `administrador`
- Contraseña: `habanamix2026`

⚠️ **Importante:** Cambia la contraseña después del primer acceso por seguridad.

### 4. Instalar Dependencias

```bash
npm install
```

### 5. Ejecutar el Proyecto

```bash
npm run dev
```

El sitio estará disponible en `http://localhost:3000`

## Panel de Administración

El panel de administración está disponible en `/admin`

- **Login**: Ingresa con el usuario y contraseña de administrador
- **Dashboard**: Una vez autenticado, accede a `/admin/dashboard`
- **Sesión**: Las sesiones duran 24 horas por seguridad

### Sistema de Autenticación

El sistema de autenticación del panel de administración:
- Usa credenciales específicas (usuario/contraseña) separadas del sistema de usuarios públicos
- Las contraseñas se almacenan como hash bcrypt en Supabase
- Incluye protección contra intentos fallidos (bloqueo temporal después de 5 intentos)
- Verificación de credenciales a través de funciones seguras de Supabase
- No hay credenciales hardcodeadas en el código

## Gestión de Administradores

### Crear un nuevo administrador

Ejecuta en el SQL Editor de Supabase:

```sql
SELECT public.create_or_update_admin(
  'nuevo_usuario',
  'contraseña_segura',
  'Nombre del Administrador',
  true
);
```

### Cambiar contraseña de administrador

```sql
SELECT public.create_or_update_admin(
  'administrador',
  'nueva_contraseña',
  'Administrador Principal',
  true
);
```

### Desactivar un administrador

```sql
SELECT public.create_or_update_admin(
  'administrador',
  'contraseña_actual',
  'Administrador Principal',
  false  -- Esto desactiva el admin
);
```

## Estructura del Proyecto

```
├── app/                  # Páginas de Next.js
│   ├── admin/           # Panel de administración
│   │   ├── page.tsx     # Login de administrador
│   │   └── dashboard/   # Dashboard protegido
│   └── page.tsx         # Página principal
├── components/          # Componentes React
│   └── ui/             # Componentes UI reutilizables
├── lib/                # Utilidades y configuraciones
│   ├── supabase.ts     # Cliente de Supabase
│   └── utils.ts        # Funciones auxiliares
├── migrate/            # Scripts de migración SQL
│   ├── 002_admin_credentials_table.sql
│   └── 003_create_initial_admin.sql
├── scripts/            # Scripts de base de datos
└── public/             # Archivos estáticos
```

## Scripts Disponibles

- `npm run dev` - Iniciar servidor de desarrollo
- `npm run build` - Compilar para producción
- `npm run start` - Iniciar servidor de producción
- `npm run lint` - Ejecutar linter

## Seguridad

- ✅ Autenticación de administrador a través de Supabase (sin credenciales en código)
- ✅ Contraseñas almacenadas como hash bcrypt
- ✅ Protección contra intentos fallidos (bloqueo temporal)
- ✅ Sesiones con expiración de 24 horas
- ✅ Row Level Security (RLS) habilitado en todas las tablas
- ✅ Variables de entorno en `.gitignore`
- ✅ Funciones SQL con `security definer` para operaciones sensibles

## Nuevo: Registro de asistencias para eventos gratuitos

Se agregó un sistema simple para que, cuando un evento está marcado como gratuito, el botón de reserva abra un formulario y guarde los datos en la base de datos.

- Migración nueva: `migrate/018_create_attendances_table.sql` — crear tabla `attendances`.
- Endpoint API: `POST /api/attendances` para recibir y almacenar reservas gratuitas.
- UI cliente: diálogo en `components/free-attendance-dialog.tsx`, integrado en `EventCard`.
- Panel admin: nueva vista en `/admin/dashboard` → pestaña `Asistencia` con separación `Gratuitos` / `Pagos` y agrupado por título del evento.

Para aplicar los cambios en Supabase ejecuta la migración (`018_create_attendances_table.sql`) desde el SQL Editor.

## Checkout de eventos pagos con Mercado Pago

Los eventos pagos usan Checkout Pro. El admin carga un monto numérico en ARS; ese es el importe final que se cobra al comprador. Mercado Pago descuenta sus cargos según la cuenta y el medio de pago. No se debe calcular una comisión fija en el frontend.

### Variables necesarias

Agrega estas variables en `.env.local` y en el proveedor de deploy:

```env
MERCADOPAGO_ACCESS_TOKEN=tu_access_token_de_mercado_pago
MERCADOPAGO_SECONDARY_ACCESS_TOKEN=tu_segundo_access_token_de_mercado_pago  # Opcional, para split payments
NEXT_PUBLIC_SITE_URL=https://tu-dominio.com
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

`SUPABASE_SERVICE_ROLE_KEY` es exclusivamente server-side y nunca debe comenzar con `NEXT_PUBLIC_` ni llegar al navegador.

### Migraciones

Ejecuta en Supabase, en orden, las migraciones nuevas:

1. `migrate/023_add_paid_event_checkout.sql`
2. `migrate/021_attendances_delete_policy.sql` si aún no fue ejecutada
3. `migrate/022_cascade_delete_attendances_on_event_delete.sql` si aún no fue ejecutada
4. `migrate/024_paid_checkout_orders.sql`
5. `migrate/025_cleanup_unapproved_paid_attendances.sql` para limpiar registros pagos antiguos no aprobados
6. `migrate/026_tickets_and_access_control.sql`

### Flujo de pago

1. El visitante completa nombre, apellido, DNI, email y teléfono.
2. El servidor obtiene el precio desde `events.price_amount`; nunca acepta un precio enviado por el navegador.
3. Se crea una orden de pago temporal y una preferencia de Mercado Pago.
4. El visitante es redirigido a Mercado Pago.
5. Mercado Pago llama a `POST /api/payments/webhook` para actualizar el estado de la orden.
6. Al volver a `/pago/exito`, el servidor consulta el pago, valida importe, moneda y referencia.
7. Solo si el pago está `approved` se crea la asistencia definitiva en `attendances`.

Los pagos rechazados o abandonados no crean asistencias y permiten volver a intentar con los mismos datos.

## Entradas QR y control de acceso

Cuando un pago queda aprobado se genera un código único de cinco caracteres y un QR con el formato `HM:CÓDIGO`. La pantalla `/pago/exito` muestra ambos y permite descargar un archivo con la entrada. También se envía por email un enlace privado para volver a abrirla y descargarla. El QR no contiene una URL, por lo que los lectores móviles no intentan navegar automáticamente.

El personal puede usar `/control-acceso` e ingresar con el mismo usuario y contraseña del panel admin. Luego puede validar el código manualmente o escanear el QR desde un navegador móvil compatible. Una entrada aprobada solo puede marcarse como utilizada una vez.

Para el envío de emails se usa Gmail SMTP:

```env
GMAIL_USER=habanamix2026@gmail.com
GMAIL_APP_PASSWORD=xxxxxxxxxxxxxxxx
GMAIL_FROM="Habana Mix <habanamix2026@gmail.com>"
```

Usá una contraseña de aplicación de Google, no la contraseña normal de Gmail. Si Gmail no está configurado, el pago y el ticket funcionan igual, pero no se envía el correo.

### Configuración de Google

1. Ingresá a `myaccount.google.com` con `habanamix2026@gmail.com`.
2. Activá la verificación en dos pasos en **Seguridad**.
3. En **Contraseñas de aplicaciones**, creá una aplicación llamada `Habana Mix`.
4. Copiá la contraseña de 16 caracteres en `GMAIL_APP_PASSWORD`.
5. En Vercel agregá las tres variables en el entorno correspondiente y redeployá.

No uses la contraseña habitual de Gmail ni compartas la contraseña de aplicación. El sistema envía la entrada individual y el recordatorio por evento con el QR adjunto y el código alfanumérico.

Para producción, configura la URL pública HTTPS como `NEXT_PUBLIC_SITE_URL` y usa credenciales de producción. Para pruebas, usa credenciales de prueba y una URL pública de túnel para que el webhook sea accesible.

## Sorteos por evento

La pestaña `Sorteo` del admin permite seleccionar un evento publicado, configurar premio y cantidad de ganadores, tomar una lista fija de participantes válidos y abrir una pantalla pública en `/sorteo/[id]`. Los pagos aprobados y las inscripciones gratuitas participan; pagos pendientes o rechazados quedan fuera.

Ejecutá también la migración:

```sql
migrate/027_raffles.sql
```

El sorteo se ejecuta una sola vez por sesión, guarda sus ganadores y puede proyectarse en pantalla completa.

## Split Payments (Pagos Divididos)

El sistema soporta división de pagos entre dos cuentas de MercadoPago de forma transparente para el usuario. Cuando un cliente paga una entrada, el sistema puede enviar automáticamente una parte del monto a una segunda cuenta de MercadoPago.

### Configuración

1. **Ejecutar las migraciones necesarias en Supabase:**
   - `migrate/028_add_split_payment_to_events.sql` - Agrega campos de configuración de split a la tabla events
   - `migrate/029_add_split_to_payment_orders.sql` - Agrega campos de seguimiento de split a payment_orders

2. **Configurar la segunda cuenta de MercadoPago:**
   - Agrega la variable de entorno `MERCADOPAGO_SECONDARY_ACCESS_TOKEN` en `.env.local` y en Vercel
   - Este token debe corresponder a la segunda cuenta de MercadoPago que recibirá la parte del pago

3. **Configurar el split en el evento:**
   - En el panel de administración, edita un evento de pago
   - Habilita la opción "Habilitar split payment"
   - Configura el monto fijo o el porcentaje que irá a la segunda cuenta
   - Agrega una descripción interna para referencia del administrador

### Funcionamiento

1. El usuario paga el monto total de la entrada a través de MercadoPago
2. Una vez aprobado el pago, el sistema crea automáticamente un segundo pago a la segunda cuenta
3. El segundo pago usa el `MERCADOPAGO_SECONDARY_ACCESS_TOKEN` para transferir el monto configurado
4. Todo el proceso es transparente para el usuario, que solo ve un pago
5. El sistema registra ambos pagos en la tabla `payment_orders` para auditoría

### Variables de Entorno

```env
MERCADOPAGO_ACCESS_TOKEN=tu_access_token_principal
MERCADOPAGO_SECONDARY_ACCESS_TOKEN=tu_access_token_secundario  # Opcional
```

### Consideraciones

- Si el split payment falla, el pago principal del usuario no se afecta
- Los errores del split payment se registran en `payment_orders.split_payment_error`
- El sistema puede configurarse con monto fijo o porcentaje del total
- Solo eventos de pago pueden tener split habilitado
- La segunda cuenta debe tener fondos suficientes para recibir transferencias
