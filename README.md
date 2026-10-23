# Fidelización — Web

Sitio web del sistema de fidelización: portal para clientes y panel de
administración. Consume el backend de Supabase que vive en el repositorio
[`fidelizacionApi`](https://github.com/leoCortes123/fidelizacionApi).

> **Repositorio:** `https://github.com/leoCortes123/fidelizacionWeb`
>
> La documentación funcional y técnica completa vive en el workspace local
> `documentacion/` (fuera de este repositorio), junto a los repositorios de la web,
> el API y la app Android.

## Qué incluye

- **Cliente:** login con Google o correo/contraseña, saldo de puntos, catálogo de
  recompensas e historial de compras y canjes.
- **Administrador:** generación del QR de compra, clientes ordenados por puntos,
  detalle del cliente, canje de recompensas con anulación y configuración.
- **Diseño móvil primero:** navegación inferior, tarjetas, tipografía grande y
  objetivos táctiles amplios.

## Stack

| Capa | Tecnología |
| --- | --- |
| Frontend | React 19 + TypeScript + Vite 6 |
| Estilos | Tailwind CSS 3 + componentes estilo shadcn/ui |
| Rutas | React Router 7 |
| Datos y estado | TanStack Query 5 |
| Backend | Supabase (PostgreSQL, Auth, PostgREST, RPC) — repo `fidelizacionApi` |
| QR | `qrcode.react` |
| Pruebas | Vitest + Testing Library + Playwright |

## Inicio rápido

Requisitos: Node.js 22+ y npm 10+.

```bash
cp .env.example .env
# Edita VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY con los datos del API.

npm ci
npm run dev          # http://127.0.0.1:5173
```

El backend debe estar disponible (Supabase local o alojado). Para levantarlo en
local, sigue el README de [`fidelizacionApi`](https://github.com/leoCortes123/fidelizacionApi).

### Variables de entorno

```dotenv
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=reemplaza-con-tu-anon-key
VITE_BRAND_NAME=Mi Negocio
VITE_BRAND_TAGLINE=Puntos por tus compras
VITE_PUBLIC_APP_URL=
```

- `VITE_SUPABASE_ANON_KEY` es la clave **pública** (`anon` o `publishable`). Es la
  única que puede llegar al navegador.
- Nunca agregues `service_role` ni `sb_secret_…` a este repositorio ni a `.env`.
- `.env` está en `.gitignore`; no se versiona ningún archivo con valores reales.

## Scripts

```bash
npm run dev          # servidor de desarrollo
npm run build        # typecheck + build de producción
npm run preview      # sirve dist/
npm run typecheck    # tsc -b
npm test             # Vitest + Testing Library
npm run test:e2e     # Playwright (backend Supabase simulado)
npm run test:build   # build + smoke test del bundle
npm run test:all     # typecheck + unitarias + E2E
```

Si el puerto 5173 está ocupado, ejecuta los E2E con
`E2E_PORT=5180 npm run test:e2e`.

Las pruebas SQL y de concurrencia viven en el repositorio del API.

## Estructura

```text
src/
  app/                  providers, router, query client
  components/
    layout/             shells (cliente/admin) y guards
    shared/             marca, estados, badges, diálogos
    ui/                 primitivas reutilizables
  features/
    auth/               sesión, Google OAuth, correo/contraseña, callback
    customer/           inicio con saldo y catálogo, compras, canjes
    purchases/          reclamación del QR
    admin/              QR, clientes, detalle/canje, compras, configuración
    points/ rewards/    hooks de datos
  lib/                  Supabase, formato COP/fechas, errores, config
  types/                tipos compartidos
tests/
  unit/                 Vitest + Testing Library
  e2e/                  Playwright + backend simulado
public/                 favicon y cabeceras estáticas
scripts/                smoke test del build
```

## Rutas principales

| Ruta | Acceso | Contenido |
| --- | --- | --- |
| `/` | Público | Presentación y acceso |
| `/login` | Público | Google, correo/contraseña y registro simple |
| `/claim/:token` | Autenticado | Reclamar una compra escaneando el QR |
| `/customer` | Cualquier usuario | Saldo, recompensas y compras recientes |
| `/customer/purchases` | Cualquier usuario | Historial con puntos por compra |
| `/customer/redemptions` | Cualquier usuario | Canjes aplicados por caja |
| `/admin` | Solo admin | Generar QR de compra |
| `/admin/customers` | Solo admin | Clientes con filtros y orden por puntos |
| `/admin/customers/:id` | Solo admin | Detalle y canje de recompensa |
| `/admin/purchases` | Solo admin | Compras y cancelaciones |
| `/admin/settings` | Solo admin | Reglas, catálogo y auditoría |

Las rutas antiguas `/registrar/*` y `/customer/rewards` redirigen a las nuevas.

## Seguridad

- La autorización real vive en PostgreSQL (RLS + RPC `SECURITY DEFINER`), no en el
  frontend.
- El navegador solo recibe la clave pública.
- Los secretos (`service_role`, contraseñas, tokens de Supabase CLI) no se versionan.
- Consulta la política completa en `documentacion/SEGURIDAD.md`.

## Despliegue

El proyecto está preparado para Vercel (`vercel.json` + `public/_headers`), con
fallback SPA y CSP. Configura las variables `VITE_*` en el panel del hosting y
reconstruye al cambiar de dominio. Los pasos detallados están en
`documentacion/DESPLIEGUE.md`.
