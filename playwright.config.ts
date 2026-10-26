import { defineConfig, devices } from '@playwright/test';

// Puerto dedicado a E2E: evita reutilizar un `npm run dev` abierto en 5173
// que apunte a otro backend (p. ej. Supabase alojado) y haría fallar la sesión.
const port = Number(process.env.E2E_PORT ?? 5199);

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    viewport: { width: 1280, height: 900 },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `VITE_SUPABASE_URL=http://127.0.0.1:54321 VITE_SUPABASE_ANON_KEY=test-anon-key VITE_BRAND_NAME="Loopoint" VITE_BRAND_TAGLINE="Loopoints por tus compras" npm run dev -- --host 127.0.0.1 --port ${port}`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
