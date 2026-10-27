import type { BrowserContext, Page, Route } from '@playwright/test';

/**
 * Backend de pruebas en memoria para Playwright.
 *
 * No sustituye a Supabase en producción: permite ejercitar la interfaz completa
 * (QR, reclamación, canje y entrega) sin credenciales externas. La lógica real de
 * base de datos se prueba en tests/db/run-tests.sql contra PostgreSQL + RLS.
 */

export type FakeRole = 'customer' | 'registrar' | 'admin' | 'encargado' | 'cliente';

export interface FakeUser {
  id: string;
  name: string;
  email: string;
  nickname?: string;
  nicknameChanges?: number;
  token: string;
  roles: FakeRole[];
  balance: number;
  createdAt: string;
}

export interface FakeBusiness {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  operatingDays?: number[];
  description?: string | null;
  address?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  phoneWhatsapp?: string | null;
  phone?: string | null;
  instagram?: string | null;
  website?: string | null;
  logoUrl?: string | null;
  createdBy: string;
  createdAt: string;
}

export interface FakeMembership {
  id: string;
  businessId: string;
  userId: string;
  role: FakeRole;
  canApproveRedemptions: boolean;
  createdAt: string;
}

export interface FakeComboItem {
  productId: string;
  quantity: number;
}

export interface FakeProduct {
  id: string;
  businessId: string;
  name: string;
  description: string | null;
  priceCop: number;
  costCop: number | null;
  isActive: boolean;
  kind: 'simple' | 'combo';
  comboItems: FakeComboItem[];
}

export interface FakePurchaseLine {
  id: string;
  product_id: string;
  name: string;
  quantity: number;
  unit_price_cop: number;
  line_total_cop: number;
  is_combo: boolean;
  combo_detail: Array<{
    product_id: string;
    name: string;
    quantity: number;
    unit_price_cop: number;
  }>;
}

export interface FakeLoyaltyReward {
  id: string;
  businessId: string;
  productId: string | null;
  type: 'free_product' | 'fixed_discount' | 'percentage_discount' | 'configurable_benefit';
  name: string;
  description: string;
  pointsRequired: number;
  minPurchaseAmount: number;
  maxDiscountAmount: number | null;
  discountPercentage: number | null;
  productPriceCop: number | null;
  productCostCop: number | null;
  validFrom: string | null;
  validUntil: string | null;
  maxRedemptionsPerCustomer: number | null;
  maxRedemptionsPerPeriod: number | null;
  redemptionPeriodDays: number | null;
  totalRedemptionLimit: number | null;
  isActive: boolean;
}

export interface FakeRedemptionRequest {
  id: string;
  businessId: string;
  accountId: string;
  rewardId: string;
  rewardName: string;
  rewardType: string;
  pointsSpent: number;
  code: string;
  status: 'pending' | 'approved' | 'delivered' | 'cancelled' | 'expired';
  idempotencyKey: string;
  createdAt: string;
  approvedBy: string | null;
  approvedAt: string | null;
  deliveredAt?: string | null;
  cancelledAt?: string | null;
  origin: 'manual' | 'qr_scan';
}

export interface FakeToken {
  id: string;
  token: string;
  businessId: string;
  redemptionId: string;
  tokenHash: string;
  expiresAt: string;
  consumedAt: string | null;
}

export interface FakeReward {
  id: string;
  name: string;
  description: string;
  image_url: string | null;
  points_cost: number;
  is_active: boolean;
}

export interface FakePurchase {
  id: string;
  token: string;
  businessId?: string;
  amount_cop: number;
  status: 'pending_claim' | 'claimed' | 'expired' | 'cancelled';
  points_awarded: number;
  customerId: string | null;
  registrarId: string;
  createdAt: string;
  expiresAt: string;
  items?: FakePurchaseLine[];
  claimed_at: string | null;
}

export interface FakeEconomicProfile {
  dailyAvgSales: number | null;
  monthlyOperationDays: number | null;
  dailyGain: number | null;
  grossMargin: number | null;
  avgCustomersPerDay: number | null;
  maxMonthlyRewardBudget: number | null;
  dataStatus: Record<string, string>;
  updatedAt: string;
}

export interface FakeAuditLog {
  id: string;
  businessId: string;
  actorEmail: string | null;
  actorName?: string | null;
  operation: string;
  entityType: string;
  entityId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface FakePurchaseEvent {
  id: string;
  businessId: string;
  customerId: string;
  amountCop: number;
  eligibleAmountCop: number;
  pointsEarned: number;
  idempotencyKey: string;
  createdAt: string;
  reversed: boolean;
}

export interface FakeCampaign {
  id: string;
  businessId: string;
  name: string;
  description: string;
  multiplier: number;
  bonusPoints: number;
  minPurchaseAmount: number;
  validFrom: string;
  validUntil: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FakeBudgetSnapshot {
  id: string;
  businessId: string;
  periodStart: string;
  periodEnd: string;
  monthlySalesCop: number;
  budgetRate: number;
  referenceBudgetCop: number;
  maxBudgetCop: number;
  redeemedCostCop: number;
  pendingCostCop: number;
  pointsIssued: number;
  pointsRedeemed: number;
  createdAt: string;
}

export interface FakeRedemption {
  id: string;
  customerId: string;
  rewardId: string;
  reward_name: string;
  points_spent: number;
  code: string;
  status: 'pending_delivery' | 'redeemed' | 'cancelled';
  createdAt: string;
  delivered_at: string | null;
  cancelled_at: string | null;
  idempotencyKey: string;
}

export interface FakeState {
  users: FakeUser[];
  rewards: FakeReward[];
  purchases: FakePurchase[];
  redemptions: FakeRedemption[];
  businesses: FakeBusiness[];
  memberships: FakeMembership[];
  products: FakeProduct[];
  loyaltyRewards: FakeLoyaltyReward[];
  redemptionRequests: FakeRedemptionRequest[];
  tokens: FakeToken[];
  economicProfiles: Record<string, FakeEconomicProfile>;
  auditLogs: FakeAuditLog[];
  purchaseEvents: FakePurchaseEvent[];
  purchaseCredits: Record<string, number>;
  /** Saldo explícito por negocio (`businessId:userId`) para pruebas multi-negocio. */
  businessBalances: Record<string, number>;
  campaigns: FakeCampaign[];
  budgetSnapshots: FakeBudgetSnapshot[];
  loyaltyPrograms: Record<string, {
    cop_per_point_unit: number;
    points_per_cop_unit: number;
    points_expiry_days: number;
    budget_rate: number;
    first_purchase_bonus_points: number;
    recurrence_bonus_points: number;
    referral_bonus_points: number;
    qr_expiry_hours: number;
    frequent_min_purchases: number;
    frequent_period_days: number;
    frequent_min_spend_cop: number;
    frequent_active_days: number;
    recovery_inactive_days: number;
    is_active: boolean;
  }>;
  settings: {
    cop_per_point_unit: number;
    min_purchase_amount: number;
    max_points_per_purchase: number;
    qr_expiry_hours: number;
    points_expiry_days: number | null;
    history_page_size: number;
  };
}

export const TOKENS = {
  registrar: 'test-token-registrar',
  customer: 'test-token-customer',
  customer2: 'test-token-customer2',
  admin: 'test-token-admin',
} as const;

const STORAGE_KEY = 'sb-127-auth-token';
const now = () => new Date().toISOString();

export function createFakeState(): FakeState {
  return {
    users: [
      {
        id: 'user-registrar',
        name: 'Regina Caja',
        email: 'registradora@example.test',
        nickname: 'reginacaja',
        nicknameChanges: 0,
        token: TOKENS.registrar,
        roles: ['customer'],
        balance: 0,
        createdAt: '2026-01-10T12:00:00.000Z',
      },
      {
        id: 'user-customer',
        name: 'Carla Cliente',
        email: 'carla@example.test',
        nickname: 'carlacliente',
        nicknameChanges: 0,
        token: TOKENS.customer,
        roles: ['customer'],
        balance: 0,
        createdAt: '2026-02-11T12:00:00.000Z',
      },
      {
        id: 'user-customer2',
        name: 'Diego Cliente',
        email: 'diego@example.test',
        nickname: 'diegocliente',
        nicknameChanges: 0,
        token: TOKENS.customer2,
        roles: ['customer'],
        balance: 0,
        createdAt: '2026-03-12T12:00:00.000Z',
      },
      {
        id: 'user-admin',
        name: 'Ana Admin',
        email: 'admin@example.test',
        nickname: 'anaadmin',
        nicknameChanges: 0,
        token: TOKENS.admin,
        roles: ['admin'],
        balance: 0,
        createdAt: '2026-01-01T12:00:00.000Z',
      },
    ],
    rewards: [
      {
        id: '11111111-1111-4111-8111-111111111111',
        name: 'Taco individual',
        description: 'Un taco de guisado con doble tortilla.',
        image_url: null,
        points_cost: 40,
        is_active: true,
      },
      {
        id: '44444444-4444-4444-8444-444444444444',
        name: 'Agua fresca',
        description: 'Vaso de horchata o jamaica.',
        image_url: null,
        points_cost: 30,
        is_active: true,
      },
      {
        id: '22222222-2222-4222-8222-222222222222',
        name: 'Combo Enganche',
        description: 'Dos tacos de guisado.',
        image_url: null,
        points_cost: 80,
        is_active: true,
      },
    ],
    purchases: [],
    redemptions: [],
    businesses: [],
    memberships: [],
    products: [],
    loyaltyRewards: [],
    redemptionRequests: [],
    tokens: [],
    economicProfiles: {},
    auditLogs: [],
    purchaseEvents: [],
    purchaseCredits: {},
    businessBalances: {},
    campaigns: [],
    budgetSnapshots: [],
    loyaltyPrograms: {},
    settings: {
      cop_per_point_unit: 1000,
      min_purchase_amount: 0,
      max_points_per_purchase: 500,
      qr_expiry_hours: 24,
      points_expiry_days: null,
      history_page_size: 10,
    },
  };
}

function newId() {
  return crypto.randomUUID();
}

function newToken() {
  return `tok_${crypto.randomUUID().replace(/-/g, '')}`;
}

function newCode() {
  return `TP${crypto.randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase()}`;
}

function normalizeCode(value: string) {
  return value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
}

function userFor(state: FakeState, token: string) {
  return state.users.find((user) => user.token === token);
}

/**
 * Saldo simulado del programa: parte de 100 loopoints y descuenta las solicitudes
 * que reservaron loopoints (pendientes, aprobadas o entregadas).
 */
function loyaltyBalance(
  state: FakeState,
  userId: string,
  businessId?: string,
) {
  const reserved = state.redemptionRequests
    .filter(
      (request) =>
        request.accountId === userId &&
        (!businessId || request.businessId === businessId) &&
        request.status !== 'cancelled' &&
        request.status !== 'expired',
    )
    .reduce((sum, request) => sum + request.pointsSpent, 0);
  const explicit = businessId
    ? state.businessBalances[`${businessId}:${userId}`]
    : undefined;
  const base = explicit ?? 100 + (state.purchaseCredits[userId] ?? 0);
  return Math.max(base - reserved, 0);
}

function customerFrequency(
  state: FakeState,
  userId: string,
  businessId?: string | null,
) {
  const purchases = state.purchases.filter(
    (purchase) =>
      purchase.customerId === userId &&
      purchase.status === 'claimed' &&
      (!businessId || purchase.businessId === businessId),
  );
  const last = purchases
    .map((purchase) => purchase.claimed_at ?? purchase.createdAt)
    .sort()
    .at(-1) ?? null;
  const ageDays = last
    ? (Date.now() - new Date(last).getTime()) / (24 * 3600 * 1000)
    : null;
  const isFrequent = purchases.length >= 3;
  const isActive = isFrequent && ageDays !== null && ageDays <= 30;
  const isRecovering = last !== null && !isActive && (ageDays ?? 0) > 60;
  return {
    purchase_count: purchases.length,
    total_spent_cop: purchases.reduce(
      (sum, purchase) => sum + purchase.amount_cop,
      0,
    ),
    last_purchase_at: last,
    is_frequent: isFrequent,
    is_frequent_active: isActive,
    is_recovering: isRecovering,
  };
}

export function sessionFor(user: FakeUser) {
  const timestamp = Math.floor(Date.now() / 1000);
  return {
    access_token: user.token,
    refresh_token: `${user.token}-refresh`,
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: timestamp + 3600,
    user: {
      id: user.id,
      aud: 'authenticated',
      role: 'authenticated',
      email: user.email,
      email_confirmed_at: new Date().toISOString(),
      phone: '',
      confirmed_at: new Date().toISOString(),
      last_sign_in_at: new Date().toISOString(),
      app_metadata: { provider: 'google', providers: ['google'] },
      user_metadata: { full_name: user.name, name: user.name },
      identities: [],
      created_at: user.createdAt,
      updated_at: new Date().toISOString(),
    },
  };
}

export async function injectSession(
  context: BrowserContext,
  state: FakeState,
  token: string,
) {
  const user = userFor(state, token);
  if (!user) throw new Error(`Usuario falso desconocido: ${token}`);
  const session = sessionFor(user);
  await context.addInitScript(
    ({ key, value }) => {
      try {
        window.localStorage.setItem(key, JSON.stringify(value));
      } catch {
        // Ignorado.
      }
    },
    { key: STORAGE_KEY, value: session },
  );
}

const CORS_HEADERS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': '*',
  'access-control-allow-methods': 'GET,POST,OPTIONS',
  'cache-control': 'no-store',
};

function json(route: Route, body: unknown, status = 200) {
  return route.fulfill({
    status,
    headers: { ...CORS_HEADERS, 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function fail(route: Route, message: string) {
  return json(
    route,
    { code: 'P0001', details: null, hint: null, message },
    400,
  );
}


/** Loopoints de una compra aplicando la campaña vigente (misma regla del backend). */
function purchasePoints(
  state: FakeState,
  businessId: string,
  amountCop: number,
): number {
  const program = state.loyaltyPrograms[businessId];
  if (!program) return 0;
  const base = Math.floor(amountCop / Math.max(program.cop_per_point_unit, 1));
  const createdAt = now();
  const campaign = state.campaigns
    .filter(
      (item) =>
        item.businessId === businessId &&
        item.isActive &&
        item.validFrom <= createdAt &&
        (!item.validUntil || item.validUntil > createdAt) &&
        amountCop >= item.minPurchaseAmount,
    )
    .sort((a, b) => b.multiplier - a.multiplier || b.bonusPoints - a.bonusPoints)[0];
  const points = campaign
    ? Math.floor(base * campaign.multiplier) + campaign.bonusPoints
    : base;
  return Math.min(Math.max(points, 0), 1_000_000);
}

function comboItemsFor(state: FakeState, product: FakeProduct) {
  return product.comboItems
    .map((item) => {
      const component = state.products.find((row) => row.id === item.productId);
      if (!component) return null;
      return {
        product_id: component.id,
        name: component.name,
        quantity: item.quantity,
        unit_price_cop: component.priceCop,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
}

function fakePurchaseDetail(state: FakeState, purchase: FakePurchase) {
  const business = state.businesses.find((item) => item.id === purchase.businessId);
  const customer = state.users.find((item) => item.id === purchase.customerId);
  const registrar = state.users.find((item) => item.id === purchase.registrarId);
  return {
    purchase: {
      id: purchase.id,
      business_id: purchase.businessId,
      amount_cop: purchase.amount_cop,
      status: purchase.status,
      points_awarded: purchase.points_awarded,
      created_at: purchase.createdAt,
      expires_at: purchase.expiresAt,
      claimed_at: purchase.claimed_at ?? null,
      cancelled_at: null,
      cancellation_reason: null,
    },
    business: {
      id: business?.id ?? purchase.businessId,
      name: business?.name ?? 'Negocio',
      slug: business?.slug ?? '',
      logo_url: business?.logoUrl ?? null,
    },
    customer: customer
      ? {
          id: customer.id,
          full_name: customer.name,
          nickname: customer.nickname ?? null,
          email: customer.email,
        }
      : null,
    registrar: registrar
      ? { id: registrar.id, full_name: registrar.name, email: registrar.email }
      : null,
    items: purchase.items ?? [],
    items_count: purchase.items?.length ?? 0,
  };
}

function buildPurchaseLines(
  state: FakeState,
  businessId: string,
  rawItems: unknown,
) {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    return { items: [] as FakePurchaseLine[], total: 0 };
  }
  const items: FakePurchaseLine[] = [];
  let total = 0;
  for (const raw of rawItems as Array<{ product_id?: string; quantity?: number }>) {
    const product = state.products.find(
      (row) => row.id === raw.product_id && row.businessId === businessId,
    );
    if (!product) throw new Error('product_not_found');
    const quantity = Number(raw.quantity ?? 0);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      throw new Error('invalid_purchase_quantity');
    }
    const lineTotal = product.priceCop * quantity;
    total += lineTotal;
    items.push({
      id: `line-${crypto.randomUUID().slice(0, 8)}`,
      product_id: product.id,
      name: product.name,
      quantity,
      unit_price_cop: product.priceCop,
      line_total_cop: lineTotal,
      is_combo: product.kind === 'combo',
      combo_detail: product.kind === 'combo' ? comboItemsFor(state, product) : [],
    });
  }
  return { items, total };
}

function purchasePreview(state: FakeState, purchase: FakePurchase) {
  const business = state.businesses.find((item) => item.id === purchase.businessId);
  const expired =
    purchase.status === 'pending_claim' &&
    new Date(purchase.expiresAt).getTime() <= Date.now();
  const status = expired ? 'expired' : purchase.status;
  return {
    purchase_id: purchase.id,
    business_id: purchase.businessId ?? '',
    business_name: business?.name ?? 'Negocio',
    business_slug: business?.slug ?? '',
    amount_cop: purchase.amount_cop,
    points_preview:
      status === 'claimed'
        ? purchase.points_awarded
        : purchasePoints(state, purchase.businessId ?? '', purchase.amount_cop),
    status,
    claimed: status === 'claimed',
    expires_at: purchase.expiresAt,
    business_logo_url: business?.logoUrl ?? null,
    items: purchase.items ?? [],
    items_count: purchase.items?.length ?? 0,
  };
}

function dashboard(state: FakeState, user: FakeUser) {
  const claimed = state.purchases.filter(
    (purchase) =>
      purchase.customerId === user.id && purchase.status === 'claimed',
  );
  const nextReward =
    state.rewards
      .filter((reward) => reward.is_active && reward.points_cost > user.balance)
      .sort((a, b) => a.points_cost - b.points_cost)[0] ?? null;
  return {
    points_balance: user.balance,
    purchase_count: claimed.length,
    total_spent_cop: claimed.reduce((sum, purchase) => sum + purchase.amount_cop, 0),
    ready_rewards: state.rewards.filter(
      (reward) => reward.is_active && reward.points_cost <= user.balance,
    ).length,
    pending_redemptions: state.redemptions.filter(
      (redemption) =>
        redemption.customerId === user.id &&
        redemption.status === 'pending_delivery',
    ).length,
    next_reward: nextReward
      ? {
          id: nextReward.id,
          name: nextReward.name,
          points_cost: nextReward.points_cost,
          remaining: nextReward.points_cost - user.balance,
          image_url: nextReward.image_url,
        }
      : null,
  };
}

function lookupRedemption(state: FakeState, code: string) {
  const redemption = state.redemptions.find(
    (item) => normalizeCode(item.code) === normalizeCode(code),
  );
  if (!redemption) return null;
  const customer = state.users.find((user) => user.id === redemption.customerId);
  return {
    id: redemption.id,
    code: redemption.code,
    status: redemption.status,
    reward_name: redemption.reward_name,
    points_spent: redemption.points_spent,
    created_at: redemption.createdAt,
    delivered_at: redemption.delivered_at,
    cancelled_at: redemption.cancelled_at,
    customer_name: customer?.name ?? 'Cliente',
    customer_email: customer?.email ?? '',
  };
}

export async function installFakeSupabase(page: Page, state: FakeState) {
  await page.route('**/auth/v1/**', async (route) => {
    const request = route.request();
    if (request.method() === 'OPTIONS') {
      return route.fulfill({ status: 204, headers: CORS_HEADERS });
    }
    const token = (request.headers()['authorization'] ?? '').replace(
      /^Bearer\s+/i,
      '',
    );
    const user = userFor(state, token) ?? state.users.find((u) => u.token === TOKENS.admin);
    if (request.url().includes('/user') && user) {
      return json(route, sessionFor(user).user);
    }
    if (request.url().includes('/logout')) {
      return json(route, {});
    }
    if (request.url().includes('/token') && user) {
      return json(route, sessionFor(user));
    }
    return json(route, {});
  });

  await page.route('**/rest/v1/rpc/**', async (route) => {
    const request = route.request();
    if (request.method() === 'OPTIONS') {
      return route.fulfill({ status: 204, headers: CORS_HEADERS });
    }

    const functionName = new URL(request.url()).pathname.split('/').pop() ?? '';
    const body = (request.postDataJSON() ?? {}) as any;
    const token = (request.headers()['authorization'] ?? '').replace(
      /^Bearer\s+/i,
      '',
    );
    // En E2E el cliente envía la sesión desde localStorage. Si no hay token
    // válido, usamos el administrador por defecto para permitir los flujos de UI.
    const user = userFor(state, token) ?? state.users.find((u) => u.token === TOKENS.admin);
    const isStaff = Boolean(user?.roles.includes('admin') || user?.roles.includes('encargado'));
    const isAdmin = Boolean(user?.roles.includes('admin'));

    switch (functionName) {
      case 'get_my_roles':
        return json(route, user?.roles ?? []);
      case 'get_my_app_roles': {
        if (!user) return json(route, []);
        const mapped = state.memberships
          .filter((m) => m.userId === user.id)
          .map((m) =>
            m.role === 'admin'
              ? 'admin'
              : m.role === 'encargado'
                ? 'registrar'
                : 'customer',
          );
        return json(route, Array.from(new Set([...user.roles, ...mapped])));
      }
      case 'get_my_profile':
        return json(route, {
          id: user?.id,
          full_name: user?.name,
          email: user?.email,
          nickname: user?.nickname ?? null,
          nickname_changes: user?.nicknameChanges ?? 0,
          nickname_changes_left: 2 - (user?.nicknameChanges ?? 0),
          business_count: state.memberships.filter((m) => m.userId === user?.id)
            .length,
          created_at: user?.createdAt,
        });
      case 'profile_nickname_ensure':
        return json(route, user?.nickname ?? 'cliente');
      case 'profile_nickname_available': {
        const candidate = String(body.p_nickname ?? '').trim().toLowerCase();
        if (!/^[a-z0-9._-]{3,24}$/.test(candidate)) return json(route, false);
        if (['admin', 'loopoint', 'soporte', 'sistema'].includes(candidate)) {
          return json(route, false);
        }
        return json(
          route,
          !state.users.some(
            (item) => item.id !== user?.id && item.nickname === candidate,
          ),
        );
      }
      case 'profile_update': {
        if (!user) return fail(route, 'not_authenticated');
        const nextName = String(body.p_full_name ?? user.name).trim();
        const nextNickname = String(body.p_nickname ?? user.nickname ?? '')
          .trim()
          .toLowerCase();
        if (nextName.length < 2 || nextName.length > 120) {
          return fail(route, 'invalid_full_name');
        }
        if (!/^[a-z0-9._-]{3,24}$/.test(nextNickname)) {
          return fail(route, 'invalid_nickname');
        }
        if (['admin', 'loopoint', 'soporte', 'sistema'].includes(nextNickname)) {
          return fail(route, 'nickname_reserved');
        }
        if (
          state.users.some(
            (item) => item.id !== user.id && item.nickname === nextNickname,
          )
        ) {
          return fail(route, 'nickname_taken');
        }
        const previous = user.nickname;
        if (previous && previous !== nextNickname) {
          if ((user.nicknameChanges ?? 0) >= 2) {
            return fail(route, 'nickname_change_limit');
          }
          user.nicknameChanges = (user.nicknameChanges ?? 0) + 1;
        }
        user.name = nextName;
        user.nickname = nextNickname;
        return json(route, {
          id: user.id,
          full_name: user.name,
          email: user.email,
          nickname: user.nickname,
          nickname_changes: user.nicknameChanges ?? 0,
          nickname_changes_left: 2 - (user.nicknameChanges ?? 0),
          business_count: state.memberships.filter((m) => m.userId === user.id)
            .length,
        });
      }
      case 'get_program_settings':
        return json(route, state.settings);
      case 'get_my_dashboard':
        return json(route, dashboard(state, user!));
      case 'list_my_purchases': {
        const claimed = state.purchases
          .filter(
            (purchase) =>
              purchase.customerId === user!.id &&
              purchase.status === 'claimed',
          )
          .sort(
            (a, b) =>
              new Date(b.claimed_at ?? b.createdAt).getTime() -
              new Date(a.claimed_at ?? a.createdAt).getTime(),
          );
        const limit = Number(body.p_limit ?? 10);
        const offset = Number(body.p_offset ?? 0);
        return json(
          route,
          claimed.slice(offset, offset + limit).map((purchase) => ({
            id: purchase.id,
            amount_cop: purchase.amount_cop,
            points_awarded: purchase.points_awarded,
            claimed_at: purchase.claimed_at,
            created_at: purchase.createdAt,
            total_count: claimed.length,
          })),
        );
      }
      case 'list_active_rewards':
        return json(
          route,
          state.rewards
            .filter((reward) => reward.is_active)
            .sort((a, b) => a.points_cost - b.points_cost)
            .map((reward) => ({
              ...reward,
              balance: user!.balance,
              remaining: Math.max(reward.points_cost - user!.balance, 0),
              can_redeem: user!.balance >= reward.points_cost,
            })),
        );
      case 'list_my_redemptions':
        return json(
          route,
          state.redemptions
            .filter((redemption) => redemption.customerId === user!.id)
            .sort(
              (a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
            )
            .map((redemption) => ({
              id: redemption.id,
              reward_name: redemption.reward_name,
              points_spent: redemption.points_spent,
              code: redemption.code,
              status: redemption.status,
              created_at: redemption.createdAt,
              delivered_at: redemption.delivered_at,
              cancelled_at: redemption.cancelled_at,
            })),
        );
      case 'purchase_qr_create_with_items':
      case 'purchase_qr_create': {
        if (!isStaff) return fail(route, 'forbidden');
        const businessId = String(body.p_business_id ?? '');
        const program = state.loyaltyPrograms[businessId];
        if (!program?.is_active) return fail(route, 'program_not_active');
        const amount = Number(body.p_amount_cop ?? 0);
        if (!Number.isFinite(amount) || amount <= 0) {
          return fail(route, 'amount_invalid');
        }
        if (amount > 50_000_000) return fail(route, 'amount_too_large');
        let lines: FakePurchaseLine[] = [];
        try {
          const built = buildPurchaseLines(state, businessId, body.p_items);
          lines = built.items;
          if (lines.length > 0 && built.total !== amount) {
            return fail(route, 'purchase_items_total_mismatch');
          }
        } catch (error) {
          return fail(
            route,
            error instanceof Error ? error.message : 'invalid_purchase_items',
          );
        }
        const purchase: FakePurchase = {
          id: newId(),
          token: newToken(),
          businessId,
          amount_cop: amount,
          status: 'pending_claim',
          points_awarded: 0,
          customerId: null,
          registrarId: user!.id,
          createdAt: now(),
          expiresAt: new Date(
            Date.now() + program.qr_expiry_hours * 3600 * 1000,
          ).toISOString(),
          claimed_at: null,
          items: lines,
        };
        state.purchases.push(purchase);
        const business = state.businesses.find((item) => item.id === businessId);
        state.auditLogs.unshift({
          id: `audit-${crypto.randomUUID().slice(0, 8)}`,
          businessId,
          actorEmail: user!.email,
          operation: 'purchase.qr_created',
          entityType: 'purchase',
          entityId: purchase.id,
          metadata: {
            amount_cop: amount,
            points_preview: purchasePoints(state, businessId, amount),
          },
          createdAt: purchase.createdAt,
        });
        return json(route, {
          purchase_id: purchase.id,
          token: purchase.token,
          business_id: businessId,
          business_name: business?.name ?? 'Negocio',
          amount_cop: amount,
          points_preview: purchasePoints(state, businessId, amount),
          expires_at: purchase.expiresAt,
          status: 'pending_claim',
          items: lines,
        });
      }
      case 'purchase_qr_preview': {
        const tokenValue = String(body.p_token ?? '');
        const purchase = state.purchases.find((item) => item.token === tokenValue);
        if (!purchase) return fail(route, 'invalid_token');
        return json(route, purchasePreview(state, purchase));
      }
      case 'purchase_qr_claim': {
        if (!user) return fail(route, 'not_authenticated');
        const tokenValue = String(body.p_token ?? '');
        const purchase = state.purchases.find((item) => item.token === tokenValue);
        if (!purchase) return fail(route, 'invalid_token');
        if (purchase.status === 'cancelled') return fail(route, 'purchase_cancelled');
        if (purchase.status === 'claimed') {
          return fail(route, 'purchase_already_claimed');
        }
        if (
          purchase.status === 'expired' ||
          new Date(purchase.expiresAt).getTime() <= Date.now()
        ) {
          purchase.status = 'expired';
          return fail(route, 'purchase_expired');
        }
        const businessId = purchase.businessId ?? '';
        const business = state.businesses.find((item) => item.id === businessId);
        const program = state.loyaltyPrograms[businessId];
        if (!program?.is_active) return fail(route, 'program_not_active');

        if (!state.memberships.some(
          (item) => item.businessId === businessId && item.userId === user.id,
        )) {
          state.memberships.push({
            id: newId(),
            businessId,
            userId: user.id,
            role: 'cliente',
            canApproveRedemptions: false,
            createdAt: now(),
          });
        }

        const points = purchasePoints(state, businessId, purchase.amount_cop);
        const event: FakePurchaseEvent = {
          id: `event-${crypto.randomUUID().slice(0, 8)}`,
          businessId,
          customerId: user.id,
          amountCop: purchase.amount_cop,
          eligibleAmountCop: purchase.amount_cop,
          pointsEarned: points,
          idempotencyKey: `purchase_qr:${purchase.id}`,
          createdAt: now(),
          reversed: false,
        };
        state.purchaseEvents.push(event);
        state.purchaseCredits[user.id] = (state.purchaseCredits[user.id] ?? 0) + points;
        purchase.status = 'claimed';
        purchase.customerId = user.id;
        purchase.claimed_at = now();
        purchase.points_awarded = points;
        state.auditLogs.unshift({
          id: `audit-${crypto.randomUUID().slice(0, 8)}`,
          businessId,
          actorEmail: user.email,
          operation: 'purchase.qr_claimed',
          entityType: 'purchase',
          entityId: purchase.id,
          metadata: {
            amount_cop: purchase.amount_cop,
            points_awarded: points,
            balance: loyaltyBalance(state, user.id, businessId),
          },
          createdAt: purchase.claimed_at,
        });
        return json(route, {
          purchase_id: purchase.id,
          business_id: businessId,
          business_name: business?.name ?? 'Negocio',
          business_slug: business?.slug ?? '',
          amount_cop: purchase.amount_cop,
          points_awarded: points,
          balance: loyaltyBalance(state, user.id, businessId),
          claimed_at: purchase.claimed_at,
          duplicate: false,
        });
      }
      case 'business_purchases_list': {
        if (!isStaff) return fail(route, 'forbidden');
        const businessId = String(body.p_business_id ?? '');
        const status = body.p_status ? String(body.p_status) : '';
        const limit = Number(body.p_limit ?? 20);
        const offset = Number(body.p_offset ?? 0);
        const rows = state.purchases
          .filter(
            (purchase) =>
              purchase.businessId === businessId &&
              (!status || purchase.status === status),
          )
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          );
        return json(
          route,
          rows.slice(offset, offset + limit).map((purchase) => {
            const customer = state.users.find(
              (item) => item.id === purchase.customerId,
            );
            const registrar = state.users.find(
              (item) => item.id === purchase.registrarId,
            );
            return {
              id: purchase.id,
              amount_cop: purchase.amount_cop,
              status: purchase.status,
              points_awarded: purchase.points_awarded,
              created_at: purchase.createdAt,
              expires_at: purchase.expiresAt,
              claimed_at: purchase.claimed_at,
              customer_name: customer?.name ?? null,
              customer_email: customer?.email ?? null,
              registrar_name: registrar?.name ?? null,
              total_count: rows.length,
            };
          }),
        );
      }
      case 'business_purchases_page': {
        if (!isStaff) return fail(route, 'forbidden');
        const businessId = String(body.p_business_id ?? '');
        const status = body.p_status ? String(body.p_status) : '';
        const limit = Number(body.p_limit ?? 20);
        const offset = Number(body.p_offset ?? 0);
        const rows = state.purchases
          .filter((purchase) => purchase.businessId === businessId)
          .filter((purchase) => !status || purchase.status === status)
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          );
        return json(
          route,
          rows.slice(offset, offset + limit).map((purchase) => {
            const customer = state.users.find(
              (item) => item.id === purchase.customerId,
            );
            const registrar = state.users.find(
              (item) => item.id === purchase.registrarId,
            );
            return {
              id: purchase.id,
              amount_cop: purchase.amount_cop,
              status: purchase.status,
              points_awarded: purchase.points_awarded,
              created_at: purchase.createdAt,
              expires_at: purchase.expiresAt,
              claimed_at: purchase.claimed_at ?? null,
              customer_name: customer?.name ?? null,
              customer_nickname: customer?.nickname ?? null,
              customer_email: customer?.email ?? null,
              registrar_name: registrar?.name ?? null,
              items_count: purchase.items?.length ?? 0,
              total_count: rows.length,
            };
          }),
        );
      }
      case 'business_purchase_detail': {
        if (!isStaff) return fail(route, 'forbidden');
        const purchase = state.purchases.find(
          (item) =>
            item.id === String(body.p_purchase_id ?? '') &&
            item.businessId === String(body.p_business_id ?? ''),
        );
        if (!purchase) return fail(route, 'purchase_not_found');
        return json(route, fakePurchaseDetail(state, purchase));
      }
      case 'my_purchases_page': {
        if (!user) return fail(route, 'not_authenticated');
        const businessId = body.p_business_id ? String(body.p_business_id) : '';
        const limit = Number(body.p_limit ?? 20);
        const offset = Number(body.p_offset ?? 0);
        const rows = state.purchases
          .filter(
            (purchase) =>
              purchase.customerId === user.id && purchase.status === 'claimed',
          )
          .filter((purchase) => !businessId || purchase.businessId === businessId)
          .sort(
            (a, b) =>
              new Date(b.claimed_at ?? b.createdAt).getTime() -
              new Date(a.claimed_at ?? a.createdAt).getTime(),
          );
        return json(
          route,
          rows.slice(offset, offset + limit).map((purchase) => {
            const business = state.businesses.find(
              (item) => item.id === purchase.businessId,
            );
            return {
              id: purchase.id,
              business_id: purchase.businessId,
              business_name: business?.name ?? 'Negocio',
              business_slug: business?.slug ?? '',
              business_logo_url: business?.logoUrl ?? null,
              amount_cop: purchase.amount_cop,
              points_awarded: purchase.points_awarded,
              claimed_at: purchase.claimed_at ?? null,
              created_at: purchase.createdAt,
              items_count: purchase.items?.length ?? 0,
              total_count: rows.length,
            };
          }),
        );
      }
      case 'my_purchase_detail': {
        if (!user) return fail(route, 'not_authenticated');
        const purchase = state.purchases.find(
          (item) =>
            item.id === String(body.p_purchase_id ?? '') &&
            item.customerId === user.id &&
            item.status === 'claimed',
        );
        if (!purchase) return fail(route, 'purchase_not_found');
        return json(route, fakePurchaseDetail(state, purchase));
      }
      case 'purchase_qr_cancel': {
        if (!isStaff) return fail(route, 'forbidden');
        const purchase = state.purchases.find(
          (item) =>
            item.id === String(body.p_purchase_id ?? '') &&
            item.businessId === String(body.p_business_id ?? ''),
        );
        if (!purchase) return fail(route, 'purchase_not_found');
        if (purchase.status === 'claimed') {
          return fail(route, 'purchase_already_claimed');
        }
        purchase.status = 'cancelled';
        state.auditLogs.unshift({
          id: `audit-${crypto.randomUUID().slice(0, 8)}`,
          businessId: String(body.p_business_id ?? ''),
          actorEmail: user!.email,
          operation: 'purchase.qr_cancelled',
          entityType: 'purchase',
          entityId: purchase.id,
          metadata: { reason: String(body.p_reason ?? '') },
          createdAt: now(),
        });
        return json(route, { purchase_id: purchase.id, status: 'cancelled' });
      }
      case 'claim_purchase': {
        const tokenValue = String(body.p_token ?? '');
        const purchase = state.purchases.find(
          (item) => item.token === tokenValue,
        );
        if (!purchase) return fail(route, 'invalid_token');
        if (purchase.status === 'cancelled') return fail(route, 'purchase_cancelled');
        if (purchase.status === 'claimed') {
          return fail(route, 'purchase_already_claimed');
        }
        if (
          purchase.status === 'expired' ||
          new Date(purchase.expiresAt).getTime() <= Date.now()
        ) {
          purchase.status = 'expired';
          return fail(route, 'purchase_expired');
        }
        purchase.status = 'claimed';
        purchase.customerId = user!.id;
        purchase.claimed_at = now();
        purchase.points_awarded = Math.min(
          Math.floor(purchase.amount_cop / state.settings.cop_per_point_unit),
          state.settings.max_points_per_purchase,
        );
        user!.balance += purchase.points_awarded;
        return json(route, {
          purchase_id: purchase.id,
          amount_cop: purchase.amount_cop,
          points_awarded: purchase.points_awarded,
          balance: user!.balance,
          claimed_at: purchase.claimed_at,
        });
      }
      case 'customer_redeem_reward':
        return fail(route, 'redemption_requires_admin');
      case 'admin_redeem_reward': {
        if (!isAdmin) return fail(route, 'forbidden');
        const customer = state.users.find(
          (item) => item.id === String(body.p_customer_id ?? ''),
        );
        if (!customer) return fail(route, 'customer_not_found');
        const rewardId = String(body.p_reward_id ?? '');
        const key = String(body.p_idempotency_key ?? '');
        const existing = state.redemptions.find(
          (item) => item.customerId === customer.id && item.idempotencyKey === key,
        );
        if (existing) {
          return json(route, {
            redemption_id: existing.id,
            reward_name: existing.reward_name,
            points_spent: existing.points_spent,
            code: existing.code,
            balance: customer.balance,
            created_at: existing.createdAt,
            duplicate: true,
          });
        }
        const reward = state.rewards.find((item) => item.id === rewardId);
        if (!reward || !reward.is_active) return fail(route, 'reward_unavailable');
        if (customer.balance < reward.points_cost) {
          return fail(route, 'insufficient_points');
        }
        const redemption: FakeRedemption = {
          id: newId(),
          customerId: customer.id,
          rewardId: reward.id,
          reward_name: reward.name,
          points_spent: reward.points_cost,
          code: newCode(),
          status: 'redeemed',
          createdAt: now(),
          delivered_at: now(),
          cancelled_at: null,
          idempotencyKey: key,
        };
        state.redemptions.push(redemption);
        customer.balance -= reward.points_cost;
        return json(route, {
          redemption_id: redemption.id,
          reward_name: redemption.reward_name,
          points_spent: redemption.points_spent,
          code: redemption.code,
          balance: customer.balance,
          created_at: redemption.createdAt,
          duplicate: false,
        });
      }
      case 'create_purchase': {
        if (!isStaff) return fail(route, 'forbidden');
        const amount = Number(body.p_amount_cop ?? 0);
        if (!Number.isFinite(amount) || amount <= 0) {
          return fail(route, 'amount_invalid');
        }
        if (amount < state.settings.min_purchase_amount) {
          return fail(route, 'amount_below_minimum');
        }
        if (amount > 50_000_000) return fail(route, 'amount_too_large');
        const purchase: FakePurchase = {
          id: newId(),
          token: newToken(),
          amount_cop: amount,
          status: 'pending_claim',
          points_awarded: 0,
          customerId: null,
          registrarId: user!.id,
          createdAt: now(),
          expiresAt: new Date(
            Date.now() + state.settings.qr_expiry_hours * 3600 * 1000,
          ).toISOString(),
          claimed_at: null,
        };
        state.purchases.push(purchase);
        return json(route, {
          purchase_id: purchase.id,
          token: purchase.token,
          amount_cop: amount,
          points_preview: Math.min(
            Math.floor(amount / state.settings.cop_per_point_unit),
            state.settings.max_points_per_purchase,
          ),
          expires_at: purchase.expiresAt,
          status: 'pending_claim',
        });
      }
      case 'staff_list_customers': {
        if (!isStaff) return fail(route, 'forbidden');
        const search = String(body.p_search ?? '').toLowerCase();
        const limit = Number(body.p_limit ?? 20);
        const offset = Number(body.p_offset ?? 0);
        const sort = String(body.p_sort ?? 'created_at');
        const direction = String(body.p_direction ?? 'desc') === 'asc' ? 1 : -1;
        const businessId = body.p_business_id
          ? String(body.p_business_id)
          : null;
        const onlyFrequent = Boolean(body.p_only_frequent);
        const rows = state.users
          .filter((item) => item.roles.includes('customer'))
          .filter((item) => !item.roles.includes('admin'))
          .filter(
            (item) =>
              !businessId ||
              state.memberships.some(
                (membership) =>
                  membership.businessId === businessId &&
                  membership.userId === item.id &&
                  membership.role === 'cliente',
              ),
          )
          .filter(
            (item) =>
              !search ||
              item.name.toLowerCase().includes(search) ||
              item.email.toLowerCase().includes(search) ||
              (item.nickname ?? '').toLowerCase().includes(search),
          )
          .filter(
            (item) =>
              !onlyFrequent ||
              customerFrequency(state, item.id, businessId).is_frequent,
          )
          .map((item) => {
            const claimed = state.purchases.filter(
              (purchase) =>
                purchase.customerId === item.id && purchase.status === 'claimed',
            );
            const frequency = customerFrequency(state, item.id, businessId);
            return {
              id: item.id,
              full_name: item.name,
              email: item.email,
              nickname: item.nickname ?? null,
              points_balance: item.balance,
              purchase_count: businessId ? frequency.purchase_count : claimed.length,
              total_spent: businessId
                ? frequency.total_spent_cop
                : claimed.reduce(
                    (sum, purchase) => sum + purchase.amount_cop,
                    0,
                  ),
              is_frequent: frequency.is_frequent,
              is_frequent_active: frequency.is_frequent_active,
              last_purchase_at: frequency.last_purchase_at,
              created_at: item.createdAt,
            };
          });
        rows.sort((a, b) => {
          const key = (
            {
              name: 'full_name',
              email: 'email',
              points: 'points_balance',
              purchases: 'purchase_count',
              total_spent: 'total_spent',
              created_at: 'created_at',
            } as Record<string, keyof (typeof rows)[number]>
          )[sort] ?? 'created_at';
          const av = a[key];
          const bv = b[key];
          if (typeof av === 'number' && typeof bv === 'number') {
            return (av - bv) * direction;
          }
          return String(av).localeCompare(String(bv)) * direction;
        });
        return json(
          route,
          rows.slice(offset, offset + limit).map((row) => ({
            ...row,
            total_count: rows.length,
          })),
        );
      }
      case 'staff_get_customer': {
        if (!isStaff) return fail(route, 'forbidden');
        const customer = state.users.find(
          (item) => item.id === String(body.p_customer_id ?? ''),
        );
        if (!customer) return fail(route, 'customer_not_found');
        const claimed = state.purchases.filter(
          (purchase) =>
            purchase.customerId === customer.id && purchase.status === 'claimed',
        );
        const movements = [
          ...claimed.map((purchase) => ({
            id: `purchase-${purchase.id}`,
            movement_type: 'purchase_credit',
            points: purchase.points_awarded,
            reason: null,
            created_at: purchase.claimed_at,
          })),
          ...state.redemptions
            .filter((redemption) => redemption.customerId === customer.id)
            .map((redemption) => ({
              id: `redemption-${redemption.id}`,
              movement_type:
                redemption.status === 'cancelled'
                  ? 'redemption_refund'
                  : 'redemption_debit',
              points:
                redemption.status === 'cancelled'
                  ? redemption.points_spent
                  : -redemption.points_spent,
              reason: null,
              created_at: redemption.createdAt,
            })),
        ];
        const businessId = body.p_business_id
          ? String(body.p_business_id)
          : null;
        const frequency = customerFrequency(state, customer.id, businessId);
        return json(route, {
          profile: {
            id: customer.id,
            full_name: customer.name,
            email: customer.email,
            nickname: customer.nickname ?? null,
            created_at: customer.createdAt,
          },
          business_id: businessId,
          nickname: customer.nickname ?? null,
          is_frequent: frequency.is_frequent,
          is_frequent_active: frequency.is_frequent_active,
          is_recovering: frequency.is_recovering,
          last_purchase_at: frequency.last_purchase_at,
          points_balance: customer.balance,
          purchase_count: businessId ? frequency.purchase_count : claimed.length,
          total_spent: businessId
            ? frequency.total_spent_cop
            : claimed.reduce((sum, purchase) => sum + purchase.amount_cop, 0),
          purchases: [
            ...claimed.map((purchase) => ({
              id: purchase.id,
              amount_cop: purchase.amount_cop,
              points_awarded: purchase.points_awarded,
              claimed_at: purchase.claimed_at,
              status: purchase.status,
              items_count: purchase.items?.length ?? 0,
              source: 'qr',
            })),
            ...state.purchaseEvents
              .filter(
                (event) =>
                  event.customerId === customer.id &&
                  (!businessId || event.businessId === businessId) &&
                  !event.idempotencyKey.startsWith('purchase_qr:') &&
                  !event.reversed,
              )
              .map((event) => ({
                id: event.id,
                amount_cop: event.amountCop,
                points_awarded: event.pointsEarned,
                claimed_at: event.createdAt,
                status: 'claimed',
                items_count: 0,
                source: 'manual',
              })),
          ].sort(
            (a, b) =>
              new Date(b.claimed_at ?? 0).getTime() -
              new Date(a.claimed_at ?? 0).getTime(),
          ),
          movements,
          redemptions: [
            ...state.redemptions
              .filter((redemption) => redemption.customerId === customer.id)
              .map((redemption) => ({
                id: redemption.id,
                reward_name: redemption.reward_name,
                points_spent: redemption.points_spent,
                code: redemption.code,
                status: redemption.status,
                created_at: redemption.createdAt,
                delivered_at: redemption.delivered_at,
                cancelled_at: redemption.cancelled_at,
              })),
            ...state.redemptionRequests
              .filter(
                (request) =>
                  request.accountId === customer.id &&
                  (!businessId || request.businessId === businessId),
              )
              .map((request) => ({
                id: request.id,
                reward_name: request.rewardName,
                points_spent: request.pointsSpent,
                code: request.code,
                status:
                  request.status === 'delivered'
                    ? 'redeemed'
                    : request.status === 'cancelled' || request.status === 'expired'
                      ? 'cancelled'
                      : 'pending_delivery',
                created_at: request.createdAt,
                delivered_at: request.deliveredAt ?? null,
                cancelled_at: request.cancelledAt ?? null,
              })),
          ],
        });
      }
      case 'staff_list_purchases': {
        if (!isStaff) return fail(route, 'forbidden');
        const status = body.p_status ? String(body.p_status) : '';
        const limit = Number(body.p_limit ?? 20);
        const offset = Number(body.p_offset ?? 0);
        const rows = state.purchases
          .filter((purchase) => !status || purchase.status === status)
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          );
        return json(
          route,
          rows.slice(offset, offset + limit).map((purchase) => {
            const customer = state.users.find(
              (item) => item.id === purchase.customerId,
            );
            const registrar = state.users.find(
              (item) => item.id === purchase.registrarId,
            );
            return {
              id: purchase.id,
              amount_cop: purchase.amount_cop,
              status: purchase.status,
              points_awarded: purchase.points_awarded,
              created_at: purchase.createdAt,
              expires_at: purchase.expiresAt,
              claimed_at: purchase.claimed_at,
              customer_name: customer?.name ?? null,
              customer_email: customer?.email ?? null,
              registrar_name: registrar?.name ?? null,
              total_count: rows.length,
            };
          }),
        );
      }
      case 'staff_list_redemptions': {
        if (!isStaff) return fail(route, 'forbidden');
        const status = body.p_status ? String(body.p_status) : '';
        return json(
          route,
          state.redemptions
            .filter((redemption) => !status || redemption.status === status)
            .sort((a, b) => {
              if (a.status === b.status) {
                return (
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime()
                );
              }
              return a.status === 'pending_delivery' ? -1 : 1;
            })
            .map((redemption) => {
              const customer = state.users.find(
                (item) => item.id === redemption.customerId,
              );
              return {
                id: redemption.id,
                reward_name: redemption.reward_name,
                points_spent: redemption.points_spent,
                code: redemption.code,
                status: redemption.status,
                created_at: redemption.createdAt,
                delivered_at: redemption.delivered_at,
                cancelled_at: redemption.cancelled_at,
                customer_name: customer?.name ?? '',
                customer_email: customer?.email ?? '',
              };
            }),
        );
      }
      case 'staff_lookup_redemption': {
        if (!isStaff) return fail(route, 'forbidden');
        const result = lookupRedemption(state, String(body.p_code ?? ''));
        return result ? json(route, result) : fail(route, 'redemption_not_found');
      }
      case 'staff_confirm_redemption': {
        if (!isStaff) return fail(route, 'forbidden');
        const result = lookupRedemption(state, String(body.p_code ?? ''));
        if (!result) return fail(route, 'redemption_not_found');
        if (result.status === 'redeemed') {
          return fail(route, 'redemption_already_redeemed');
        }
        if (result.status === 'cancelled') return fail(route, 'redemption_cancelled');
        const redemption = state.redemptions.find(
          (item) => item.id === result.id,
        )!;
        redemption.status = 'redeemed';
        redemption.delivered_at = now();
        return json(route, lookupRedemption(state, redemption.code));
      }
      case 'admin_cancel_redemption': {
        if (!isAdmin) return fail(route, 'forbidden');
        const redemption = state.redemptions.find(
          (item) => item.id === String(body.p_redemption_id ?? ''),
        );
        if (!redemption) return fail(route, 'redemption_not_found');
        if (redemption.status === 'cancelled') {
          return fail(route, 'redemption_cancelled');
        }
        redemption.status = 'cancelled';
        redemption.cancelled_at = now();
        const customer = state.users.find(
          (item) => item.id === redemption.customerId,
        );
        if (customer) customer.balance += redemption.points_spent;
        return json(route, {
          redemption_id: redemption.id,
          status: 'cancelled',
          points_refunded: redemption.points_spent,
          balance: customer?.balance ?? 0,
        });
      }
      case 'staff_cancel_redemption': {
        if (!isStaff) return fail(route, 'forbidden');
        const redemption = state.redemptions.find(
          (item) => item.id === String(body.p_redemption_id ?? ''),
        );
        if (!redemption) return fail(route, 'redemption_not_found');
        if (redemption.status !== 'pending_delivery') {
          return fail(route, 'redemption_not_pending');
        }
        redemption.status = 'cancelled';
        redemption.cancelled_at = now();
        const customer = state.users.find(
          (item) => item.id === redemption.customerId,
        );
        if (customer) customer.balance += redemption.points_spent;
        return json(route, {
          redemption_id: redemption.id,
          status: 'cancelled',
          points_refunded: redemption.points_spent,
        });
      }
      case 'staff_cancel_purchase': {
        if (!isStaff) return fail(route, 'forbidden');
        const purchase = state.purchases.find(
          (item) => item.id === String(body.p_purchase_id ?? ''),
        );
        if (!purchase) return fail(route, 'purchase_not_found');
        if (purchase.status === 'claimed') {
          return fail(route, 'purchase_already_claimed');
        }
        purchase.status = 'cancelled';
        return json(route, {
          purchase_id: purchase.id,
          status: 'cancelled',
        });
      }
      case 'admin_get_settings':
        if (!isAdmin) return fail(route, 'forbidden');
        return json(route, {
          ...state.settings,
          updated_at: now(),
          updated_by_email: user?.email,
        });
      case 'admin_update_settings':
        if (!isAdmin) return fail(route, 'forbidden');
        state.settings = {
          ...state.settings,
          ...(body.p_settings as Partial<FakeState['settings']>),
        };
        return json(route, state.settings);
      case 'admin_list_rewards':
        if (!isAdmin) return fail(route, 'forbidden');
        return json(
          route,
          state.rewards.map((reward) => ({
            ...reward,
            created_at: now(),
            updated_at: now(),
            times_redeemed: state.redemptions.filter(
              (redemption) => redemption.rewardId === reward.id,
            ).length,
          })),
        );
      case 'admin_upsert_reward': {
        if (!isAdmin) return fail(route, 'forbidden');
        const id = body.p_id ? String(body.p_id) : newId();
        const existing = state.rewards.find((reward) => reward.id === id);
        const reward: FakeReward = {
          id,
          name: String(body.p_name ?? ''),
          description: String(body.p_description ?? ''),
          image_url: (body.p_image_url as string | null) ?? null,
          points_cost: Number(body.p_points_cost ?? 0),
          is_active: Boolean(body.p_is_active ?? true),
        };
        if (existing) Object.assign(existing, reward);
        else state.rewards.push(reward);
        return json(route, reward);
      }
      case 'admin_list_staff':
        if (!isAdmin) return fail(route, 'forbidden');
        return json(
          route,
          state.users
            .filter(
              (item) =>
                item.roles.includes('registrar') || item.roles.includes('admin'),
            )
            .map((item) => ({
              user_id: item.id,
              full_name: item.name,
              email: item.email,
              roles: item.roles,
              created_at: item.createdAt,
            })),
        );
      case 'admin_search_profiles':
        if (!isAdmin) return fail(route, 'forbidden');
        return json(
          route,
          state.users
            .filter((item) =>
              `${item.name} ${item.email}`
                .toLowerCase()
                .includes(String(body.p_query ?? '').toLowerCase()),
            )
            .map((item) => ({
              user_id: item.id,
              full_name: item.name,
              email: item.email,
              roles: item.roles,
              created_at: item.createdAt,
            })),
        );
      case 'admin_grant_role': {
        if (!isAdmin) return fail(route, 'forbidden');
        const target = state.users.find(
          (item) => item.id === String(body.p_user_id ?? ''),
        );
        const role = String(body.p_role ?? '') as FakeRole;
        if (!target) return fail(route, 'user_not_found');
        if (role !== 'registrar' && role !== 'admin') {
          return fail(route, 'invalid_role');
        }
        if (!target.roles.includes(role)) target.roles.push(role);
        return json(route, {
          user_id: target.id,
          role,
          granted: true,
        });
      }
      case 'admin_revoke_role': {
        if (!isAdmin) return fail(route, 'forbidden');
        const target = state.users.find(
          (item) => item.id === String(body.p_user_id ?? ''),
        );
        const role = String(body.p_role ?? '') as FakeRole;
        if (!target) return fail(route, 'user_not_found');
        target.roles = target.roles.filter((item) => item !== role);
        return json(route, {
          user_id: target.id,
          role,
          revoked: true,
        });
      }
      case 'admin_get_audit_log':
        if (!isAdmin) return fail(route, 'forbidden');
        return json(route, []);
      case 'admin_get_config_history':
        if (!isAdmin) return fail(route, 'forbidden');
        return json(route, []);
      case 'admin_expire_points':
        if (!isAdmin) return fail(route, 'forbidden');
        return json(route, { credits_expired: 0, points_expired: 0, days: 30 });

      // ------------------------------------------------------------------
      // Negocio y membresías
      // ------------------------------------------------------------------
      case 'business_profile_get': {
        if (!user) return fail(route, 'not_authenticated');
        const business = state.businesses.find(
          (item) => item.id === String(body.p_business_id ?? ''),
        );
        if (!business) return fail(route, 'business_not_found');
        return json(route, {
          id: business.id,
          name: business.name,
          slug: business.slug,
          timezone: business.timezone,
          operating_days: business.operatingDays ?? [1, 2, 3, 4, 5, 6],
          is_active: true,
          description: business.description ?? null,
          address: business.address ?? null,
          neighborhood: business.neighborhood ?? null,
          city: business.city ?? null,
          phone_whatsapp: business.phoneWhatsapp ?? null,
          phone: business.phone ?? null,
          instagram: business.instagram ?? null,
          website: business.website ?? null,
          logo_url: business.logoUrl ?? null,
          updated_at: now(),
        });
      }
      case 'business_profile_update': {
        if (!isAdmin) return fail(route, 'forbidden');
        const business = state.businesses.find(
          (item) => item.id === String(body.p_business_id ?? ''),
        );
        if (!business) return fail(route, 'business_not_found');
        const name = String(body.p_name ?? business.name).trim();
        if (name.length < 2 || name.length > 120) {
          return fail(route, 'invalid_business_name');
        }
        business.name = name;
        const nullable = (value: unknown) => {
          const text = String(value ?? '').trim();
          return text === '' ? null : text;
        };
        business.description = nullable(body.p_description);
        business.address = nullable(body.p_address);
        business.neighborhood = nullable(body.p_neighborhood);
        business.city = nullable(body.p_city);
        const whatsapp = nullable(body.p_phone_whatsapp)?.replace(/[\s().-]/g, '');
        if (whatsapp && !/^\+?[0-9]{7,15}$/.test(whatsapp)) {
          return fail(route, 'invalid_whatsapp');
        }
        business.phoneWhatsapp = whatsapp ?? null;
        business.phone = nullable(body.p_phone)?.replace(/[\s().-]/g, '') ?? null;
        business.instagram = nullable(body.p_instagram)?.replace(/^@/, '') ?? null;
        business.website = nullable(body.p_website);
        return json(route, {
          business_id: business.id,
          name: business.name,
          slug: business.slug,
          description: business.description,
          address: business.address,
          neighborhood: business.neighborhood,
          city: business.city,
          phone_whatsapp: business.phoneWhatsapp,
          phone: business.phone,
          instagram: business.instagram,
          website: business.website,
        });
      }
      case 'business_logo_set': {
        if (!isAdmin) return fail(route, 'forbidden');
        const business = state.businesses.find(
          (item) => item.id === String(body.p_business_id ?? ''),
        );
        if (!business) return fail(route, 'business_not_found');
        const logoUrl = body.p_logo_url ? String(body.p_logo_url) : null;
        if (
          logoUrl &&
          !logoUrl.includes(`/business-assets/business/${business.id}/`)
        ) {
          return fail(route, 'logo_outside_business');
        }
        business.logoUrl = logoUrl;
        return json(route, { business_id: business.id, logo_url: logoUrl });
      }
      case 'businesses_list': {
        if (!user) return fail(route, 'not_authenticated');
        const userMemberships = state.memberships.filter(
          (m) => m.userId === user.id,
        );
        const list = state.businesses.filter((b) =>
          userMemberships.some((m) => m.businessId === b.id),
        );
        return json(
          route,
          list.map((b) => {
            const membership = userMemberships.find((m) => m.businessId === b.id);
            return {
              id: b.id,
              name: b.name,
              slug: b.slug,
              timezone: b.timezone,
              operating_days: b.operatingDays ?? [1, 2, 3, 4, 5, 6],
              is_active: true,
              created_by: b.createdBy,
              created_at: b.createdAt,
              updated_at: b.createdAt,
              role: membership?.role ?? 'cliente',
              can_approve_redemptions:
                membership?.canApproveRedemptions ?? false,
            };
          }),
        );
      }
      case 'customer_businesses_summary': {
        if (!user) return fail(route, 'not_authenticated');
        const rows = state.memberships
          .filter((membership) => membership.userId === user.id)
          .map((membership) => {
            const business = state.businesses.find(
              (item) => item.id === membership.businessId,
            );
            if (!business) return null;
            const frequency = customerFrequency(
              state,
              user.id,
              business.id,
            );
            const balance = loyaltyBalance(state, user.id, business.id);
            const program = state.loyaltyPrograms[business.id];
            return {
              business_id: business.id,
              name: business.name,
              slug: business.slug,
              logo_url: business.logoUrl ?? null,
              role: membership.role,
              loyalty_active: program?.is_active ?? true,
              balance,
              ready_rewards: state.loyaltyRewards.filter(
                (reward) =>
                  reward.businessId === business.id &&
                  reward.isActive &&
                  reward.pointsRequired <= balance,
              ).length,
              pending_redemptions: state.redemptionRequests.filter(
                (request) =>
                  request.accountId === user.id &&
                  request.businessId === business.id &&
                  (request.status === 'pending' ||
                    request.status === 'approved'),
              ).length,
              last_purchase_at: frequency.last_purchase_at,
              is_frequent: frequency.is_frequent,
              is_frequent_active: frequency.is_frequent_active,
            };
          })
          .filter((row): row is NonNullable<typeof row> => row !== null)
          .sort((a, b) => {
            const left = a.last_purchase_at ?? '';
            const right = b.last_purchase_at ?? '';
            if (left !== right) return right.localeCompare(left);
            return a.name.localeCompare(b.name);
          });
        return json(route, rows);
      }
      case 'business_update': {
        if (!isAdmin) return fail(route, 'forbidden');
        const business = state.businesses.find(
          (item) => item.id === String(body.p_business_id ?? ''),
        );
        if (!business) return fail(route, 'business_not_found');
        if (body.p_name != null) business.name = String(body.p_name);
        if (body.p_timezone != null) business.timezone = String(body.p_timezone);
        if (Array.isArray(body.p_operating_days)) {
          business.operatingDays = body.p_operating_days.map(Number);
        }
        return json(route, {
          business_id: business.id,
          name: business.name,
          slug: business.slug,
          timezone: business.timezone,
          operating_days: business.operatingDays ?? [1, 2, 3, 4, 5, 6],
          updated_at: now(),
        });
      }
      case 'business_public_get': {
        const slug = String(body.p_slug ?? '').trim().toLowerCase();
        const business = state.businesses.find(
          (item) => item.slug.toLowerCase() === slug && item.createdBy,
        );
        if (!business) return json(route, []);
        const program = state.loyaltyPrograms[business.id];
        return json(route, [
          {
            id: business.id,
            name: business.name,
            slug: business.slug,
            timezone: business.timezone,
            operating_days: [1, 2, 3, 4, 5, 6],
            is_active: true,
            loyalty_active: Boolean(program?.is_active),
            description: business.description ?? null,
            logo_url: business.logoUrl ?? null,
            address: business.address ?? null,
            neighborhood: business.neighborhood ?? null,
            city: business.city ?? null,
            phone_whatsapp: business.phoneWhatsapp ?? null,
            instagram: business.instagram ?? null,
            website: business.website ?? null,
          },
        ]);
      }
      case 'business_join': {
        if (!user) return fail(route, 'not_authenticated');
        const slug = String(body.p_slug ?? '').trim().toLowerCase();
        const business = state.businesses.find(
          (item) => item.slug.toLowerCase() === slug,
        );
        if (!business) return fail(route, 'business_not_found');
        const existing = state.memberships.find(
          (item) => item.businessId === business.id && item.userId === user.id,
        );
        if (existing) {
          return json(route, {
            business_id: business.id,
            business_name: business.name,
            slug: business.slug,
            membership_id: existing.id,
            role: existing.role,
            already_member: true,
          });
        }
        const membership: FakeMembership = {
          id: `mem-${crypto.randomUUID().slice(0, 8)}`,
          businessId: business.id,
          userId: user.id,
          role: 'cliente',
          canApproveRedemptions: false,
          createdAt: now(),
        };
        state.memberships.push(membership);
        return json(route, {
          business_id: business.id,
          business_name: business.name,
          slug: business.slug,
          membership_id: membership.id,
          role: 'cliente',
          already_member: false,
        });
      }
      case 'business_register': {
        if (!user) return fail(route, 'not_authenticated');
        const name = String(body.p_business_name ?? '').trim();
        const slug = String(body.p_slug ?? '').trim();
        if (name.length < 2) return fail(route, 'invalid_business_name');
        if (slug.length < 2) return fail(route, 'invalid_business_slug');
        if (state.businesses.some((b) => b.slug === slug)) {
          return fail(route, 'business_slug_duplicate');
        }
        const business: FakeBusiness = {
          id: `biz-${crypto.randomUUID().slice(0, 8)}`,
          name,
          slug,
          timezone: String(body.p_timezone ?? 'America/Bogota'),
          createdBy: user.id,
          createdAt: now(),
        };
        state.businesses.push(business);
        const membership: FakeMembership = {
          id: `mem-${crypto.randomUUID().slice(0, 8)}`,
          businessId: business.id,
          userId: user.id,
          role: 'admin',
          canApproveRedemptions: false,
          createdAt: now(),
        };
        state.memberships.push(membership);
        if (!user.roles.includes('admin')) user.roles.push('admin');
        return json(route, {
          business_id: business.id,
          membership_id: membership.id,
          role: 'admin',
          created_at: business.createdAt,
        });
      }
      case 'business_search_profiles': {
        if (!user) return fail(route, 'not_authenticated');
        const businessId = String(body.p_business_id ?? '');
        const query = String(body.p_query ?? '').trim().toLowerCase();
        return json(
          route,
          state.users
            .filter(
              (item) =>
                query.length < 2 ||
                item.name.toLowerCase().includes(query) ||
                item.email.toLowerCase().includes(query),
            )
            .map((item) => ({
              user_id: item.id,
              full_name: item.name,
              email: item.email,
              already_member: state.memberships.some(
                (membership) =>
                  membership.businessId === businessId &&
                  membership.userId === item.id,
              ),
            })),
        );
      }
      case 'business_memberships_list': {
        if (!user) return fail(route, 'not_authenticated');
        const businessId = String(body.p_business_id ?? '');
        const memberships = state.memberships.filter(
          (m) => m.businessId === businessId,
        );
        return json(
          route,
          memberships.map((m) => {
            const u = state.users.find((x) => x.id === m.userId);
            return {
              id: m.id,
              user_id: m.userId,
              full_name: u?.name ?? '',
              email: u?.email ?? '',
              role: m.role,
              can_approve_redemptions: m.canApproveRedemptions,
              created_at: m.createdAt || now(),
            };
          }),
        );
      }
      case 'business_membership_create': {
        if (!user) return fail(route, 'not_authenticated');
        const businessId = String(body.p_business_id ?? '');
        const targetUserId = String(body.p_user_id ?? '');
        const role = String(body.p_role ?? 'encargado');
        const canApprove = Boolean(body.p_can_approve_redemptions);
        const membership: FakeMembership = {
          id: `mem-${crypto.randomUUID().slice(0, 8)}`,
          businessId,
          userId: targetUserId,
          role: role as FakeRole,
          canApproveRedemptions: canApprove,
          createdAt: now(),
        };
        state.memberships.push(membership);
        return json(route, {
          membership_id: membership.id,
          user_id: targetUserId,
          role,
          can_approve_redemptions: canApprove,
        });
      }
      case 'business_membership_update': {
        if (!user) return fail(route, 'not_authenticated');
        const businessId = String(body.p_business_id ?? '');
        const targetUserId = String(body.p_user_id ?? '');
        const canApprove = Boolean(body.p_can_approve_redemptions);
        const membership = state.memberships.find(
          (m) => m.businessId === businessId && m.userId === targetUserId,
        );
        if (!membership) return fail(route, 'membership_not_found');
        membership.canApproveRedemptions = canApprove;
        return json(route, {
          user_id: targetUserId,
          can_approve_redemptions: canApprove,
        });
      }

      // ------------------------------------------------------------------
      // Programa de loopoints
      // ------------------------------------------------------------------
      case 'loyalty_program_get': {
        if (!user) return fail(route, 'not_authenticated');
        const businessId = String(body.p_business_id ?? '');
        const stored = state.loyaltyPrograms[businessId];
        const prog = stored ?? {
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
          is_active: false,
        };
        return json(route, {
          ...prog,
          id: stored
            ? `prog-${businessId}`
            : '00000000-0000-0000-0000-000000000000',
          business_id: businessId,
          configured_by: stored ? user.id : null,
          configured_at: stored ? now() : null,
          created_at: now(),
          updated_at: now(),
        });
      }
      case 'loyalty_program_configure': {
        if (!user) return fail(route, 'not_authenticated');
        const businessId = String(body.p_business_id ?? '');
        const isActive =
          body.p_is_active === undefined ? true : Boolean(body.p_is_active);
        state.loyaltyPrograms[businessId] = {
          cop_per_point_unit: Number(body.p_cop_per_point_unit ?? 1000),
          points_per_cop_unit: Number(body.p_points_per_cop_unit ?? 100),
          points_expiry_days: Number(body.p_points_expiry_days ?? 365),
          budget_rate: Number(body.p_budget_rate ?? 0.01),
          first_purchase_bonus_points: Number(
            body.p_first_purchase_bonus_points ?? 0,
          ),
          recurrence_bonus_points: Number(body.p_recurrence_bonus_points ?? 0),
          referral_bonus_points: Number(body.p_referral_bonus_points ?? 0),
          qr_expiry_hours: Number(body.p_qr_expiry_hours ?? 24),
          frequent_min_purchases:
            state.loyaltyPrograms[businessId]?.frequent_min_purchases ?? 3,
          frequent_period_days:
            state.loyaltyPrograms[businessId]?.frequent_period_days ?? 90,
          frequent_min_spend_cop:
            state.loyaltyPrograms[businessId]?.frequent_min_spend_cop ?? 0,
          frequent_active_days:
            state.loyaltyPrograms[businessId]?.frequent_active_days ?? 30,
          recovery_inactive_days:
            state.loyaltyPrograms[businessId]?.recovery_inactive_days ?? 60,
          is_active: isActive,
        };
        return json(route, {
          id: `prog-${businessId}`,
          business_id: businessId,
          ...state.loyaltyPrograms[businessId],
          is_active: isActive,
          configured_at: now(),
        });
      }
      case 'loyalty_program_frequent_update': {
        if (!isAdmin) return fail(route, 'forbidden');
        const businessId = String(body.p_business_id ?? '');
        const current = state.loyaltyPrograms[businessId] ?? {
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
          is_active: false,
        };
        const next = {
          ...current,
          frequent_min_purchases: Number(body.p_min_purchases ?? 3),
          frequent_period_days: Number(body.p_period_days ?? 90),
          frequent_min_spend_cop: Number(body.p_min_spend_cop ?? 0),
          frequent_active_days: Number(body.p_active_days ?? 30),
          recovery_inactive_days: Number(body.p_recovery_days ?? 60),
        };
        if (next.frequent_min_purchases < 1 || next.frequent_min_purchases > 100) {
          return fail(route, 'invalid_frequent_min_purchases');
        }
        if (next.recovery_inactive_days <= next.frequent_active_days) {
          return fail(route, 'invalid_recovery_inactive_days');
        }
        state.loyaltyPrograms[businessId] = next;
        return json(route, { business_id: businessId, ...next });
      }

      // ------------------------------------------------------------------
      // Productos
      // ------------------------------------------------------------------
      case 'products_list': {
        if (!user) return fail(route, 'not_authenticated');
        const businessId = String(body.p_business_id ?? '');
        const onlyActive = body.p_only_active !== 'false';
        return json(
          route,
          state.products
            .filter((p) => p.businessId === businessId)
            .filter((p) => !onlyActive || p.isActive)
            .map((p) => ({
              id: p.id,
              name: p.name,
              description: p.description,
              price_cop: p.priceCop,
              cost_cop: p.costCop,
              is_active: p.isActive,
              kind: p.kind,
              combo_items: comboItemsFor(state, p),
              created_at: now(),
              updated_at: now(),
            })),
        );
      }
      case 'product_upsert': {
        if (!user) return fail(route, 'not_authenticated');
        const businessId = String(body.p_business_id ?? '');
        const id = body.p_id ? String(body.p_id) : `prod-${crypto.randomUUID().slice(0, 8)}`;
        const existing = state.products.find((p) => p.id === id);
        const product: FakeProduct = {
          id,
          businessId,
          name: String(body.p_name ?? ''),
          description: body.p_description ?? null,
          priceCop: Number(body.p_price_cop ?? 0),
          costCop: body.p_cost_cop ?? null,
          isActive: Boolean(body.p_is_active ?? true),
          kind: (String(body.p_kind ?? 'simple') as 'simple' | 'combo'),
          comboItems: existing?.comboItems ?? [],
        };
        if (existing) Object.assign(existing, product);
        else state.products.push(product);
        return json(route, {
          id: product.id,
          business_id: product.businessId,
          name: product.name,
          description: product.description,
          price_cop: product.priceCop,
          cost_cop: product.costCop,
          is_active: product.isActive,
          kind: product.kind,
          combo_items: comboItemsFor(state, product),
          created_at: now(),
          updated_at: now(),
        });
      }
      case 'product_combo_set': {
        if (!user) return fail(route, 'not_authenticated');
        const businessId = String(body.p_business_id ?? '');
        const productId = String(body.p_product_id ?? '');
        const product = state.products.find(
          (item) => item.id === productId && item.businessId === businessId,
        );
        if (!product) return fail(route, 'product_not_found');
        if (product.kind !== 'combo') return fail(route, 'product_not_combo');
        const raw = Array.isArray(body.p_items) ? body.p_items : [];
        const comboItems: FakeComboItem[] = [];
        for (const item of raw as Array<{ product_id?: string; quantity?: number }>) {
          const component = state.products.find(
            (row) =>
              row.id === item.product_id &&
              row.businessId === businessId &&
              row.kind === 'simple',
          );
          if (!component) return fail(route, 'product_not_found');
          comboItems.push({
            productId: component.id,
            quantity: Number(item.quantity ?? 0),
          });
        }
        product.comboItems = comboItems;
        return json(route, {
          product_id: product.id,
          kind: 'combo',
          combo_items: comboItemsFor(state, product),
        });
      }

      // ------------------------------------------------------------------
      // Recompensas
      // ------------------------------------------------------------------
      case 'loyalty_rewards_list': {
        if (!user) return fail(route, 'not_authenticated');
        const businessId = String(body.p_business_id ?? '');
        const onlyActive =
          body.p_only_active !== false && body.p_only_active !== 'false';
        return json(
          route,
          state.loyaltyRewards
            .filter((r) => r.businessId === businessId)
            .filter((r) => !onlyActive || r.isActive)
            .map((r) => ({
              id: r.id,
              product_id: r.productId,
              type: r.type,
              name: r.name,
              description: r.description,
              points_required: r.pointsRequired,
              min_purchase_amount: r.minPurchaseAmount,
              max_discount_amount: r.maxDiscountAmount,
              discount_percentage: r.discountPercentage,
              product_price_cop: r.productPriceCop,
              product_cost_cop: r.productCostCop,
              is_active: r.isActive,
              valid_from: r.validFrom,
              valid_until: r.validUntil,
              max_redemptions_per_customer: r.maxRedemptionsPerCustomer,
              max_redemptions_per_period: r.maxRedemptionsPerPeriod,
              redemption_period_days: r.redemptionPeriodDays,
              total_redemption_limit: r.totalRedemptionLimit,
              created_at: now(),
              updated_at: now(),
              times_redeemed: state.redemptionRequests.filter(
                (rr) => rr.rewardId === r.id && rr.status === 'delivered',
              ).length,
            })),
        );
      }
      case 'loyalty_rewards_available': {
        if (!user) return fail(route, 'not_authenticated');
        const businessId = String(body.p_business_id ?? '');
        // Saldo simulado para los flujos de UI; el saldo real lo valida la RPC.
        const balance = loyaltyBalance(state, user.id, businessId);
        return json(
          route,
          state.loyaltyRewards
            .filter((r) => r.businessId === businessId && r.isActive)
            .map((r) => ({
              id: r.id,
              type: r.type,
              name: r.name,
              description: r.description,
              points_required: r.pointsRequired,
              min_purchase_amount: r.minPurchaseAmount,
              max_discount_amount: r.maxDiscountAmount,
              discount_percentage: r.discountPercentage,
              product_price_cop: r.productPriceCop,
              product_cost_cop: r.productCostCop,
              balance,
              remaining: Math.max(r.pointsRequired - balance, 0),
              can_redeem: balance >= r.pointsRequired,
              product_id: r.productId,
              valid_from: r.validFrom,
              valid_until: r.validUntil,
            })),
        );
      }
      case 'loyalty_reward_upsert': {
        if (!user) return fail(route, 'not_authenticated');
        const businessId = String(body.p_business_id ?? '');
        const id = body.p_id ? String(body.p_id) : `rew-${crypto.randomUUID().slice(0, 8)}`;
        const existing = state.loyaltyRewards.find((r) => r.id === id);
        const productId = body.p_product_id ?? null;
        const product = productId
          ? state.products.find((p) => p.id === productId)
          : null;
        const reward: FakeLoyaltyReward = {
          id,
          businessId,
          productId,
          type: String(body.p_type ?? 'free_product') as any,
          name: String(body.p_name ?? ''),
          description: String(body.p_description ?? ''),
          pointsRequired: Number(body.p_points_required ?? 0),
          minPurchaseAmount: Number(body.p_min_purchase_amount ?? 0),
          maxDiscountAmount: body.p_max_discount_amount ?? null,
          discountPercentage: body.p_discount_percentage ?? null,
          productPriceCop: product?.priceCop ?? null,
          productCostCop: product?.costCop ?? null,
          validFrom: body.p_valid_from ?? null,
          validUntil: body.p_valid_until ?? null,
          maxRedemptionsPerCustomer: body.p_max_redemptions_per_customer ?? null,
          maxRedemptionsPerPeriod: body.p_max_redemptions_per_period ?? null,
          redemptionPeriodDays: body.p_redemption_period_days ?? null,
          totalRedemptionLimit: body.p_total_redemption_limit ?? null,
          isActive: Boolean(body.p_is_active ?? true),
        };
        if (existing) Object.assign(existing, reward);
        else state.loyaltyRewards.push(reward);
        return json(route, reward);
      }

      // ------------------------------------------------------------------
      // Loopoints
      // ------------------------------------------------------------------
      case 'loyalty_account_balance': {
        if (!user) return fail(route, 'not_authenticated');
        const businessId = String(body.p_business_id ?? '');
        const customerId = String(body.p_customer_id ?? '');
        return json(route, {
          business_id: businessId,
          customer_id: customerId,
          balance: loyaltyBalance(state, customerId, businessId),
        });
      }
      case 'loyalty_account_transactions': {
        if (!user) return fail(route, 'not_authenticated');
        return json(route, []);
      }

      // ------------------------------------------------------------------
      // Redenciones y tokens QR
      // ------------------------------------------------------------------
      case 'reward_request_redemption': {
        if (!user) return fail(route, 'not_authenticated');
        const businessId = String(body.p_business_id ?? '');
        const rewardId = String(body.p_reward_id ?? '');
        const idempotencyKey = String(body.p_idempotency_key ?? '');
        const existing = state.redemptionRequests.find(
          (rr) => rr.idempotencyKey === idempotencyKey,
        );
        if (existing) {
          return json(route, {
            redemption_id: existing.id,
            reward_name: existing.rewardName,
            points_spent: existing.pointsSpent,
            code: existing.code,
            status: existing.status,
            created_at: existing.createdAt,
            duplicate: true,
          });
        }
        const reward = state.loyaltyRewards.find((r) => r.id === rewardId);
        if (!reward || !reward.isActive) return fail(route, 'reward_unavailable');
        if (loyaltyBalance(state, user.id, businessId) < reward.pointsRequired) {
          return fail(route, 'insufficient_points');
        }
        const token = `tok_${crypto.randomUUID().replace(/-/g, '')}`;
        const tokenHash = `hash_${crypto.randomUUID().replace(/-/g, '')}`;
        const redemption: FakeRedemptionRequest = {
          id: `red-${crypto.randomUUID().slice(0, 8)}`,
          businessId,
          accountId: user.id,
          rewardId,
          rewardName: reward.name,
          rewardType: reward.type,
          pointsSpent: reward.pointsRequired,
          code: `TP${crypto.randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase()}`,
          status: 'pending',
          idempotencyKey,
          createdAt: now(),
          approvedBy: null,
          approvedAt: null,
          deliveredAt: null,
          cancelledAt: null,
          origin: 'manual',
        };
        state.redemptionRequests.push(redemption);
        state.tokens.push({
          id: `tok-${crypto.randomUUID().slice(0, 8)}`,
          token,
          businessId,
          redemptionId: redemption.id,
          tokenHash,
          expiresAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
          consumedAt: null,
        });
        return json(route, {
          redemption_id: redemption.id,
          reward_name: redemption.rewardName,
          points_spent: redemption.pointsSpent,
          code: redemption.code,
          status: 'pending',
          token,
          expires_at: state.tokens[state.tokens.length - 1].expiresAt,
          duplicate: false,
        });
      }
      case 'loyalty_my_redemptions': {
        if (!user) return fail(route, 'not_authenticated');
        return json(
          route,
          state.redemptionRequests
            .filter((request) => request.accountId === user.id)
            .sort(
              (a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
            )
            .map((request) => {
              const business = state.businesses.find(
                (item) => item.id === request.businessId,
              );
              return {
                id: request.id,
                business_id: request.businessId,
                business_name: business?.name ?? 'Negocio',
                business_slug: business?.slug ?? '',
                business_logo_url: business?.logoUrl ?? null,
                reward_name: request.rewardName,
                reward_type: request.rewardType,
                points_spent: request.pointsSpent,
                code: request.code,
                status: request.status,
                created_at: request.createdAt,
                approved_at: request.approvedAt,
                delivered_at: request.deliveredAt ?? null,
                cancelled_at: request.cancelledAt ?? null,
              };
            }),
        );
      }
      case 'redemption_token_reissue': {
        if (!user) return fail(route, 'not_authenticated');
        const redemptionId = String(body.p_redemption_id ?? '');
        const redemption = state.redemptionRequests.find(
          (request) => request.id === redemptionId,
        );
        if (!redemption) return fail(route, 'redemption_not_found');
        if (redemption.accountId !== user.id) return fail(route, 'forbidden');
        if (redemption.status !== 'pending') {
          return fail(route, 'redemption_not_reissuable');
        }
        const token = `tok_${crypto.randomUUID().replace(/-/g, '')}`;
        const expiresAt = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
        state.tokens = state.tokens.filter(
          (tok) => tok.redemptionId !== redemptionId || tok.consumedAt,
        );
        state.tokens.push({
          id: `tok-${crypto.randomUUID().slice(0, 8)}`,
          token,
          businessId: redemption.businessId,
          redemptionId,
          tokenHash: `hash_${crypto.randomUUID().replace(/-/g, '')}`,
          expiresAt,
          consumedAt: null,
        });
        return json(route, { redemption_id: redemptionId, token, expires_at: expiresAt });
      }
      case 'redemption_token_validate': {
        if (!user) return fail(route, 'not_authenticated');
        const businessId = String(body.p_business_id ?? '');
        const tokenValue = String(body.p_token ?? '');
        const foundToken = state.tokens.find(
          (tok) => tok.businessId === businessId && tok.token === tokenValue,
        );
        if (!foundToken) return fail(route, 'invalid_token');
        if (foundToken.consumedAt) return fail(route, 'token_already_consumed');
        if (new Date(foundToken.expiresAt).getTime() <= Date.now()) {
          return fail(route, 'token_expired');
        }
        const redemption = state.redemptionRequests.find(
          (r) => r.id === foundToken.redemptionId,
        );
        if (!redemption) return fail(route, 'redemption_not_found');
        if (redemption.status !== 'pending') return fail(route, 'redemption_not_pending');
        return json(route, {
          redemption_id: redemption.id,
          reward_name: redemption.rewardName,
          reward_type: redemption.rewardType,
          points_spent: redemption.pointsSpent,
          status: redemption.status,
          customer_id: redemption.accountId,
          expires_at: foundToken.expiresAt,
          can_approve: true,
        });
      }
      case 'redemption_token_context': {
        if (!user) return fail(route, 'not_authenticated');
        const tokenValue = String(body.p_token ?? '');
        const foundToken = state.tokens.find((tok) => tok.token === tokenValue);
        if (!foundToken) return fail(route, 'invalid_token');
        const redemption = state.redemptionRequests.find(
          (r) => r.id === foundToken.redemptionId,
        );
        if (!redemption) return fail(route, 'redemption_not_found');
        const membership = state.memberships.find(
          (m) =>
            m.businessId === foundToken.businessId && m.userId === user.id,
        );
        if (!membership) return fail(route, 'business_not_found_or_no_access');
        if (
          membership.role !== 'admin' &&
          !(membership.role === 'encargado' && membership.canApproveRedemptions)
        ) {
          return fail(route, 'forbidden');
        }
        const business = state.businesses.find(
          (b) => b.id === foundToken.businessId,
        );
        const customer = state.users.find((u) => u.id === redemption.accountId);
        const expired = new Date(foundToken.expiresAt).getTime() <= Date.now();
        let reason: string | null = null;
        if (redemption.status === 'delivered') {
          reason = 'redemption_already_delivered';
        } else if (redemption.status === 'cancelled') {
          reason = 'redemption_cancelled';
        } else if (redemption.status === 'expired') {
          reason = 'redemption_expired';
        } else if (redemption.status !== 'pending') {
          reason = 'redemption_not_pending';
        } else if (foundToken.consumedAt) {
          reason = 'token_already_consumed';
        } else if (expired) {
          reason = 'token_expired';
        }
        return json(route, {
          business_id: foundToken.businessId,
          business_name: business?.name ?? 'Negocio',
          business_slug: business?.slug ?? '',
          business_logo_url: business?.logoUrl ?? null,
          redemption_id: redemption.id,
          code: redemption.code,
          reward_name: redemption.rewardName,
          reward_type: redemption.rewardType,
          points_spent: redemption.pointsSpent,
          customer_id: customer?.id ?? redemption.accountId,
          customer_nickname: customer?.nickname ?? null,
          status: redemption.status,
          origin: redemption.origin,
          created_at: redemption.createdAt,
          expires_at: foundToken.expiresAt,
          consumed_at: foundToken.consumedAt,
          approved_at: redemption.approvedAt,
          delivered_at: redemption.deliveredAt ?? null,
          can_redeem: reason === null,
          reason,
          role: membership.role,
        });
      }
      case 'redemption_redeem_by_token': {
        if (!user) return fail(route, 'not_authenticated');
        const tokenValue = String(body.p_token ?? '');
        const foundToken = state.tokens.find((tok) => tok.token === tokenValue);
        if (!foundToken) return fail(route, 'invalid_token');
        const redemption = state.redemptionRequests.find(
          (r) => r.id === foundToken.redemptionId,
        );
        if (!redemption) return fail(route, 'redemption_not_found');
        const membership = state.memberships.find(
          (m) =>
            m.businessId === foundToken.businessId && m.userId === user.id,
        );
        if (!membership) return fail(route, 'business_not_found_or_no_access');
        if (
          membership.role !== 'admin' &&
          !(membership.role === 'encargado' && membership.canApproveRedemptions)
        ) {
          return fail(route, 'forbidden');
        }
        if (redemption.status === 'delivered') {
          return fail(route, 'redemption_already_delivered');
        }
        if (redemption.status !== 'pending') {
          return fail(route, 'redemption_not_pending');
        }
        if (foundToken.consumedAt) return fail(route, 'token_already_consumed');
        if (new Date(foundToken.expiresAt).getTime() <= Date.now()) {
          return fail(route, 'token_expired');
        }
        redemption.status = 'delivered';
        redemption.origin = 'qr_scan';
        redemption.approvedBy = user.id;
        redemption.approvedAt = now();
        redemption.deliveredAt = now();
        foundToken.consumedAt = now();
        const customer = state.users.find((u) => u.id === redemption.accountId);
        state.auditLogs.unshift({
          id: newId(),
          businessId: foundToken.businessId,
          actorEmail: user.email,
          operation: 'redemption.scanned',
          entityType: 'loyalty_redemption',
          entityId: redemption.id,
          metadata: {
            code: redemption.code,
            reward_name: redemption.rewardName,
            points_spent: redemption.pointsSpent,
            channel: 'qr_scan',
          },
          createdAt: now(),
        });
        state.auditLogs.unshift({
          id: newId(),
          businessId: foundToken.businessId,
          actorEmail: user.email,
          operation: 'redemption.delivered',
          entityType: 'loyalty_redemption',
          entityId: redemption.id,
          metadata: {
            reward_name: redemption.rewardName,
            points_spent: redemption.pointsSpent,
            via: 'qr_scan',
          },
          createdAt: now(),
        });
        return json(route, {
          business_id: foundToken.businessId,
          redemption_id: redemption.id,
          code: redemption.code,
          reward_name: redemption.rewardName,
          points_spent: redemption.pointsSpent,
          customer_nickname: customer?.nickname ?? null,
          status: 'delivered',
          origin: 'qr_scan',
          delivered_at: redemption.deliveredAt,
          role: membership.role,
        });
      }
      case 'redemption_approve': {
        if (!user) return fail(route, 'not_authenticated');
        const businessId = String(body.p_business_id ?? '');
        const redemptionId = String(body.p_redemption_id ?? '');
        const approve = Boolean(body.p_approve);
        const redemption = state.redemptionRequests.find(
          (r) => r.id === redemptionId && r.businessId === businessId,
        );
        if (!redemption) return fail(route, 'redemption_not_found');
        if (redemption.status !== 'pending') return fail(route, 'redemption_not_pending');
        if (approve) {
          redemption.status = 'approved';
          redemption.approvedBy = user.id;
          redemption.approvedAt = now();
          for (const tok of state.tokens) {
            if (tok.redemptionId === redemptionId && !tok.consumedAt) {
              tok.consumedAt = now();
            }
          }
          return json(route, {
            redemption_id: redemptionId,
            status: 'approved',
            approved_by: user.id,
            approved_at: now(),
          });
        } else {
          redemption.status = 'cancelled';
          redemption.cancelledAt = now();
          return json(route, {
            redemption_id: redemptionId,
            status: 'cancelled',
            points_refunded: redemption.pointsSpent,
          });
        }
      }
      case 'redemption_deliver': {
        if (!user) return fail(route, 'not_authenticated');
        const businessId = String(body.p_business_id ?? '');
        const redemptionId = String(body.p_redemption_id ?? '');
        const redemption = state.redemptionRequests.find(
          (r) => r.id === redemptionId && r.businessId === businessId,
        );
        if (!redemption) return fail(route, 'redemption_not_found');
        if (redemption.status !== 'approved') return fail(route, 'redemption_not_approved');
        redemption.status = 'delivered';
        redemption.deliveredAt = now();
        return json(route, {
          redemption_id: redemptionId,
          status: 'delivered',
          delivered_at: redemption.deliveredAt,
        });
      }
      case 'redemption_cancel': {
        if (!user) return fail(route, 'not_authenticated');
        const businessId = String(body.p_business_id ?? '');
        const redemptionId = String(body.p_redemption_id ?? '');
        const reason = String(body.p_reason ?? '').trim();
        const redemption = state.redemptionRequests.find(
          (r) => r.id === redemptionId && r.businessId === businessId,
        );
        if (!redemption) return fail(route, 'redemption_not_found');
        if (reason.length < 3) return fail(route, 'invalid_reason');
        if (redemption.status !== 'pending') {
          return fail(route, 'redemption_not_pending');
        }
        redemption.status = 'cancelled';
        redemption.cancelledAt = now();
        return json(route, {
          redemption_id: redemptionId,
          status: 'cancelled',
          points_refunded: redemption.pointsSpent,
        });
      }
      case 'loyalty_redemptions_list': {
        if (!user) return fail(route, 'not_authenticated');
        const businessId = String(body.p_business_id ?? '');
        const status = body.p_status ? String(body.p_status) : '';
        const origin = body.p_origin ? String(body.p_origin) : '';
        return json(
          route,
          state.redemptionRequests
            .filter((r) => r.businessId === businessId)
            .filter((r) => !status || r.status === status)
            .filter((r) => !origin || r.origin === origin)
            .map((r) => {
              const u = state.users.find((x) => x.id === r.accountId);
              return {
                id: r.id,
                reward_name: r.rewardName,
                reward_type: r.rewardType,
                points_spent: r.pointsSpent,
                code: r.code,
                status: r.status,
                created_at: r.createdAt,
                approved_at: r.approvedAt,
                delivered_at: r.deliveredAt ?? null,
                cancelled_at: r.cancelledAt ?? null,
                customer_id: r.accountId,
                customer_email: u?.email ?? '',
                customer_nickname: u?.nickname ?? null,
                origin: r.origin,
              };
            }),
        );
      }

      // ------------------------------------------------------------------
      // Fase 4: compras desde el panel, panel económico y auditoría
      // ------------------------------------------------------------------
      case 'loyalty_purchase_register': {
        if (!user) return fail(route, 'not_authenticated');
        const businessId = String(body.p_business_id ?? '');
        const customerId = String(body.p_customer_id ?? '');
        const amountCop = Number(body.p_amount_cop ?? 0);
        const eligibleCop = Number(body.p_eligible_amount_cop ?? amountCop);
        const idempotencyKey = `purchase:${businessId}:${String(body.p_idempotency_key ?? '')}`;
        const program = state.loyaltyPrograms[businessId];

        if (!program?.is_active) return fail(route, 'program_not_active');
        if (amountCop <= 0) return fail(route, 'invalid_amount');

        const existing = state.purchaseEvents.find(
          (event) =>
            event.businessId === businessId &&
            event.idempotencyKey === idempotencyKey,
        );
        if (existing) {
          return json(route, {
            points_earned: 0,
            balance: loyaltyBalance(state, customerId, businessId),
            duplicate: true,
            account_id: `acc-${customerId}`,
            purchase_event_id: existing.id,
            message: 'La compra ya fue procesada.',
          });
        }

        const pointsEarned = Math.floor(
          eligibleCop / Math.max(program.cop_per_point_unit, 1),
        );
        const createdAt = now();
        const campaign = state.campaigns
          .filter(
            (item) =>
              item.businessId === businessId &&
              item.isActive &&
              item.validFrom <= createdAt &&
              (!item.validUntil || item.validUntil > createdAt) &&
              eligibleCop >= item.minPurchaseAmount,
          )
          .sort(
            (a, b) =>
              b.multiplier - a.multiplier ||
              b.bonusPoints - a.bonusPoints,
          )[0];
        const basePoints = pointsEarned;
        const campaignPoints = campaign
          ? Math.floor(basePoints * campaign.multiplier) + campaign.bonusPoints
          : basePoints;
        const event: FakePurchaseEvent = {
          id: `event-${crypto.randomUUID().slice(0, 8)}`,
          businessId,
          customerId,
          amountCop,
          eligibleAmountCop: eligibleCop,
          pointsEarned: campaignPoints,
          idempotencyKey,
          createdAt,
          reversed: false,
        };
        state.purchaseEvents.push(event);
        state.purchaseCredits[customerId] =
          (state.purchaseCredits[customerId] ?? 0) + campaignPoints;
        state.auditLogs.unshift({
          id: `audit-${crypto.randomUUID().slice(0, 8)}`,
          businessId,
          actorEmail: user.email,
          operation: 'purchase.registered',
          entityType: 'loyalty_purchase_event',
          entityId: event.id,
          metadata: {
            customer_id: customerId,
            amount_cop: amountCop,
            eligible_amount_cop: eligibleCop,
            points_earned: campaignPoints,
          },
          createdAt: event.createdAt,
        });

        return json(route, {
          points_earned: campaignPoints,
          balance: loyaltyBalance(state, customerId, businessId),
          duplicate: false,
          account_id: `acc-${customerId}`,
          purchase_event_id: event.id,
          base_points: basePoints,
          campaign_id: campaign?.id ?? null,
          campaign_name: campaign?.name ?? null,
          multiplier: campaign?.multiplier ?? 1,
          bonus_points: campaign?.bonusPoints ?? 0,
        });
      }
      case 'loyalty_purchase_revert': {
        if (!user) return fail(route, 'not_authenticated');
        const businessId = String(body.p_business_id ?? '');
        const eventId = String(body.p_event_id ?? '');
        const reason = String(body.p_reason ?? '').trim() || 'Reverso de compra';
        const event = state.purchaseEvents.find(
          (item) => item.id === eventId && item.businessId === businessId,
        );
        if (!event) return fail(route, 'purchase_event_not_found');

        if (event.reversed) {
          return json(route, {
            points_reversed: 0,
            balance: loyaltyBalance(state, event.customerId, event.businessId),
            duplicate: true,
            message: 'La compra ya fue revertida.',
          });
        }

        event.reversed = true;
        state.purchaseCredits[event.customerId] =
          (state.purchaseCredits[event.customerId] ?? 0) - event.pointsEarned;
        state.auditLogs.unshift({
          id: `audit-${crypto.randomUUID().slice(0, 8)}`,
          businessId,
          actorEmail: user.email,
          operation: 'purchase.reverted',
          entityType: 'loyalty_purchase_event',
          entityId: event.id,
          metadata: {
            points_reversed: event.pointsEarned,
            reason,
            amount_cop: event.amountCop,
          },
          createdAt: now(),
        });

        return json(route, {
          points_reversed: event.pointsEarned,
          balance: loyaltyBalance(state, event.customerId, event.businessId),
          duplicate: false,
        });
      }
      case 'business_dashboard_summary': {
        if (!user) return fail(route, 'not_authenticated');
        const businessId = String(body.p_business_id ?? '');
        const events = state.purchaseEvents.filter(
          (event) => event.businessId === businessId,
        );
        const pending = state.redemptionRequests.filter(
          (request) =>
            request.businessId === businessId && request.status === 'pending',
        );
        const approved = state.redemptionRequests.filter(
          (request) =>
            request.businessId === businessId && request.status === 'approved',
        );
        const members = state.memberships.filter(
          (membership) =>
            membership.businessId === businessId && membership.role === 'cliente',
        );
        const frequencies = members.map((membership) =>
          customerFrequency(state, membership.userId, businessId),
        );
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const todayEvents = events.filter(
          (event) => new Date(event.createdAt) >= today,
        );
        const monthEvents = events.filter(
          (event) => new Date(event.createdAt) >= monthStart,
        );
        const dates = [
          ...events.map((event) => event.createdAt),
          ...state.redemptionRequests
            .filter((request) => request.businessId === businessId)
            .map((request) => request.createdAt),
          ...state.purchases
            .filter((purchase) => purchase.businessId === businessId)
            .map((purchase) => purchase.createdAt),
        ].sort();
        return json(route, {
          business_id: businessId,
          points_outstanding:
            state.purchaseCredits[members[0]?.userId ?? ''] ?? 0,
          points_issued_total: events.reduce(
            (sum, event) => sum + event.pointsEarned,
            0,
          ),
          points_redeemed_total: state.redemptionRequests
            .filter(
              (request) =>
                request.businessId === businessId &&
                request.status !== 'cancelled',
            )
            .reduce((sum, request) => sum + request.pointsSpent, 0),
          pending_redemptions: pending.length,
          approved_pending_delivery: approved.length,
          frequent_customers: frequencies.filter((item) => item.is_frequent).length,
          active_customers: frequencies.filter((item) => item.is_frequent_active)
            .length,
          customers_total: members.length,
          sales_today_cop: todayEvents.reduce(
            (sum, event) => sum + event.amountCop,
            0,
          ),
          sales_month_cop: monthEvents.reduce(
            (sum, event) => sum + event.amountCop,
            0,
          ),
          purchases_today: todayEvents.length,
          purchases_month: monthEvents.length,
          pending_qr_count: state.purchases.filter(
            (purchase) =>
              purchase.businessId === businessId &&
              purchase.status === 'pending_claim',
          ).length,
          budget_committed_percent: 0,
          last_activity_at: dates.at(-1) ?? null,
          calculated_at: now(),
        });
      }
      case 'business_recent_activity': {
        if (!user) return fail(route, 'not_authenticated');
        const businessId = String(body.p_business_id ?? '');
        const limit = Number(body.p_limit ?? 10);
        const rows = [
          ...state.purchaseEvents
            .filter((event) => event.businessId === businessId)
            .map((event) => ({
              id: event.id,
              kind: 'purchase' as const,
              title: 'Compra registrada',
              detail:
                state.users.find((item) => item.id === event.customerId)?.name ??
                'Cliente',
              points: event.pointsEarned,
              amount_cop: event.amountCop,
              status: null,
              created_at: event.createdAt,
            })),
          ...state.redemptionRequests
            .filter((request) => request.businessId === businessId)
            .map((request) => ({
              id: request.id,
              kind: 'redemption' as const,
              title: request.rewardName,
              detail:
                state.users.find((item) => item.id === request.accountId)?.name ??
                'Cliente',
              points: -request.pointsSpent,
              amount_cop: null,
              status: request.status,
              created_at: request.createdAt,
            })),
        ]
          .sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime(),
          )
          .slice(0, limit);
        return json(route, rows);
      }
      case 'business_economic_profile_get': {
        if (!user) return fail(route, 'not_authenticated');
        const businessId = String(body.p_business_id ?? '');
        const profile = state.economicProfiles[businessId];
        if (!profile) return json(route, null);
        return json(route, {
          id: `econ-${businessId}`,
          business_id: businessId,
          daily_avg_sales: profile.dailyAvgSales,
          monthly_operation_days: profile.monthlyOperationDays,
          daily_gain: profile.dailyGain,
          gross_margin: profile.grossMargin,
          avg_customers_per_day: profile.avgCustomersPerDay,
          max_monthly_reward_budget: profile.maxMonthlyRewardBudget,
          data_status: profile.dataStatus,
          updated_by: user.id,
          updated_at: profile.updatedAt,
        });
      }
      case 'business_economic_profile_upsert': {
        if (!user) return fail(route, 'not_authenticated');
        const businessId = String(body.p_business_id ?? '');
        const profile: FakeEconomicProfile = {
          dailyAvgSales: body.p_daily_avg_sales ?? null,
          monthlyOperationDays: body.p_monthly_operation_days ?? null,
          dailyGain: body.p_daily_gain ?? null,
          grossMargin: body.p_gross_margin ?? null,
          avgCustomersPerDay: body.p_avg_customers_per_day ?? null,
          maxMonthlyRewardBudget: body.p_max_monthly_reward_budget ?? null,
          dataStatus: body.p_data_status ?? {},
          updatedAt: now(),
        };
        state.economicProfiles[businessId] = profile;
        state.auditLogs.unshift({
          id: `audit-${crypto.randomUUID().slice(0, 8)}`,
          businessId,
          actorEmail: user.email,
          operation: 'economic_profile.updated',
          entityType: 'business_economic_profile',
          entityId: businessId,
          metadata: profile.dataStatus,
          createdAt: profile.updatedAt,
        });
        return json(route, {
          business_id: businessId,
          updated_at: profile.updatedAt,
        });
      }
      case 'business_dashboard_economic': {
        if (!user) return fail(route, 'not_authenticated');
        const businessId = String(body.p_business_id ?? '');
        const profile = state.economicProfiles[businessId];
        const program = state.loyaltyPrograms[businessId];
        const monthlySales =
          profile?.dailyAvgSales != null && profile?.monthlyOperationDays != null
            ? profile.dailyAvgSales * profile.monthlyOperationDays
            : 0;
        const referenceBudget =
          monthlySales > 0 && program
            ? Math.floor(monthlySales * program.budget_rate)
            : 0;
        const maxBudget =
          profile?.maxMonthlyRewardBudget ?? referenceBudget;

        const costFor = (statuses: string[]) =>
          state.redemptionRequests
            .filter(
              (request) =>
                request.businessId === businessId &&
                statuses.includes(request.status),
            )
            .reduce((sum, request) => {
              const reward = state.loyaltyRewards.find(
                (item) => item.id === request.rewardId,
              );
              return sum + request.pointsSpent * (reward?.productPriceCop ?? 0);
            }, 0);

        const redeemed = costFor(['delivered']);
        const pending = costFor(['pending', 'approved']);
        const committed =
          maxBudget > 0
            ? Math.round((redeemed / maxBudget) * 10000) / 100
            : 0;

        return json(route, {
          business_id: businessId,
          monthly_estimated_sales_cop: monthlySales,
          reference_budget_cop: referenceBudget,
          budget_rate: program?.budget_rate ?? 0,
          redeemed_rewards_cost_cop: redeemed,
          pending_rewards_cost_cop: pending,
          reserved_rewards_cost_cop: pending,
          remaining_budget_cop: Math.max(maxBudget - redeemed - pending, 0),
          budget_committed_percent: committed,
          max_monthly_reward_budget_cop: maxBudget,
          data_status: profile?.dataStatus ?? {},
          estimated: profile?.dailyAvgSales == null,
          calculated_at: now(),
        });
      }
      case 'business_audit_log_page': {
        if (!user) return fail(route, 'not_authenticated');
        const businessId = String(body.p_business_id ?? '');
        const operations = String(body.p_operation ?? '')
          .toLowerCase()
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean);
        const actor = String(body.p_actor ?? '').toLowerCase().trim();
        const search = String(body.p_search ?? '').toLowerCase().trim();
        const parseDate = (value: unknown) =>
          typeof value === 'string' && value ? new Date(value).getTime() : null;
        const from = parseDate(body.p_from);
        const to = parseDate(body.p_to);
        const limit = Math.max(Number(body.p_limit ?? 50), 1);
        const offset = Math.max(Number(body.p_offset ?? 0), 0);
        const filtered = state.auditLogs
          .filter((entry) => entry.businessId === businessId)
          .map((entry) => ({
            entry,
            actorUser: state.users.find(
              (candidate) => candidate.email === entry.actorEmail,
            ),
          }))
          .filter(({ entry, actorUser }) => {
            const operation = entry.operation.toLowerCase();
            if (
              operations.length > 0 &&
              !operations.some((pattern) => operation.includes(pattern))
            ) {
              return false;
            }
            if (actor) {
              const haystack = `${actorUser?.name ?? ''} ${entry.actorEmail ?? ''}`
                .toLowerCase();
              if (!haystack.includes(actor)) return false;
            }
            const createdAt = new Date(entry.createdAt).getTime();
            if (from !== null && createdAt < from) return false;
            if (to !== null && createdAt >= to) return false;
            if (search) {
              const haystack = [
                operation,
                entry.entityType,
                entry.entityId ?? '',
                entry.actorEmail ?? '',
                actorUser?.name ?? '',
                JSON.stringify(entry.metadata ?? {}),
              ]
                .join(' ')
                .toLowerCase();
              if (!haystack.includes(search)) return false;
            }
            return true;
          })
          .sort(
            (a, b) =>
              b.entry.createdAt.localeCompare(a.entry.createdAt) ||
              b.entry.id.localeCompare(a.entry.id),
          );
        return json(
          route,
          filtered.slice(offset, offset + limit).map(({ entry, actorUser }) => ({
            id: entry.id,
            actor_email: entry.actorEmail,
            actor_name: entry.actorName ?? actorUser?.name ?? null,
            operation: entry.operation,
            entity_type: entry.entityType,
            entity_id: entry.entityId,
            metadata: entry.metadata,
            created_at: entry.createdAt,
            total_count: filtered.length,
          })),
        );
      }

      // ------------------------------------------------------------------
      // Fase 6: campañas, vencimiento y snapshots
      // ------------------------------------------------------------------
      case 'loyalty_campaign_list': {
        if (!user) return fail(route, 'not_authenticated');
        const businessId = String(body.p_business_id ?? '');
        const onlyActive = Boolean(body.p_only_active);
        const nowIso = now();
        return json(
          route,
          state.campaigns
            .filter((item) => item.businessId === businessId)
            .filter((item) => !onlyActive || item.isActive)
            .sort(
              (a, b) =>
                Number(b.isActive) - Number(a.isActive) ||
                b.createdAt.localeCompare(a.createdAt),
            )
            .map((item) => ({
              id: item.id,
              business_id: item.businessId,
              name: item.name,
              description: item.description,
              multiplier: item.multiplier,
              bonus_points: item.bonusPoints,
              min_purchase_amount: item.minPurchaseAmount,
              valid_from: item.validFrom,
              valid_until: item.validUntil,
              is_active: item.isActive,
              is_current:
                item.isActive &&
                item.validFrom <= nowIso &&
                (!item.validUntil || item.validUntil > nowIso),
              created_at: item.createdAt,
              updated_at: item.updatedAt,
            })),
        );
      }
      case 'loyalty_campaign_upsert': {
        if (!isAdmin) return fail(route, 'forbidden');
        const businessId = String(body.p_business_id ?? '');
        const id = body.p_id ? String(body.p_id) : null;
        const existing = id
          ? state.campaigns.find(
              (item) => item.id === id && item.businessId === businessId,
            )
          : undefined;
        const createdAt = now();
        const campaign: FakeCampaign = {
          id: id ?? `camp-${crypto.randomUUID().slice(0, 8)}`,
          businessId,
          name: String(body.p_name ?? '').trim(),
          description: String(body.p_description ?? ''),
          multiplier: Number(body.p_multiplier ?? 2),
          bonusPoints: Number(body.p_bonus_points ?? 0),
          minPurchaseAmount: Number(body.p_min_purchase_amount ?? 0),
          validFrom: String(body.p_valid_from ?? createdAt),
          validUntil: body.p_valid_until ? String(body.p_valid_until) : null,
          isActive: body.p_is_active !== false,
          createdAt: existing?.createdAt ?? createdAt,
          updatedAt: createdAt,
        };
        if (existing) {
          const index = state.campaigns.indexOf(existing);
          state.campaigns[index] = campaign;
        } else {
          state.campaigns.push(campaign);
        }
        return json(route, {
          id: campaign.id,
          business_id: campaign.businessId,
          name: campaign.name,
          description: campaign.description,
          multiplier: campaign.multiplier,
          bonus_points: campaign.bonusPoints,
          min_purchase_amount: campaign.minPurchaseAmount,
          valid_from: campaign.validFrom,
          valid_until: campaign.validUntil,
          is_active: campaign.isActive,
          is_current: campaign.isActive,
          created_at: campaign.createdAt,
          updated_at: campaign.updatedAt,
        });
      }
      case 'loyalty_campaign_delete': {
        if (!isAdmin) return fail(route, 'forbidden');
        const businessId = String(body.p_business_id ?? '');
        const campaignId = String(body.p_campaign_id ?? '');
        const existing = state.campaigns.find(
          (item) => item.id === campaignId && item.businessId === businessId,
        );
        if (!existing) return fail(route, 'campaign_not_found');
        state.campaigns = state.campaigns.filter((item) => item.id !== campaignId);
        return json(route, { campaign_id: campaignId, deleted: true });
      }
      case 'points_expire_due': {
        if (!user) return fail(route, 'not_authenticated');
        return json(route, {
          lots_expired: 0,
          accounts_affected: 0,
          points_expired: 0,
        });
      }
      case 'loyalty_budget_snapshot_list': {
        if (!user) return fail(route, 'not_authenticated');
        const businessId = String(body.p_business_id ?? '');
        const limit = Math.max(Number(body.p_limit ?? 12), 1);
        const offset = Math.max(Number(body.p_offset ?? 0), 0);
        const filtered = state.budgetSnapshots
          .filter((item) => item.businessId === businessId)
          .sort((a, b) => b.periodStart.localeCompare(a.periodStart));
        return json(
          route,
          filtered.slice(offset, offset + limit).map((item) => ({
            id: item.id,
            period_start: item.periodStart,
            period_end: item.periodEnd,
            monthly_sales_cop: item.monthlySalesCop,
            budget_rate: item.budgetRate,
            reference_budget_cop: item.referenceBudgetCop,
            max_budget_cop: item.maxBudgetCop,
            redeemed_cost_cop: item.redeemedCostCop,
            pending_cost_cop: item.pendingCostCop,
            points_issued: item.pointsIssued,
            points_redeemed: item.pointsRedeemed,
            created_at: item.createdAt,
            total_count: filtered.length,
          })),
        );
      }
      case 'loyalty_budget_snapshot_create': {
        if (!user) return fail(route, 'not_authenticated');
        const businessId = String(body.p_business_id ?? '');
        const profile = state.economicProfiles[businessId];
        const program = state.loyaltyPrograms[businessId];
        const base = new Date();
        const start = new Date(
          Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), 1),
        );
        const end = new Date(
          Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + 1, 0),
        );
        const periodStart = start.toISOString().slice(0, 10);
        const periodEnd = end.toISOString().slice(0, 10);
        const monthlySales =
          profile?.dailyAvgSales != null && profile?.monthlyOperationDays != null
            ? profile.dailyAvgSales * profile.monthlyOperationDays
            : 0;
        const referenceBudget =
          monthlySales > 0 && program
            ? Math.floor(monthlySales * program.budget_rate)
            : 0;
        const maxBudget =
          profile?.maxMonthlyRewardBudget ?? referenceBudget;
        const existing = state.budgetSnapshots.find(
          (item) =>
            item.businessId === businessId && item.periodStart === periodStart,
        );
        const snapshot: FakeBudgetSnapshot = {
          id: existing?.id ?? `snap-${crypto.randomUUID().slice(0, 8)}`,
          businessId,
          periodStart,
          periodEnd,
          monthlySalesCop: monthlySales,
          budgetRate: program?.budget_rate ?? 0,
          referenceBudgetCop: referenceBudget,
          maxBudgetCop: maxBudget,
          redeemedCostCop: 0,
          pendingCostCop: 0,
          pointsIssued: Object.values(state.purchaseCredits).reduce(
            (sum, value) => sum + Math.max(value, 0),
            0,
          ),
          pointsRedeemed: 0,
          createdAt: now(),
        };
        state.budgetSnapshots = state.budgetSnapshots.filter(
          (item) =>
            !(
              item.businessId === businessId && item.periodStart === periodStart
            ),
        );
        state.budgetSnapshots.push(snapshot);
        return json(route, {
          id: snapshot.id,
          period_start: snapshot.periodStart,
          period_end: snapshot.periodEnd,
          monthly_sales_cop: snapshot.monthlySalesCop,
          budget_rate: snapshot.budgetRate,
          reference_budget_cop: snapshot.referenceBudgetCop,
          max_budget_cop: snapshot.maxBudgetCop,
          redeemed_cost_cop: snapshot.redeemedCostCop,
          pending_cost_cop: snapshot.pendingCostCop,
          points_issued: snapshot.pointsIssued,
          points_redeemed: snapshot.pointsRedeemed,
          created_at: snapshot.createdAt,
        });
      }

      default:
        return fail(route, `unknown_function:${functionName}`);
    }
  });
}
