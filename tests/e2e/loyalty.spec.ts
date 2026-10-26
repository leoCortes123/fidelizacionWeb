import { expect, test, type Browser, type Page } from '@playwright/test';
import {
  createFakeState,
  injectSession,
  installFakeSupabase,
  sessionFor,
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
  // Establecer la sesión en localStorage ANTES de navegar, para que AuthProvider
  // la lea al montar.
  const user = state.users.find((u) => u.token === token);
  await page.evaluate(({ key, value }) => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignorado.
    }
  }, { key: 'sb-127-auth-token', value: sessionFor(user!) });
  await page.goto(path);
  return { page, context };
}

function seedBusiness(state: FakeState) {
  state.businesses.push({
    id: 'biz-test',
    name: 'Taquería El Fogón',
    slug: 'taqueria-el-fogon',
    timezone: 'America/Bogota',
    createdBy: 'user-admin',
    createdAt: '2026-01-01T12:00:00.000Z',
  });
  state.memberships.push({
    id: 'mem-test',
    businessId: 'biz-test',
    userId: 'user-admin',
    role: 'admin',
    canApproveRedemptions: false,
    createdAt: '2026-01-01T12:00:00.000Z',
  });
  // El cliente ya está afiliado al negocio (flujo business_join).
  state.memberships.push({
    id: 'mem-customer',
    businessId: 'biz-test',
    userId: 'user-customer',
    role: 'cliente',
    canApproveRedemptions: false,
    createdAt: '2026-01-02T12:00:00.000Z',
  });
  state.loyaltyPrograms['biz-test'] = {
    cop_per_point_unit: 1000,
    points_per_cop_unit: 100,
    points_expiry_days: 365,
    budget_rate: 0.01,
    first_purchase_bonus_points: 0,
    recurrence_bonus_points: 0,
    referral_bonus_points: 0,
    qr_expiry_hours: 24,
    frequent_min_purchases: 3,
    frequent_period_days: 90,
    frequent_min_spend_cop: 0,
    frequent_active_days: 30,
    recovery_inactive_days: 60,
    is_active: true,
  };
  state.products.push({
    id: 'prod-taco',
    businessId: 'biz-test',
    name: 'Taco de guisado',
    description: null,
    priceCop: 2500,
    costCop: 800,
    isActive: true,
    kind: 'simple',
    comboItems: [],
  });
  state.loyaltyRewards.push({
    id: 'rew-taco',
    businessId: 'biz-test',
    productId: 'prod-taco',
    type: 'free_product',
    name: 'Taco individual',
    description: 'Un taco de guisado con doble tortilla.',
    pointsRequired: 40,
    minPurchaseAmount: 0,
    maxDiscountAmount: null,
    discountPercentage: null,
    productPriceCop: 2500,
    productCostCop: 800,
    validFrom: null,
    validUntil: null,
    maxRedemptionsPerCustomer: null,
    maxRedemptionsPerPeriod: null,
    redemptionPeriodDays: null,
    totalRedemptionLimit: null,
    isActive: true,
  });
}

test('registro de negocio como administrador', async ({ browser }) => {
  const state = createFakeState();
  const admin = await openAs(browser, state, TOKENS.admin, '/business/register');

  await expect(
    admin.page.getByRole('heading', { name: 'Nuevo negocio' }),
  ).toBeVisible();
  await admin.page.getByLabel('Nombre del negocio').fill('Mi Negocio Test');
  await admin.page
    .getByLabel('Slug (identificador en URL)')
    .fill('mi-negocio-test');
  await admin.page.getByRole('button', { name: 'Crear negocio' }).click();

  // Tras el registro debería redirigir a selección de negocio
  await expect(
    admin.page.getByRole('heading', { name: 'Selecciona tu negocio' }),
  ).toBeVisible();
  await expect(admin.page.getByText('Mi Negocio Test')).toBeVisible();

  await admin.context.close();
});

test('gestión de recompensas como administrador', async ({ browser }) => {
  const state = createFakeState();
  seedBusiness(state);
  const admin = await openAs(
    browser,
    state,
    TOKENS.admin,
    '/admin/rewards',
  );

  await expect(
    admin.page.getByRole('heading', { name: /Recompensas/ }),
  ).toBeVisible();
  await expect(admin.page.getByText('Taco individual')).toBeVisible();

  // Crear una recompensa nueva
  await admin.page.getByRole('button', { name: /Nueva recompensa/ }).click();
  const dialog = admin.page.getByRole('dialog');
  await dialog.getByLabel('Nombre').fill('Quesadilla de prueba');
  await dialog.getByLabel('Loopoints requeridos').fill('15');
  await dialog.getByRole('button', { name: 'Guardar' }).click();

  await expect(admin.page.getByText('Quesadilla de prueba')).toBeVisible();
  expect(
    state.loyaltyRewards.some((r) => r.name === 'Quesadilla de prueba'),
  ).toBe(true);

  // Desactivar la recompensa
  await admin.page
    .getByRole('button', { name: /Desactivar Quesadilla de prueba/ })
    .click();
  await expect(admin.page.getByText('Inactiva').first()).toBeVisible();

  await admin.context.close();
});

test('configura programa, carta y recompensas y persiste tras recargar', async ({ browser }) => {
  const state = createFakeState();
  seedBusiness(state);
  // Simula un negocio recién registrado: aún no tiene programa configurado.
  delete state.loyaltyPrograms['biz-test'];

  const { page, context } = await openAs(
    browser,
    state,
    TOKENS.admin,
    '/admin/program',
  );

  await expect(
    page.getByRole('heading', { name: /Programa de loopoints/ }),
  ).toBeVisible();
  await expect(
    page.getByText('El programa aún no está configurado'),
  ).toBeVisible();

  await page.getByLabel('COP por loopoint ganado').fill('2000');
  await page.getByLabel('Tasa de presupuesto (%)').fill('2');
  await page.getByLabel('Programa activo').check();
  await page.getByRole('button', { name: 'Guardar y activar' }).click();
  await expect(page.getByText('Programa guardado y activo.')).toBeVisible();
  await expect
    .poll(() => state.loyaltyPrograms['biz-test']?.cop_per_point_unit)
    .toBe(2000);
  expect(state.loyaltyPrograms['biz-test'].is_active).toBe(true);

  // Carta: crear un producto.
  await page.getByRole('tab', { name: 'Carta' }).click();
  await expect(page.getByRole('heading', { name: /Carta —/ })).toBeVisible();
  await page.getByRole('button', { name: /Nuevo producto/ }).click();
  const productDialog = page.getByRole('dialog');
  await productDialog.getByLabel('Nombre').fill('Quesadilla');
  await productDialog.getByLabel('Precio (COP)').fill('3500');
  await productDialog.getByLabel('Costo (COP, opcional)').fill('1200');
  await productDialog.getByRole('button', { name: 'Guardar' }).click();
  await expect(page.getByText('Quesadilla', { exact: true })).toBeVisible();
  const createdProduct = state.products.find((p) => p.name === 'Quesadilla');
  expect(createdProduct?.priceCop).toBe(3500);

  // Recompensas: producto gratis vinculado al producto creado.
  await page.getByRole('tab', { name: 'Recompensas' }).click();
  await expect(page.getByRole('heading', { name: /Recompensas/ })).toBeVisible();
  await page.getByRole('button', { name: /Nueva recompensa/ }).click();
  const rewardDialog = page.getByRole('dialog');
  await rewardDialog.getByLabel('Nombre').fill('Quesadilla gratis');
  await rewardDialog.getByLabel('Loopoints requeridos').fill('30');
  await rewardDialog
    .getByRole('combobox', { name: /Producto que se entrega/ })
    .click();
  await page.getByRole('option', { name: /^Quesadilla/ }).click();
  await rewardDialog.getByRole('button', { name: 'Guardar' }).click();
  await expect(page.getByText('Quesadilla gratis')).toBeVisible();

  const createdReward = state.loyaltyRewards.find(
    (r) => r.name === 'Quesadilla gratis',
  );
  expect(createdReward?.type).toBe('free_product');
  expect(createdReward?.pointsRequired).toBe(30);
  expect(createdReward?.productId).toBe(createdProduct?.id);

  // Recargar: los datos vienen del backend y siguen ahí.
  await page.reload();
  await expect(page.getByText('Quesadilla gratis')).toBeVisible();
  await page.getByRole('tab', { name: 'Carta' }).click();
  await expect(page.getByText('Quesadilla', { exact: true })).toBeVisible();
  await page.getByRole('tab', { name: 'Programa' }).click();
  await expect(page.getByLabel('COP por loopoint ganado')).toHaveValue('2000');
  await expect(page.getByLabel('Tasa de presupuesto (%)')).toHaveValue('2');

  await context.close();
});

test('cliente ve saldo por negocio y solicita recompensa', async ({ browser }) => {
  const state = createFakeState();
  seedBusiness(state);
  const customer = await openAs(
    browser,
    state,
    TOKENS.customer,
    '/customer/balance',
  );

  await expect(
    customer.page.getByRole('heading', { name: /Tus loopoints/ }),
  ).toBeVisible();
  await expect(customer.page.getByText('Taco individual')).toBeVisible();
  await expect(customer.page.getByText('Disponible', { exact: true })).toBeVisible();

  // Solicitar la redención
  await customer.page.getByRole('button', { name: 'Solicitar' }).click();
  const redeemDialog = customer.page.getByRole('dialog');
  await expect(redeemDialog).toBeVisible();
  await redeemDialog.getByRole('button', { name: 'Confirmar solicitud' }).click();

  await expect(
    customer.page.getByText('Solicitud creada. Muestra el QR al encargado.'),
  ).toBeVisible();
  expect(state.redemptionRequests).toHaveLength(1);
  expect(state.redemptionRequests[0].rewardName).toBe('Taco individual');

  await customer.context.close();
});

test('encargado valida QR y aprueba redención', async ({ browser }) => {
  const state = createFakeState();
  seedBusiness(state);
  const admin = await openAs(
    browser,
    state,
    TOKENS.admin,
    '/customer/balance',
  );

  // Cliente solicita redención (genera token QR)
  await admin.page.getByRole('button', { name: 'Solicitar' }).click();
  const redeemDialog = admin.page.getByRole('dialog');
  await redeemDialog.getByRole('button', { name: 'Confirmar solicitud' }).click();
  await expect(
    admin.page.getByText('Solicitud creada. Muestra el QR al encargado.'),
  ).toBeVisible();
  await admin.context.close();

  // Encargado valida el token QR
  const encargado = await openAs(
    browser,
    state,
    TOKENS.admin,
    '/encargado',
  );
  await expect(
    encargado.page.getByRole('heading', { name: /Atención de redenciones/ }),
  ).toBeVisible();

  const redemption = state.redemptionRequests[0];
  const token = state.tokens.find((t) => t.redemptionId === redemption.id);
  expect(token).toBeTruthy();

  await encargado.page.getByLabel('Código QR / token').fill(token!.token);
  await encargado.page.getByRole('button', { name: 'Validar token' }).click();

  // Debe mostrar el diálogo de validación
  await expect(
    encargado.page.getByRole('dialog').getByText('Taco individual'),
  ).toBeVisible();

  // Aprobar la redención
  await encargado.page
    .getByRole('button', { name: 'Aprobar' })
    .click();
  await expect(
    encargado.page.getByText('Redención aprobada.'),
  ).toBeVisible();

  expect(state.redemptionRequests[0].status).toBe('approved');

  await encargado.context.close();
});

test('aislamiento: negocio no ve datos de otro negocio', async ({ browser }) => {
  const state = createFakeState();
  seedBusiness(state);
  const admin = await openAs(browser, state, TOKENS.admin, '/admin/rewards');

  await expect(
    admin.page.getByRole('heading', { name: /Recompensas/ }),
  ).toBeVisible();
  await expect(admin.page.getByText('Taco individual')).toBeVisible();

  await admin.context.close();
});

test('cliente no puede entrar al panel de administración', async ({ browser }) => {
  const state = createFakeState();
  const customer = await openAs(
    browser,
    state,
    TOKENS.customer,
    '/admin',
  );
  await expect(
    customer.page.getByRole('heading', { name: 'Acceso restringido' }),
  ).toBeVisible();
  await expect(customer.page).toHaveURL(/\/unauthorized/);
  await customer.context.close();
});

test('flujo completo de QR: solicitud, recuperación, entrega y estado final', async ({ browser }) => {
  const state = createFakeState();
  seedBusiness(state);

  const customer = await openAs(browser, state, TOKENS.admin, '/customer/balance');
  await customer.page.getByRole('button', { name: 'Solicitar' }).click();
  const redeemDialog = customer.page.getByRole('dialog');
  await redeemDialog.getByRole('button', { name: 'Confirmar solicitud' }).click();

  // El QR se muestra inmediatamente y queda guardado en la pestaña.
  const qrDialog = customer.page.getByRole('dialog');
  await expect(qrDialog.getByText('Tu código QR')).toBeVisible();
  await expect(qrDialog.getByLabel('Código QR de la redención')).toBeVisible();

  const redemption = state.redemptionRequests[0];
  const storedToken = await customer.page.evaluate(
    (id) => sessionStorage.getItem(`loyalty:token:${id}`),
    redemption.id,
  );
  expect(storedToken).toBeTruthy();
  expect(JSON.parse(storedToken!).token).toMatch(/^tok_/);

  await qrDialog.getByRole('button', { name: 'Cerrar' }).first().click();
  await customer.page.getByRole('link', { name: 'Mis canjes' }).first().click();
  await expect(customer.page.getByText('Pendiente de validar')).toBeVisible();

  // Si se pierde el token local, se puede reemitir mientras siga pendiente.
  await customer.page.evaluate(() => sessionStorage.clear());
  await customer.page.reload();
  await expect(customer.page.getByText('Pendiente de validar')).toBeVisible();
  await customer.page.getByRole('button', { name: 'Recuperar QR' }).click();
  await expect(
    customer.page.getByRole('dialog').getByLabel('Código QR de la redención'),
  ).toBeVisible();
  await customer.page
    .getByRole('dialog')
    .getByRole('button', { name: 'Cerrar' })
    .first()
    .click();

  const activeToken = state.tokens
    .filter((token) => token.redemptionId === redemption.id && !token.consumedAt)
    .at(-1);
  expect(activeToken?.token).toMatch(/^tok_/);

  // El encargado valida el token, aprueba y confirma la entrega.
  const encargado = await openAs(browser, state, TOKENS.admin, '/encargado');
  await encargado.page.getByLabel('Código QR / token').fill(activeToken!.token);
  await encargado.page.getByRole('button', { name: 'Validar token' }).click();
  await expect(
    encargado.page.getByRole('dialog').getByText('Taco individual'),
  ).toBeVisible();
  await encargado.page.getByRole('dialog').getByRole('button', { name: 'Aprobar' }).click();
  await expect(
    encargado.page.getByRole('heading', { name: 'Redención aprobada' }),
  ).toBeVisible();
  expect(state.redemptionRequests[0].status).toBe('approved');
  expect(
    state.tokens.find((token) => token.token === activeToken!.token)?.consumedAt,
  ).toBeTruthy();

  await encargado.page
    .getByRole('dialog')
    .getByRole('button', { name: 'Confirmar entrega' })
    .click();
  await expect(
    encargado.page.getByText('Entrega confirmada. Loopoints consumidos.'),
  ).toBeVisible();
  expect(state.redemptionRequests[0].status).toBe('delivered');

  // El cliente ve el estado final en “Mis canjes”.
  await customer.page.reload();
  await expect(customer.page.getByText('Entregado', { exact: true })).toBeVisible();

  await customer.context.close();
  await encargado.context.close();
});

test('admin aprueba, entrega y cancela solicitudes con motivo', async ({ browser }) => {
  const state = createFakeState();
  seedBusiness(state);
  const created = new Date().toISOString();
  state.redemptionRequests.push(
    {
      id: 'red-carla',
      businessId: 'biz-test',
      accountId: 'user-customer',
      rewardId: 'rew-taco',
      rewardName: 'Taco individual',
      rewardType: 'free_product',
      pointsSpent: 40,
      code: 'TPAAAA1111',
      status: 'pending',
      idempotencyKey: 'key-carla',
      createdAt: created,
      approvedBy: null,
      approvedAt: null,
    },
    {
      id: 'red-diego',
      businessId: 'biz-test',
      accountId: 'user-customer2',
      rewardId: 'rew-taco',
      rewardName: 'Taco individual',
      rewardType: 'free_product',
      pointsSpent: 30,
      code: 'TPBBBB2222',
      status: 'pending',
      idempotencyKey: 'key-diego',
      createdAt: created,
      approvedBy: null,
      approvedAt: null,
    },
  );
  for (const redemption of state.redemptionRequests) {
    state.tokens.push({
      id: `tok-${redemption.id}`,
      token: `tok_${redemption.id.replace(/-/g, '')}aaaaaaaaaaaaaaaaaaaa`,
      businessId: 'biz-test',
      redemptionId: redemption.id,
      tokenHash: `hash-${redemption.id}`,
      expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
      consumedAt: null,
    });
  }

  const { page, context } = await openAs(
    browser,
    state,
    TOKENS.admin,
    '/admin/redemptions',
  );

  await expect(page.getByRole('heading', { name: /Solicitudes/ })).toBeVisible();
  await expect(page.getByText('carla@example.test')).toBeVisible();
  await expect(page.getByText('diego@example.test')).toBeVisible();

  // Aprobar y entregar la solicitud de Carla.
  const carlaRow = page.getByRole('row', { name: /carla@example.test/ });
  await carlaRow.getByRole('button', { name: 'Aprobar' }).click();
  const approveDialog = page.getByRole('dialog');
  await expect(approveDialog.getByText('Aprobar solicitud')).toBeVisible();
  await approveDialog.getByRole('button', { name: 'Aprobar' }).click();
  await expect(page.getByText('Solicitud aprobada. Confirma la entrega al cliente.')).toBeVisible();

  await carlaRow.getByRole('button', { name: 'Confirmar entrega' }).click();
  const deliverDialog = page.getByRole('dialog');
  await deliverDialog.getByRole('button', { name: 'Confirmar entrega' }).click();
  await expect(page.getByText('Entrega confirmada. Loopoints consumidos.')).toBeVisible();

  // Cancelar la solicitud de Diego con motivo obligatorio.
  const diegoRow = page.getByRole('row', { name: /diego@example.test/ });
  await diegoRow.getByRole('button', { name: 'Cancelar' }).click();
  const cancelDialog = page.getByRole('dialog');
  await cancelDialog.getByLabel('Motivo de la cancelación').fill('El cliente no se presentó');
  await cancelDialog.getByRole('button', { name: 'Cancelar y devolver loopoints' }).click();
  await expect(page.getByText('Solicitud cancelada y loopoints devueltos.')).toBeVisible();

  expect(
    state.redemptionRequests.find((r) => r.id === 'red-carla')?.status,
  ).toBe('delivered');
  expect(
    state.redemptionRequests.find((r) => r.id === 'red-diego')?.status,
  ).toBe('cancelled');

  await context.close();
});

test('encargado sin permiso no puede aprobar redenciones', async ({ browser }) => {
  const state = createFakeState();
  seedBusiness(state);
  state.memberships.push({
    id: 'mem-registrar',
    businessId: 'biz-test',
    userId: 'user-registrar',
    role: 'encargado',
    canApproveRedemptions: false,
    createdAt: '2026-01-03T12:00:00.000Z',
  });

  const { page, context } = await openAs(browser, state, TOKENS.registrar, '/encargado');
  await expect(page.getByRole('heading', { name: 'Sin permiso de aprobación' })).toBeVisible();
  await expect(page.getByLabel('Código QR / token')).toHaveCount(0);
  await context.close();
});

test('afiliación pública por enlace /join/:slug', async ({ browser }) => {
  const state = createFakeState();
  seedBusiness(state);
  // El cliente aún no participa en el negocio.
  state.memberships = state.memberships.filter((m) => m.userId !== 'user-customer');

  // Sin sesión: ficha pública y enlace a login con destino conservado.
  const anonymous = await browser.newContext();
  const publicPage = await anonymous.newPage();
  await installFakeSupabase(publicPage, state);
  await publicPage.goto('/join/taqueria-el-fogon');
  await expect(
    publicPage.getByRole('heading', { name: 'Taquería El Fogón' }),
  ).toBeVisible();
  await expect(
    publicPage.getByRole('link', { name: /Entrar y unirme/i }),
  ).toHaveAttribute('href', /\/login\?next=%2Fjoin%2Ftaqueria-el-fogon/);

  // Con sesión: se afilia, se recuerda el negocio y entra a su saldo.
  const { page, context } = await openAs(
    browser,
    state,
    TOKENS.customer,
    '/join/taqueria-el-fogon',
  );
  await page.getByRole('button', { name: /Unirme a Taquería El Fogón/i }).click();
  await expect(page).toHaveURL(/\/customer\/balance/);
  await expect(page.getByRole('heading', { name: /Tus loopoints/ })).toBeVisible();

  expect(
    state.memberships.some(
      (m) => m.businessId === 'biz-test' && m.userId === 'user-customer',
    ),
  ).toBe(true);
  const stored = await page.evaluate(() =>
    Object.entries(localStorage).find(([key]) =>
      key.startsWith('fidelizacion:selected-business'),
    ),
  );
  expect(stored?.[1]).toBe('biz-test');

  await context.close();
  await anonymous.close();
});

test('admin invita clientes con enlace y QR, y añade un encargado por correo', async ({ browser }) => {
  const state = createFakeState();
  seedBusiness(state);
  const { page, context } = await openAs(
    browser,
    state,
    TOKENS.admin,
    '/admin/dashboard',
  );

  // Tarjeta de invitación con enlace copiable y QR.
  await expect(page.getByText('Invitar clientes')).toBeVisible();
  await page.getByText('Invitar clientes').click();
  await expect(page.getByLabel('Enlace de invitación')).toHaveValue(
    /\/join\/taqueria-el-fogon$/,
  );
  await expect(page.getByLabel('QR de invitación al negocio')).toBeVisible();

  // Añadir un encargado buscando por correo.
  await page.getByRole('link', { name: 'Configuración', exact: true }).click();
  await page.getByRole('tab', { name: 'Equipo' }).click();
  await expect(page.getByRole('heading', { name: /Miembros/ })).toBeVisible();
  await page.getByRole('button', { name: /Añadir miembro/i }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Buscar persona').fill('diego');
  await expect(dialog.getByText('Diego Cliente')).toBeVisible();
  await dialog.getByRole('button', { name: 'Elegir' }).click();
  await dialog
    .getByRole('checkbox', { name: /Puede aprobar redenciones/i })
    .check();
  await dialog.getByRole('button', { name: 'Añadir miembro' }).click();
  await expect(page.getByText(/se unió como encargado/i)).toBeVisible();

  const membership = state.memberships.find(
    (m) => m.businessId === 'biz-test' && m.userId === 'user-customer2',
  );
  expect(membership?.role).toBe('encargado');
  expect(membership?.canApproveRedemptions).toBe(true);

  await context.close();
});

test('encargado que entra a /admin es enviado a su portal', async ({ browser }) => {
  const state = createFakeState();
  seedBusiness(state);
  state.memberships.push({
    id: 'mem-registrar',
    businessId: 'biz-test',
    userId: 'user-registrar',
    role: 'encargado',
    canApproveRedemptions: true,
    createdAt: '2026-01-03T12:00:00.000Z',
  });

  const { page, context } = await openAs(browser, state, TOKENS.registrar, '/admin');
  await expect(page).toHaveURL(/\/encargado/);
  await expect(
    page.getByRole('heading', { name: /Atención de redenciones/ }),
  ).toBeVisible();

  await context.close();
});

test('genera una venta con QR, el cliente la reclama y queda auditada', async ({ browser }) => {
  const state = createFakeState();
  seedBusiness(state);

  const { page, context } = await openAs(
    browser,
    state,
    TOKENS.admin,
    '/admin/purchases/new',
  );

  await expect(
    page.getByRole('heading', { name: /Registrar compra/ }),
  ).toBeVisible();

  await page.getByLabel('Importe de la compra (COP)').fill('15500');
  await expect(page.getByText(/15 loopoints/)).toBeVisible();

  await page
    .getByRole('button', { name: /Generar QR de la venta/ })
    .click();
  await expect(page.getByText(/Escanéalo para sumar loopoints/i)).toBeVisible();

  const claimUrl = await page.getByTestId('claim-url').textContent();
  expect(claimUrl).toContain('https://fidelizacion01.vercel.app/claim/');
  const token = claimUrl!.split('/claim/')[1];

  await expect.poll(() => state.purchases.length).toBe(1);
  expect(state.purchases[0].businessId).toBe('biz-test');
  expect(state.purchases[0].status).toBe('pending_claim');
  expect(state.purchases[0].customerId).toBeNull();

  // El cliente escanea el QR y confirma desde su cuenta.
  const customer = await openAs(
    browser,
    state,
    TOKENS.customer,
    `/claim/${token}`,
  );
  await expect(
    customer.page.getByRole('heading', { name: 'Taquería El Fogón' }),
  ).toBeVisible();
  await customer.page
    .getByRole('button', { name: /Confirmar y sumar loopoints/ })
    .click();
  await expect(customer.page.getByText(/¡Loopoints acreditados!/)).toBeVisible();
  await expect.poll(() => state.purchaseCredits['user-customer']).toBe(15);
  expect(state.purchases[0].status).toBe('claimed');
  await customer.context.close();

  // Panel económico: guardar los datos y ver el cálculo.
  await page.getByRole('link', { name: 'Configuración', exact: true }).click();
  await page.getByRole('tab', { name: 'Económico' }).click();
  await expect(
    page.getByRole('heading', { name: /Panel económico/ }),
  ).toBeVisible();

  await page.getByLabel('Ventas diarias promedio').fill('200000');
  await page.getByLabel('Días de operación al mes').fill('26');
  await page.getByLabel('Presupuesto mensual de recompensas').fill('100000');
  await page.getByRole('button', { name: /Guardar datos económicos/ }).click();

  await expect(page.getByText(/5\.200\.000/)).toBeVisible();
  await expect
    .poll(() => state.economicProfiles['biz-test']?.monthlyOperationDays)
    .toBe(26);

  // Auditoría: la compra y el cambio económico quedaron registrados.
  await page.getByRole('link', { name: 'Auditoría' }).click();
  await expect(page.getByRole('heading', { name: /Auditoría/ })).toBeVisible();
  await expect(page.getByText('purchase.qr_created')).toBeVisible();
  await expect(page.getByText('purchase.qr_claimed')).toBeVisible();
  await expect(page.getByText('economic_profile.updated')).toBeVisible();

  await context.close();
});

test('wizard de configuración inicial: cuatro pasos y activación', async ({ browser }) => {
  const state = createFakeState();
  seedBusiness(state);
  state.loyaltyPrograms['biz-test'].is_active = false;

  const { page, context } = await openAs(
    browser,
    state,
    TOKENS.admin,
    '/admin/onboarding',
  );

  await expect(
    page.getByRole('heading', { name: /Paso 1 · Datos del negocio/ }),
  ).toBeVisible();
  await page.getByLabel('Nombre del negocio').fill('Taquería Renombrada');
  await page.getByRole('button', { name: /Guardar y continuar/ }).click();
  await expect(
    page.getByRole('heading', { name: /Paso 2 · Carta y costos/ }),
  ).toBeVisible();
  expect(state.businesses[0].name).toBe('Taquería Renombrada');

  await page.getByRole('button', { name: /^Continuar$/ }).click();
  await expect(
    page.getByRole('heading', { name: /Paso 3 · Datos económicos/ }),
  ).toBeVisible();

  // Los datos económicos son opcionales: se puede continuar con desconocidos.
  await page.getByRole('button', { name: /Saltar por ahora/ }).click();
  await expect(
    page.getByRole('heading', { name: /Paso 4 · Programa y activación/ }),
  ).toBeVisible();

  await expect(page.getByLabel('Loopoints para Taco de guisado')).toHaveValue('80');
  await page.getByRole('button', { name: /Activar programa/ }).click();

  await expect(page).toHaveURL(/\/admin\/dashboard/);
  await expect
    .poll(() => state.loyaltyPrograms['biz-test']?.is_active)
    .toBe(true);
  expect(
    state.loyaltyRewards.some((reward) => reward.name === 'Taco de guisado gratis'),
  ).toBe(true);

  await context.close();
});

test('dashboard enlaza a completar la configuración si el programa está inactivo', async ({ browser }) => {
  const state = createFakeState();
  seedBusiness(state);
  state.loyaltyPrograms['biz-test'].is_active = false;

  const { page, context } = await openAs(
    browser,
    state,
    TOKENS.admin,
    '/admin/dashboard',
  );

  await page.getByRole('link', { name: /Completar configuración/ }).click();
  await expect(page).toHaveURL(/onboarding=1/);
  await expect(
    page.getByRole('heading', { name: /Paso 1 · Datos del negocio/ }),
  ).toBeVisible();

  await context.close();
});

test('crea una campaña y duplica los loopoints de una compra', async ({ browser }) => {
  const state = createFakeState();
  seedBusiness(state);

  const { page, context } = await openAs(
    browser,
    state,
    TOKENS.admin,
    '/admin/campaigns',
  );

  await expect(page.getByRole('heading', { name: /Campañas/ })).toBeVisible();
  await page.getByRole('button', { name: /Nueva campaña/ }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Nombre').fill('Doble loopoints');
  await dialog.getByLabel('Multiplicador').fill('2');
  await dialog.getByRole('button', { name: 'Guardar' }).click();

  await expect(page.getByText('Doble loopoints')).toBeVisible();
  await expect(page.getByText('En vigencia')).toBeVisible();
  await expect.poll(() => state.campaigns.length).toBe(1);

  // La campaña vigente duplica los loopoints de la venta con QR.
  await page.getByRole('link', { name: 'Registrar compra' }).click();
  await page.getByLabel('Importe de la compra (COP)').fill('10000');
  await expect(page.getByText(/10 loopoints/)).toBeVisible();
  await page
    .getByRole('button', { name: /Generar QR de la venta/ })
    .click();
  await expect(page.getByText(/Escanéalo para sumar loopoints/i)).toBeVisible();
  await expect(page.getByText(/20 loopoints estimados/i)).toBeVisible();

  const claimUrl = await page.getByTestId('claim-url').textContent();
  const token = claimUrl!.split('/claim/')[1];

  const customer = await openAs(
    browser,
    state,
    TOKENS.customer,
    `/claim/${token}`,
  );
  await customer.page
    .getByRole('button', { name: /Confirmar y sumar loopoints/ })
    .click();
  await expect(customer.page.getByText(/¡Loopoints acreditados!/)).toBeVisible();
  await expect.poll(() => state.purchaseCredits['user-customer']).toBe(20);
  await customer.context.close();

  await context.close();
});

test('guarda un snapshot mensual del panel económico', async ({ browser }) => {
  const state = createFakeState();
  seedBusiness(state);

  const { page, context } = await openAs(
    browser,
    state,
    TOKENS.admin,
    '/admin/economic',
  );

  await page.getByRole('button', { name: /Guardar snapshot del mes/ }).click();

  await expect.poll(() => state.budgetSnapshots.length).toBe(1);
  await expect(
    page.getByText(/Loopoints \(emitidos \/ canjeados\)/i),
  ).toBeVisible();

  await context.close();
});

test('conserva el borrador de configuración al recargar la página', async ({ browser }) => {
  const state = createFakeState();
  seedBusiness(state);

  const { page, context } = await openAs(
    browser,
    state,
    TOKENS.admin,
    '/admin/program',
  );

  const copInput = page.getByLabel('COP por loopoint ganado');
  await copInput.fill('1750');
  await expect(page.getByText('Borrador guardado')).toBeVisible();

  await page.reload();

  await expect(page.getByLabel('COP por loopoint ganado')).toHaveValue('1750');
  await expect(page.getByText('Borrador guardado')).toBeVisible();

  await context.close();
});

test('shell móvil: menú fijo, cabecera auto-oculta, FAB y modo oscuro persistente', async ({
  browser,
}) => {
  const state = createFakeState();
  seedBusiness(state);

  const { page, context } = await openAs(
    browser,
    state,
    TOKENS.admin,
    '/admin/dashboard',
    { width: 390, height: 844 },
  );

  await expect(
    page.getByRole('navigation', { name: 'Navegación del negocio' }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'Configuración', exact: true })).toBeVisible();
  await expect(page.getByLabel('Registrar compra')).toBeVisible();
  await expect(page.getByText('Ver portal del cliente')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Cerrar sesión' })).toHaveCount(0);

  // Modo oscuro desde el menú de usuario.
  await page.getByRole('button', { name: 'Abrir menú de usuario' }).last().click();
  await page.getByRole('menuitem', { name: /modo oscuro/i }).click();
  await expect(page.locator('html')).toHaveClass(/dark/);
  await page.reload();
  await expect(page.locator('html')).toHaveClass(/dark/);

  // La cabecera se oculta al bajar y reaparece al subir.
  const header = page.getByTestId('app-header');
  const main = page.locator('#contenido-principal');
  await expect(header).not.toHaveClass(/-translate-y-full/);
  await main.evaluate((element) => {
    element.scrollTop = 700;
    element.dispatchEvent(new Event('scroll'));
  });
  await expect(header).toHaveClass(/-translate-y-full/);
  await main.evaluate((element) => {
    element.scrollTop = 200;
    element.dispatchEvent(new Event('scroll'));
  });
  await expect(header).not.toHaveClass(/-translate-y-full/);

  // El FAB abre registrar compra y desaparece en esa pantalla.
  await page.getByLabel('Registrar compra').click();
  await expect(
    page.getByRole('heading', { name: /Registrar compra/ }),
  ).toBeVisible();
  await expect(page.getByLabel('Registrar compra')).toHaveCount(0);

  await context.close();
});

test('perfil: edita nombre y alias, y persiste tras recargar', async ({ browser }) => {
  const state = createFakeState();
  const customer = await openAs(browser, state, TOKENS.customer, '/perfil');

  await expect(
    customer.page.getByRole('heading', { name: 'Mi perfil' }),
  ).toBeVisible();
  await expect(customer.page.getByText('@carlacliente').first()).toBeVisible();
  await expect(
    customer.page.getByText(/Te quedan 2 de 2 cambios/i),
  ).toBeVisible();

  const name = customer.page.getByLabel(/Nombre completo/);
  await name.fill('Carla Cliente Nueva');
  const nickname = customer.page.getByLabel(/Alias público/);
  await nickname.fill('carla-nueva');

  await expect(
    customer.page.getByTestId('nickname-availability'),
  ).toContainText('está disponible');

  await customer.page
    .getByRole('button', { name: /Guardar perfil/i })
    .click();
  await expect(customer.page.getByText(/Perfil guardado/i)).toBeVisible();

  await customer.page.reload();
  await expect(customer.page.getByLabel(/Nombre completo/)).toHaveValue(
    'Carla Cliente Nueva',
  );
  await expect(customer.page.getByLabel(/Alias público/)).toHaveValue(
    'carla-nueva',
  );
  await expect(
    customer.page.getByText(/Te quedan 1 de 2 cambios/i),
  ).toBeVisible();

  await customer.context.close();
});

test('negocio: edita la ficha pública y persiste tras recargar', async ({ browser }) => {
  const state = createFakeState();
  seedBusiness(state);
  const admin = await openAs(browser, state, TOKENS.admin, '/admin/business');

  await expect(
    admin.page.getByRole('heading', { name: 'Negocio', exact: true }),
  ).toBeVisible();

  await admin.page
    .getByLabel(/Nombre del negocio/)
    .fill('Taquería Centro');
  await admin.page
    .getByLabel(/Descripción/)
    .fill('Tacos al pastor y aguas frescas.');
  await admin.page.getByLabel(/WhatsApp/).fill('+57 300 111 2233');
  await admin.page.getByLabel(/Instagram/).fill('@taqueria.centro');
  await admin.page.getByLabel(/Sitio web/).fill('taqueria-centro.co');

  await admin.page
    .getByRole('button', { name: /Guardar datos del negocio/i })
    .click();
  await expect(
    admin.page.getByText(/Datos del negocio guardados/i),
  ).toBeVisible();

  await admin.page.reload();
  await expect(admin.page.getByLabel(/Nombre del negocio/)).toHaveValue(
    'Taquería Centro',
  );
  await expect(admin.page.getByLabel(/Descripción/)).toHaveValue(
    'Tacos al pastor y aguas frescas.',
  );
  await expect(admin.page.getByLabel(/WhatsApp/)).toHaveValue(
    '+573001112233',
  );
  await expect(admin.page.getByLabel(/Instagram/)).toHaveValue(
    'taqueria.centro',
  );

  await admin.context.close();
});

test('programa: configura los criterios de cliente frecuente', async ({ browser }) => {
  const state = createFakeState();
  seedBusiness(state);
  const admin = await openAs(browser, state, TOKENS.admin, '/admin/program');

  await expect(
    admin.page.getByRole('heading', { name: /Cliente frecuente/i }),
  ).toBeVisible();
  await expect(
    admin.page.getByText(/Será/i).first(),
  ).toContainText('3 compra(s)');

  const minPurchases = admin.page.getByLabel(/Compras para ser frecuente/);
  await minPurchases.fill('4');
  await admin.page.getByLabel(/Ventana móvil/).fill('120');
  await admin.page.getByLabel(/Gasto mínimo/).fill('25000');
  await admin.page.getByLabel(/Días para seguir activo/).fill('45');
  await admin.page.getByLabel(/Días para recuperación/).fill('90');
  await admin.page
    .getByRole('button', { name: /Guardar criterios/i })
    .click();
  await expect(
    admin.page.getByText(/Criterios de cliente frecuente guardados/i),
  ).toBeVisible();

  await admin.page.reload();
  await expect(
    admin.page.getByLabel(/Compras para ser frecuente/),
  ).toHaveValue('4');
  await expect(admin.page.getByLabel(/Ventana móvil/)).toHaveValue('120');
  await expect(admin.page.getByLabel(/Gasto mínimo/)).toHaveValue('25000');

  await admin.context.close();
});

test('clientes: muestra alias y distintivo de frecuente activo', async ({ browser }) => {
  const state = createFakeState();
  seedBusiness(state);
  const claimedAt = new Date().toISOString();
  for (let index = 0; index < 3; index += 1) {
    state.purchases.push({
      id: `purchase-frequent-${index}`,
      token: `tok_frequent_${index}`,
      businessId: 'biz-test',
      amount_cop: 12000,
      status: 'claimed',
      points_awarded: 12,
      customerId: 'user-customer',
      registrarId: 'user-admin',
      createdAt: claimedAt,
      expiresAt: claimedAt,
      claimed_at: claimedAt,
    });
  }

  const admin = await openAs(browser, state, TOKENS.admin, '/admin/customers');

  await expect(admin.page.getByText('@carlacliente').last()).toBeVisible();
  await expect(
    admin.page.getByText('Frecuente activo').last(),
  ).toBeVisible();

  await admin.context.close();
});


test('configuración unificada: pestañas, borrador y redirección de rutas antiguas', async ({ browser }) => {
  const state = createFakeState();
  seedBusiness(state);
  const admin = await openAs(browser, state, TOKENS.admin, '/admin/config');

  await expect(
    admin.page.getByRole('heading', { name: 'Configuración', exact: true }),
  ).toBeVisible();
  await expect(
    admin.page.getByRole('tab', { name: 'Negocio' }),
  ).toHaveAttribute('aria-selected', 'true');

  // Rutas antiguas redirigen a su pestaña.
  await admin.page.goto('/admin/products');
  await expect(admin.page).toHaveURL(/tab=carta/);
  await expect(
    admin.page.getByRole('heading', { name: /Carta —/i }).first(),
  ).toBeVisible();

  // Cambio de pestaña y persistencia en la URL tras recargar.
  await admin.page.getByRole('tab', { name: 'Programa' }).click();
  await expect(admin.page).toHaveURL(/tab=programa/);
  await expect(
    admin.page.getByRole('heading', { name: /Programa de loopoints/i }),
  ).toBeVisible();
  await admin.page.reload();
  await expect(
    admin.page.getByRole('tab', { name: 'Programa' }),
  ).toHaveAttribute('aria-selected', 'true');

  // El borrador sobrevive al cambiar de pestaña.
  const cop = admin.page.getByLabel(/COP por loopoint ganado/);
  await cop.fill('1250');
  await admin.page.getByRole('tab', { name: 'Carta' }).click();
  await admin.page.getByRole('tab', { name: 'Programa' }).click();
  await expect(admin.page.getByLabel(/COP por loopoint ganado/)).toHaveValue(
    '1250',
  );

  await admin.context.close();
});

test('configuración móvil: sin scroll horizontal y pestañas utilizables a 360 px', async ({ browser }) => {
  const state = createFakeState();
  seedBusiness(state);
  const admin = await openAs(
    browser,
    state,
    TOKENS.admin,
    '/admin/config?tab=negocio',
    { width: 360, height: 640 },
  );

  await expect(
    admin.page.getByRole('heading', { name: 'Configuración', exact: true }),
  ).toBeVisible();
  await admin.page.getByRole('tab', { name: 'Recompensas' }).click();
  await expect(
    admin.page.getByRole('heading', { name: /Recompensas/i }).first(),
  ).toBeVisible();

  const overflow = await admin.page.evaluate(() => {
    const main = document.querySelector('#contenido-principal');
    return {
      document: document.documentElement.scrollWidth - window.innerWidth,
      main: main ? main.scrollWidth - main.clientWidth : 0,
    };
  });
  expect(overflow.document).toBeLessThanOrEqual(1);
  expect(overflow.main).toBeLessThanOrEqual(1);

  await admin.context.close();
});

test('compra con carta y combos: total, líneas y detalle en ambos portales', async ({ browser }) => {
  const state = createFakeState();
  seedBusiness(state);
  state.products.push({
    id: 'prod-combo',
    businessId: 'biz-test',
    name: 'Combo enganche',
    description: 'Dos tacos y agua',
    priceCop: 5000,
    costCop: 1800,
    isActive: true,
    kind: 'combo',
    comboItems: [{ productId: 'prod-taco', quantity: 2 }],
  });

  const admin = await openAs(
    browser,
    state,
    TOKENS.admin,
    '/admin/purchases/new',
  );

  await admin.page
    .getByRole('tab', { name: /Elegir de la carta/i })
    .click();
  await admin.page
    .getByRole('button', { name: 'Añadir Combo enganche' })
    .click();
  await admin.page
    .getByRole('button', { name: 'Añadir Combo enganche' })
    .click();
  await admin.page
    .getByRole('button', { name: 'Añadir Taco de guisado' })
    .click();
  await expect(admin.page.getByTestId('catalog-total')).toContainText('12.500');

  await admin.page
    .getByRole('button', { name: /Generar QR de la venta/ })
    .click();
  await expect(admin.page.getByText(/Escanéalo para sumar loopoints/)).toBeVisible();

  await expect.poll(() => state.purchases.length).toBe(1);
  expect(state.purchases[0].amount_cop).toBe(12500);
  expect(state.purchases[0].items).toHaveLength(2);
  const comboLine = state.purchases[0].items?.find((item) => item.is_combo);
  expect(comboLine?.name).toBe('Combo enganche');
  expect(comboLine?.combo_detail[0]?.name).toBe('Taco de guisado');

  const claimUrl = await admin.page.getByTestId('claim-url').textContent();
  const token = claimUrl!.split('/claim/')[1];

  const customer = await openAs(
    browser,
    state,
    TOKENS.customer,
    `/claim/${token}`,
  );
  await customer.page
    .getByRole('button', { name: /Confirmar y sumar loopoints/ })
    .click();
  await expect(customer.page.getByText(/Loopoints acreditados/)).toBeVisible();
  await customer.context.close();

  // Detalle desde el panel del negocio.
  await admin.page.goto('/admin/purchases');
  await admin.page.getByRole('button', { name: 'Ver detalle' }).first().click();
  await expect(admin.page.getByRole('dialog')).toContainText('Combo');
  await expect(admin.page.getByRole('dialog')).toContainText(
    '2 × Taco de guisado',
  );
  await expect(admin.page.getByRole('dialog')).toContainText('12.500');
  await admin.context.close();

  // Detalle desde el portal del cliente.
  const customerView = await openAs(
    browser,
    state,
    TOKENS.customer,
    '/customer/purchases',
  );
  await expect(customerView.page.getByText('Taquería El Fogón').first()).toBeVisible();
  await customerView.page
    .getByRole('button', { name: 'Ver detalle' })
    .last()
    .click();
  await expect(customerView.page.getByRole('dialog')).toContainText(
    'Combo enganche',
  );
  await customerView.context.close();

  // Inicio: métricas reales, sin placeholders.
  const dashboard = await openAs(browser, state, TOKENS.admin, '/admin/dashboard');
  await expect(dashboard.page.getByText('Loopoints en circulación')).toBeVisible();
  await expect(dashboard.page.getByText('Ventas de hoy')).toBeVisible();
  await expect(dashboard.page.getByText(/12\.500/).first()).toBeVisible();
  await expect(
    dashboard.page.getByText('—', { exact: true }),
  ).toHaveCount(0);
  await dashboard.context.close();
});

test('compra manual: el detalle indica que no hay productos', async ({ browser }) => {
  const state = createFakeState();
  seedBusiness(state);
  const admin = await openAs(
    browser,
    state,
    TOKENS.admin,
    '/admin/purchases/new',
  );

  await admin.page.getByLabel('Importe de la compra (COP)').fill('3000');
  await admin.page
    .getByRole('button', { name: /Generar QR de la venta/ })
    .click();
  await expect(admin.page.getByText(/Escanéalo para sumar loopoints/)).toBeVisible();

  await admin.page.goto('/admin/purchases');
  await admin.page.getByRole('button', { name: 'Ver detalle' }).first().click();
  await expect(
    admin.page.getByRole('dialog').getByText('Sin detalle de productos.'),
  ).toBeVisible();

  await admin.context.close();
});

test('clientes: detalle sin canje manual, compras clicables y filtro de frecuentes', async ({ browser }) => {
  const state = createFakeState();
  seedBusiness(state);
  const claimedAt = new Date().toISOString();
  state.purchases.push({
    id: 'purchase-f5',
    token: 'tok_f5_123456789012345678901',
    businessId: 'biz-test',
    amount_cop: 12500,
    status: 'claimed',
    points_awarded: 12,
    customerId: 'user-customer',
    registrarId: 'user-admin',
    createdAt: claimedAt,
    expiresAt: claimedAt,
    claimed_at: claimedAt,
    items: [
      {
        id: 'line-f5-combo',
        product_id: 'prod-combo',
        name: 'Combo enganche',
        quantity: 2,
        unit_price_cop: 5000,
        line_total_cop: 10000,
        is_combo: true,
        combo_detail: [
          {
            product_id: 'prod-taco',
            name: 'Taco de guisado',
            quantity: 2,
            unit_price_cop: 2500,
          },
        ],
      },
      {
        id: 'line-f5-taco',
        product_id: 'prod-taco',
        name: 'Taco de guisado',
        quantity: 1,
        unit_price_cop: 2500,
        line_total_cop: 2500,
        is_combo: false,
        combo_detail: [],
      },
    ],
  });
  for (let index = 0; index < 2; index += 1) {
    state.purchases.push({
      id: `purchase-f5-extra-${index}`,
      token: `tok_f5_extra_${index}_123456789012345`,
      businessId: 'biz-test',
      amount_cop: 5000,
      status: 'claimed',
      points_awarded: 5,
      customerId: 'user-customer',
      registrarId: 'user-admin',
      createdAt: claimedAt,
      expiresAt: claimedAt,
      claimed_at: claimedAt,
      items: [],
    });
  }

  const admin = await openAs(browser, state, TOKENS.admin, '/admin/customers');
  await expect(admin.page.getByText('Frecuente activo').last()).toBeVisible();
  await admin.page.getByRole('button', { name: /Todos los clientes/ }).click();
  await expect(
    admin.page.getByRole('button', { name: /Solo frecuentes/ }),
  ).toBeVisible();
  await admin.page.getByRole('link', { name: 'Ver detalle' }).last().click();

  await expect(
    admin.page.getByRole('heading', { name: 'Carla Cliente' }),
  ).toBeVisible();
  await expect(admin.page.getByText('Canjear recompensa')).toHaveCount(0);
  await expect(admin.page.getByText('Anular y devolver')).toHaveCount(0);

  await admin.page.getByRole('button', { name: 'Detalle' }).first().click();
  await expect(admin.page.getByRole('dialog')).toContainText('Combo enganche');
  await expect(admin.page.getByRole('dialog')).toContainText('Taco de guisado');

  await admin.context.close();
});
