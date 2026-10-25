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

- **Cliente:** login con Google o correo/contraseña, selección de negocio, saldo por
  negocio, historial de puntos, recompensas, solicitud de canje con QR y “Mis
  canjes” con reemisión.
- **Administrador:** programa de puntos, carta, recompensas, campañas, solicitudes,
  miembros, compras con reverso, panel económico, auditoría y wizard de configuración.
- **Encargado:** validación de QR, aprobación/rechazo y confirmación de entrega.
- **Multiempresa:** roles por negocio, selector persistido, guards y afiliación
  pública por `/join/:slug`.
- **Diseño móvil primero:** navegación inferior, tarjetas, tipografía grande y
  objetivos táctiles amplios.

Estado y cifras de pruebas: ver el README del workspace (`../README.md`) y
`documentacion/PRUEBAS.md`.

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
npm test             # Vitest + Testing Library (99 pruebas)
npm run test:e2e     # Playwright, 18 flujos (backend Supabase simulado)
npm run test:build   # build + smoke test del bundle
npm run test:all     # typecheck + unitarias + E2E
```

Los E2E usan el puerto **5199** para no reutilizar un `npm run dev` con otro backend.
Si está ocupado: `E2E_PORT=5200 npm run test:e2e`.

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
    admin/              programa, carta, recompensas, campañas, solicitudes,
                        miembros, compras, económico, auditoría y onboarding
    loyalty/            contexto de negocio, selector, afiliación y encargado
    customer/           saldo por negocio, compras, canjes y QR
    purchases/          reclamación del QR legacy
    points/ rewards/    hooks de datos legacy
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
| `/join/:slug` | Público | Ficha del negocio y afiliación al programa |
| `/business/select` | Autenticado | Elegir negocio (la elección se recuerda por usuario) |
| `/business/register` | Autenticado | Registrar un negocio nuevo como administrador |
| `/customer` | Cualquier usuario | Saldo, recompensas y compras recientes |
| `/customer/purchases` | Cualquier usuario | Historial con puntos por compra |
| `/customer/redemptions` | Cualquier usuario | Mis canjes, estado y QR de entrega |
| `/admin` | Solo admin | QR de compra (sistema anterior) |
| `/admin/dashboard` | Solo admin | Panel del negocio y accesos rápidos |
| `/admin/program` | Solo admin | Programa de puntos: acumulación, canje, bonos y presupuesto |
| `/admin/products` | Solo admin | Carta de productos y costos estimados |
| `/admin/rewards` | Solo admin | Recompensas: producto gratis, descuentos, vigencia y límites |
| `/admin/campaigns` | Solo admin | Campañas: multiplicador, bono, mínimo y vigencia |
| `/admin/redemptions` | Solo admin | Solicitudes: aprobar, rechazar, entregar o cancelar |
| `/admin/members` | Solo admin | Miembros y permiso de aprobación de canjes |
| `/admin/purchases/new` | Solo admin | Registrar compra presencial y acreditar puntos |
| `/admin/economic` | Solo admin | Perfil económico, presupuesto y snapshots |
| `/admin/audit` | Solo admin | Auditoría paginada por operación |
| `/admin/onboarding` | Solo admin | Wizard de configuración inicial en cuatro pasos |
| `/admin/customers` | Solo admin | Clientes con filtros y orden por puntos |
| `/admin/customers/:id` | Solo admin | Detalle y canje de recompensa |
| `/admin/purchases` | Solo admin | Compras y cancelaciones |
| `/admin/settings` | Solo admin | Reglas, catálogo y auditoría (sistema anterior) |
| `/encargado` | Admin/encargado | Validar QR, aprobar y confirmar entrega |

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
