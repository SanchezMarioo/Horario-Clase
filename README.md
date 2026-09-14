# Horario DM2A · Desarrollo de Aplicaciones Multiplataforma

Aplicación web desarrollada en **Next.js (App Router)** con **TypeScript**, **Tailwind CSS v4**, **Prisma ORM** (base de datos compartida para toda la clase), **Clerk** para autenticación segura, **Calendario de Tareas y Exámenes**, y **Panel de Administración**.

---

## ✨ Características

- ⚡ **Next.js 16 + Turbopack**: Renderizado y compilación ultra rápida.
- 🎨 **Tailwind CSS v4**: Diseño *dark glassmorphic*, degradados ambientales y responsive.
- 🗄️ **Base de Datos Compartida (Prisma ORM)**:
  - Base de datos centralizada para que **todas las tareas y exámenes que publique un alumno o admin sean visibles en tiempo real para todos los compañeros**.
  - Compatible de fábrica con **Supabase**, **Neon**, **PostgreSQL** o SQLite mediante la variable estándar `DATABASE_URL`.
- 🗓️ **Calendario Académico y Agenda**:
  - Vista mensual interactiva de días con insignias coloreadas por asignatura.
  - Widget de próximos exámenes y entregas con cuentas atrás luminosas (*"Hoy"*, *"Mañana"*, *"En 3 días"*).
  - Cualquier alumno autenticado con Clerk puede publicar tareas y entregas para el grupo.
  - Los administradores/delegados pueden crear exámenes oficiales destacados y moderar eventos.
- 🔒 **Autenticación y Seguridad con Clerk**:
  - Rutas de administración (`/admin(.*)`) protegidas mediante Middleware en el edge.
  - Autorización en servidor (`auth()`) con lista blanca opcional de administradores (`ADMIN_EMAILS`).
  - Validación y sanitización estricta de formularios mediante **Zod** contra manipulaciones o XSS.
- 🛡️ **Panel de Administración (`/admin`)**:
  - Control y registro de faltas de asistencia por módulo (tope del 12%).
  - Pestaña de gestión de calendario y exámenes.
  - Barras de progreso con alertas (🟢 <50%, 🟡 50-80%, 🔴 >80%).

---

## 🚀 Puesta en Marcha

### 1. Variables de Entorno (`.env.local`)

```env
# Claves de Clerk (obtén las tuyas en https://dashboard.clerk.com)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/admin
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/admin

# (Opcional) Lista blanca de emails para acceso al panel de administración
ADMIN_EMAILS=tu_email@ejemplo.com

# Base de datos compartida (Prisma)
# En local:
DATABASE_URL="file:./dev.db"
# En la nube (Supabase / Neon para compartir entre todos los alumnos):
# DATABASE_URL="postgresql://usuario:password@host:5432/horario_dm2a"
```

### 2. Sincronizar Base de Datos
```bash
pnpm dlx prisma db push
```

### 3. Modo Desarrollo
```bash
pnpm dev
```
Accede en tu navegador a [http://localhost:3000](http://localhost:3000).
- Horario y Calendario: [http://localhost:3000](http://localhost:3000)
- Panel de Administración: [http://localhost:3000/admin](http://localhost:3000/admin)

### 4. Compilación para Producción
```bash
pnpm build
pnpm start
```
