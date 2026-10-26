import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { chromium } from '@playwright/test';

/**
 * Smoke test del build de producción.
 *
 * El servidor de desarrollo y los E2E no detectan errores que solo aparecen
 * con el bundle minificado (por ejemplo, un ciclo entre chunks que deja la
 * página en blanco). Este script sirve `dist/` con `vite preview` y comprueba
 * que las rutas principales renderizan sin excepciones en el navegador.
 */

if (!existsSync('dist/index.html')) {
  console.error('No existe dist/. Ejecuta "npm run build" antes del smoke test.');
  process.exit(1);
}

const port = Number(process.env.SMOKE_PORT ?? 4173);
const base = `http://127.0.0.1:${port}`;

const server = spawn(
  process.execPath,
  ['node_modules/vite/bin/vite.js', 'preview', '--port', String(port), '--strictPort'],
  { stdio: ['ignore', 'pipe', 'pipe'] },
);
let serverOutput = '';
server.stdout.on('data', (chunk) => {
  serverOutput += chunk;
});
server.stderr.on('data', (chunk) => {
  serverOutput += chunk;
});

async function waitForServer(timeoutMs = 30_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(base);
      if (response.ok) return;
    } catch {
      // Aún arrancando.
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new Error(`vite preview no arrancó a tiempo.\n${serverOutput}`);
}

const routes = [
  // La landing comercial se retiró: sin sesión `/` redirige a /login.
  { path: '/', expected: /Entra a tus loopoints/i },
  { path: '/login', expected: /Entra a tus loopoints/i },
  { path: '/ruta-inexistente', expected: /Página no encontrada/i },
];

let browser;
try {
  await waitForServer();
  browser = await chromium.launch();
  const page = await browser.newPage();
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  for (const { path, expected } of routes) {
    await page.goto(base + path, { waitUntil: 'networkidle', timeout: 30_000 });
    const text = await page.locator('body').innerText();
    if (!expected.test(text)) {
      throw new Error(
        `La ruta ${path} no renderizó lo esperado. Texto: ${text.slice(0, 200)}`,
      );
    }
  }

  if (pageErrors.length > 0) {
    throw new Error(`Errores en el navegador:\n${pageErrors.join('\n')}`);
  }

  console.log('✓ Smoke test del build de producción aprobado');
} finally {
  await browser?.close();
  server.kill('SIGTERM');
}
