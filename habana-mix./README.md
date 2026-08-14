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