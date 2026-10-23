import { expect, test, type Browser, type Page } from '@playwright/test';
import {
  createFakeState,
  injectSession,
  installFakeSupabase,
  TOKENS,
  type FakeState,
} from './fake-supabase';

async function openAs(
  browser: Browser,
  state: FakeState,
  token: string,
  path: string,
  viewport?: { width: number; height: number },
): Promise<{ page: Page; context: Awaited<ReturnType<Browser['newContext']>> }> {
  const context = await browser.newContext(viewport ? { viewport } : undefined);
  await injectSession(context, state, token);
  const page = await context.newPage();
  await installFakeSupabase(page, state);
  await page.goto(path);
  return { page, context };
}

async function createPurchase(page: Page, amount: string) {
  await page.goto('/admin');
  await expect(page.getByRole('heading', { name: 'Generar QR' })).toBeVisible();
  await page.getByLabel('Importe en pesos colombianos').fill(amount);
  await page.getByRole('button', { name: 'Generar QR' }).click();
  await expect(page.getByText('Escanéalo para sumar puntos')).toBeVisible();
  const claimUrl = await page.getByTestId('claim-url').textContent();
  expect(claimUrl).toBeTruthy();
  return claimUrl!;
}

test('flujo completo: QR, reclamación, canje del admin y devolución', async ({ browser }) => {
  const state = createFakeState();
  const admin = await openAs(browser, state, TOKENS.admin, '/admin');

  const claimUrl = await createPurchase(admin.page, '50000');
  expect(claimUrl).toMatch(/\/claim\/tok_/);
  expect(state.purchases).toHaveLength(1);
  expect(state.purchases[0].status).toBe('pending_claim');
  await expect(admin.page.getByText('+50 puntos estimados')).toBeVisible();

  const customer = await openAs(browser, state, TOKENS.customer, claimUrl);
  await expect(
    customer.page.getByRole('heading', { name: 'Asocia tu compra' }),
  ).toBeVisible();
  await customer.page
    .getByRole('button', { name: 'Confirmar y sumar puntos' })
    .click();

  await expect(customer.page.getByText('¡Compra asociada!')).toBeVisible();
  await expect(customer.page.getByText('+50', { exact: true })).toBeVisible();
  expect(state.purchases[0].status).toBe('claimed');
  expect(state.users.find((user) => user.token === TOKENS.customer)?.balance).toBe(50);

  await customer.page.getByRole('link', { name: 'Ver mi panel' }).click();
  await expect(
    customer.page.getByRole('heading', { name: /¡Hola, Carla!/ }),
  ).toBeVisible();
  await expect(customer.page.getByTestId('points-balance')).toHaveText('50');
  await expect(customer.page.getByText('carla@example.test')).toBeVisible();

  // El cliente ve el catálogo y lo que puede reclamar, sin botón de canje.
  await expect(customer.page.getByText('Taco individual')).toBeVisible();
  await expect(customer.page.getByText('Disponible').first()).toBeVisible();
  await expect(customer.page.getByRole('button', { name: /^canjear$/i })).toHaveCount(0);

  // Historial de compras con los puntos ganados.
  await customer.page.getByRole('link', { name: 'Compras' }).first().click();
  await expect(
    customer.page.getByRole('heading', { name: 'Mis compras' }),
  ).toBeVisible();
  await expect(
    customer.page.getByRole('table').getByText('+50', { exact: true }),
  ).toBeVisible();

  // El administrador busca al cliente y aplica el canje.
  await admin.page.goto('/admin/customers');
  await expect(admin.page.getByRole('heading', { name: 'Clientes' })).toBeVisible();
  await expect(
    admin.page.getByRole('table').getByText('Carla Cliente'),
  ).toBeVisible();
  await admin.page
    .getByRole('link', { name: 'Ver detalle' })
    .first()
    .click();

  await expect(
    admin.page.getByRole('heading', { name: 'Carla Cliente' }),
  ).toBeVisible();
  await expect(admin.page.getByTestId('customer-points-balance')).toHaveText('50');

  await admin.page.getByRole('combobox', { name: 'Recompensa' }).click();
  await admin.page.getByRole('option', { name: /Taco individual/ }).click();
  await admin.page.getByRole('button', { name: 'Aplicar canje' }).click();
  await expect(
    admin.page.getByRole('dialog').getByText('Canjear Taco individual'),
  ).toBeVisible();
  await admin.page
    .getByRole('dialog')
    .getByRole('button', { name: 'Confirmar canje' })
    .click();

  await expect(admin.page.getByTestId('customer-points-balance')).toHaveText('10');
  await expect(admin.page.getByText('Entregado').first()).toBeVisible();
  expect(state.redemptions).toHaveLength(1);
  expect(state.redemptions[0].status).toBe('redeemed');
  expect(state.users.find((user) => user.token === TOKENS.customer)?.balance).toBe(10);

  // El cliente ve el canje y su nuevo saldo.
  await customer.page.goto('/customer');
  await expect(customer.page.getByTestId('points-balance')).toHaveText('10');
  await customer.page.getByRole('link', { name: 'Canjes' }).first().click();
  await expect(
    customer.page.getByRole('heading', { name: 'Mis canjes' }),
  ).toBeVisible();
  await expect(customer.page.getByText('Taco individual')).toBeVisible();
  await expect(customer.page.getByText('Entregado').first()).toBeVisible();

  // Anulación con devolución de puntos.
  await admin.page.getByRole('button', { name: 'Anular y devolver' }).click();
  await admin.page.getByLabel('Motivo').fill('Se aplicó a la persona equivocada');
  await admin.page
    .getByRole('dialog')
    .getByRole('button', { name: 'Anular y devolver' })
    .click();

  await expect(admin.page.getByTestId('customer-points-balance')).toHaveText('50');
  await expect(admin.page.getByText('Cancelado').first()).toBeVisible();
  expect(state.redemptions[0].status).toBe('cancelled');
  expect(state.users.find((user) => user.token === TOKENS.customer)?.balance).toBe(50);

  await admin.context.close();
  await customer.context.close();
});

test('rechaza el reclamo duplicado de un mismo QR', async ({ browser }) => {
  const state = createFakeState();
  const admin = await openAs(browser, state, TOKENS.admin, '/admin');
  const claimUrl = await createPurchase(admin.page, '20000');

  const first = await openAs(browser, state, TOKENS.customer, claimUrl);
  await first.page
    .getByRole('button', { name: 'Confirmar y sumar puntos' })
    .click();
  await expect(first.page.getByText('¡Compra asociada!')).toBeVisible();

  const second = await openAs(browser, state, TOKENS.customer2, claimUrl);
  await second.page
    .getByRole('button', { name: 'Confirmar y sumar puntos' })
    .click();
  await expect(
    second.page.getByText('Esta compra ya fue reclamada por una cuenta.'),
  ).toBeVisible();

  expect(state.purchases[0].status).toBe('claimed');
  expect(
    state.users.find((user) => user.token === TOKENS.customer2)?.balance,
  ).toBe(0);

  await admin.context.close();
  await first.context.close();
  await second.context.close();
});

test('rechaza un QR expirado y muestra un mensaje claro', async ({ browser }) => {
  const state = createFakeState();
  const admin = await openAs(browser, state, TOKENS.admin, '/admin');
  const claimUrl = await createPurchase(admin.page, '12000');

  state.purchases[0].expiresAt = new Date(Date.now() - 60_000).toISOString();

  const customer = await openAs(browser, state, TOKENS.customer, claimUrl);
  await customer.page
    .getByRole('button', { name: 'Confirmar y sumar puntos' })
    .click();
  await expect(customer.page.getByText(/Este QR ya expiró/)).toBeVisible();
  expect(state.users.find((user) => user.token === TOKENS.customer)?.balance).toBe(0);

  await admin.context.close();
  await customer.context.close();
});

test('el administrador actualiza reglas y crea recompensas', async ({ browser }) => {
  const state = createFakeState();
  const admin = await openAs(browser, state, TOKENS.admin, '/admin/settings');
  await expect(
    admin.page.getByRole('heading', { name: 'Configuración', exact: true }),
  ).toBeVisible();

  await admin.page.getByLabel('COP por punto').fill('2000');
  await admin.page
    .getByRole('button', { name: 'Guardar configuración' })
    .click();
  await expect.poll(() => state.settings.cop_per_point_unit).toBe(2000);

  await admin.page.getByRole('button', { name: 'Nueva' }).click();
  const dialog = admin.page.getByRole('dialog');
  await dialog.getByLabel('Nombre').fill('Quesadilla de prueba');
  await dialog.getByLabel('Costo en puntos').fill('15');
  await dialog.getByRole('button', { name: 'Guardar' }).click();

  await expect(admin.page.getByText('Quesadilla de prueba')).toBeVisible();
  expect(
    state.rewards.some((reward) => reward.name === 'Quesadilla de prueba'),
  ).toBe(true);

  await admin.context.close();
});

test('un cliente no puede entrar al panel de administración', async ({ browser }) => {
  const state = createFakeState();
  const customer = await openAs(browser, state, TOKENS.customer, '/admin');
  await expect(
    customer.page.getByRole('heading', { name: 'Acceso restringido' }),
  ).toBeVisible();
  await expect(customer.page).toHaveURL(/\/unauthorized/);
  await customer.context.close();
});

test('el portal del cliente y el panel funcionan en un teléfono', async ({ browser }) => {
  const state = createFakeState();
  const mobile = { width: 390, height: 844 };

  const customer = await openAs(
    browser,
    state,
    TOKENS.customer,
    '/customer',
    mobile,
  );
  await expect(customer.page.getByTestId('points-balance')).toBeVisible();
  const customerNav = customer.page.getByRole('navigation', {
    name: 'Navegación inferior',
  });
  await expect(customerNav.getByRole('link', { name: 'Inicio' })).toBeVisible();
  await expect(customerNav.getByRole('link', { name: 'Compras' })).toBeVisible();
  await expect(customerNav.getByRole('link', { name: 'Canjes' })).toBeVisible();

  const admin = await openAs(browser, state, TOKENS.admin, '/admin', mobile);
  await expect(admin.page.getByRole('heading', { name: 'Generar QR' })).toBeVisible();
  const adminNav = admin.page.getByRole('navigation', {
    name: 'Navegación del administrador',
  });
  await expect(adminNav.getByRole('link', { name: 'Clientes' })).toBeVisible();
  await expect(adminNav.getByRole('link', { name: 'Configuración' })).toBeVisible();

  await admin.page.goto('/admin/customers');
  await expect(admin.page.getByRole('heading', { name: 'Clientes' })).toBeVisible();
  await expect(
    admin.page.getByRole('link', { name: /ver detalle y canjear/i }).first(),
  ).toBeVisible();

  await customer.context.close();
  await admin.context.close();
});
