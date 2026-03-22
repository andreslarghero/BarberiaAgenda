# Agenda Barberia

MVP para gestion de una barberia con backend en Node.js + Express + Prisma/PostgreSQL y frontend en React + Vite.

## Stack

- Backend: Node.js, Express, Prisma, PostgreSQL (Supabase), JWT, Zod
- Frontend: React, Vite, React Router, Axios
- Testing/QA: script smoke E2E y coleccion Thunder Client

## Estructura del proyecto

- `src/`: backend modular (`auth`, `barbers`, `clients`, `services`, `appointments`, `schedules`, `blocked-times`)
- `prisma/`: modelo de datos y seed
- `frontend/`: panel administrativo
- `scripts/`: pruebas de humo E2E
- `.thunder-client/`: coleccion y environment para pruebas API

## Requisitos

- Node.js 20+
- npm 10+
- Base PostgreSQL (recomendado: Supabase)

## Configuracion de entorno (backend)

1. Copiar variables de entorno:

```bash
cp .env.example .env
```

2. Completar `DATABASE_URL`, `JWT_SECRET` y `PORT` en `.env`.

### Si falla la conexion a Supabase (`Can't reach database server` / P1001)

- **No es un problema de `src/config/prisma.js`**: solo carga `PrismaClient`; la conexion la define `DATABASE_URL`.
- **Conexion directa** usa `db.<ref>.supabase.co:5432`. Si no hay ruta de red (IPv6, firewall, proyecto pausado), falla asi.
- En **Supabase Dashboard**: comproba que el proyecto **no este pausado**; en **Connect** copiá la URI recomendada (a veces **Session** o **Transaction pooler** en `:6543` funciona cuando la directa no).
- Si pasás a **pooler transaccional** para la app, las migraciones con Prisma pueden requerir `DIRECT_URL` + `directUrl` en `schema.prisma` (ver [docs Supabase + Prisma](https://supabase.com/docs/guides/database/prisma)).

## Instalacion

En la raiz del proyecto (backend):

```bash
npm install
```

En el frontend:

```bash
cd frontend
npm install
```

## Prisma (migracion, cliente y seed)

Desde la raiz:

```bash
npm run prisma:migrate
npm run prisma:generate
npm run prisma:seed
```

## Desarrollo: backend vs frontend (no confundir puertos)

En este proyecto **el backend y el frontend son dos servidores distintos**. Tenes que levantar **ambos** para usar el panel web.

| Que es | URL en desarrollo |
|--------|-------------------|
| **API (backend)** | `http://localhost:3000` |
| **Healthcheck** | `http://localhost:3000/health` |
| **App web (frontend, Vite)** | `http://localhost:5173` |

**Importante:** abrir solo `http://localhost` o `http://127.0.0.1` **sin puerto** no sirve: el navegador usa el puerto 80 y aca no hay nada escuchando ahi. Siempre usá **`:3000`** para la API o **`:5173`** para la interfaz.

### Levantar todo (un comando, recomendado)

Desde la raiz del repo:

```bash
npm run dev
```

Eso levanta **backend y frontend en paralelo** y Vite **abre el navegador** en `http://localhost:5173`. Las llamadas del frontend van a la API en `http://localhost:3000` (ver `frontend/src/api/http.js`).

### Alternativa: dos terminales

**Terminal 1 — solo backend:**

```bash
npm run dev:backend
```

**Terminal 2 — solo frontend:**

```bash
npm run dev:frontend
```

### Si el backend no arranca (login falla, nodemon “crashed”)

Si en consola aparece **`EADDRINUSE`** / “address already in use **:::3000**”, el puerto 3000 ya está ocupado (suele ser otra instancia del backend). Guía concreta para **Windows PowerShell**:

#### Ver qué proceso escucha en 3000

```powershell
Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue |
  Select-Object LocalAddress, LocalPort, OwningProcess
```

Anotá el número de **OwningProcess** (es el PID).

#### Ver nombre del proceso (opcional)

```powershell
Get-Process -Id <PID>
```

(Sustituí `<PID>` por el número que salió arriba.)

#### Cerrar ese proceso

```powershell
Stop-Process -Id <PID> -Force
```

#### Alternativa con `netstat` + `taskkill`

```powershell
netstat -ano | findstr :3000
```

En la última columna aparece el **PID**. Luego:

```powershell
taskkill /PID <PID> /F
```

Si hay varias líneas con el mismo PID, alcanza con matar ese PID una vez.

#### Evitar que vuelva a pasar

- Usá **una sola** sesión con todo el stack: desde la raíz, `npm run dev`, y no abras otra terminal con `npm run dev` o `npm run dev:backend` al mismo tiempo.
- Antes de volver a levantar: en la terminal donde corría el backend, **Ctrl+C** y esperá a que termine.
- Si usás Cursor/VS Code con varias terminales, revisá que no quede una vieja con el API todavía corriendo.

#### Scripts útiles (raíz del repo)

| Script | Qué hace |
|--------|----------|
| `npm run dev` | Backend + frontend en paralelo |
| `npm run dev:backend` | Solo API (puerto del `.env`, por defecto 3000) |
| `npm run dev:frontend` | Solo Vite (5173) |

#### Después de liberar el 3000

Desde la raíz del repo:

```bash
npm run dev
```

La web: `http://localhost:5173` · API: `http://localhost:3000`.

## Endpoints clave

- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/services`
- `GET /api/barbers`
- `GET /api/clients`
- `GET /api/appointments`
- `GET /api/appointments/availability?barberId=&date=`

Healthcheck:

- `GET http://localhost:3000/health`

## Credenciales seed (admin)

- Email: `admin@agendabarberia.com`
- Password: `Admin1234!`

Si cambiaste el seed, estas credenciales pueden variar.

## Pruebas rapidas

- Script smoke E2E:

```bash
node scripts/smoke-e2e.js
```

- Thunder Client:
  - Importar `.thunder-client/Agenda Barberia API.collection.json`
  - Usar `.thunder-client/local.environment.json`

## Estado actual

El MVP incluye autenticacion, ABM de barberos/clientes/servicios, gestion de turnos con validaciones de negocio, horarios, bloqueos, y panel frontend para operaciones principales.
