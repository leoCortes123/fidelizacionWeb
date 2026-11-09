# Fidelización Web (React + Vite + Tailwind)

## Stack

React 19, Vite 6, TypeScript strict, Tailwind 3, React Router 7, TanStack Query 5, Supabase JS, Playwright, Vitest.

## Comandos

- Dev: `npm run dev` (http://127.0.0.1:5173)
- Tipos: `npm run typecheck`
- Unit: `npm test` (149). Un archivo: `npx vitest run tests/unit/<file>.test.tsx`
- E2E: `npm run test:e2e` (puerto 5199). Un spec: `npx playwright test tests/e2e/<file>.spec.ts`
- Build: `npm run build`; smoke: `npm run test:build`
- Todo: `npm run test:all`

## Estructura

- `src/app/` — App, router, queryClient.
- `src/components/` — layout, shared, ui (shadcn-style).
- `src/features/` — por dominio (admin, auth, customer, loyalty, points, profile, purchases, rewards).
- `src/lib/` — supabase client, helpers.
- `src/types/` — tipos (generar desde Supabase).
- `tests/unit/`, `tests/e2e/`.

## Convenciones

- Guards por rol y negocio (`RequireAuth`, `RequireBusinessRole`).
- Datos sensibles solo vía RPC; nunca `service_role`.
- Fechas en `America/Bogota`; dinero en COP `integer`.
- Imports absolutos no configurados; usar rutas relativas.

## Contexto

- Rutas: `../documentacion/ai/routes-web.md` (desde raíz del workspace).
- RPC: `../documentacion/ai/rpc-contract.md`.
- Gotchas: `../documentacion/ai/gotchas.md`.
