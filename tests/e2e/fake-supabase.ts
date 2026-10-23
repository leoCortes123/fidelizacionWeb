import type { BrowserContext, Page, Route } from '@playwright/test';

/**
 * Backend de pruebas en memoria para Playwright.
 *
 * No sustituye a Supabase en producción: permite ejercitar la interfaz completa
 * (QR, reclamación, canje y entrega) sin credenciales externas. La lógica real de
 * base de datos se prueba en tests/db/run-tests.sql contra PostgreSQL + RLS.
 */

export type FakeRole = 'customer' | 'registrar' | 'admin';

export interface FakeUser {
  id: string;
  name: string;
  email: string;
  token: string;
  roles: FakeRole[];
  balance: number;
  createdAt: string;
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
  amount_cop: number;
  status: 'pending_claim' | 'claimed' | 'expired' | 'cancelled';
  points_awarded: number;
  customerId: string | null;
  registrarId: string;
  createdAt: string;
  expiresAt: string;
  claimed_at: string | null;
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
        token: TOKENS.registrar,
        roles: ['customer'],
        balance: 0,
        createdAt: '2026-01-10T12:00:00.000Z',
      },
      {
        id: 'user-customer',
        name: 'Carla Cliente',
        email: 'carla@example.test',
        token: TOKENS.customer,
        roles: ['customer'],
        balance: 0,
        createdAt: '2026-02-11T12:00:00.000Z',
      },
      {
        id: 'user-customer2',
        name: 'Diego Cliente',
        email: 'diego@example.test',
        token: TOKENS.customer2,
        roles: ['customer'],
        balance: 0,
        createdAt: '2026-03-12T12:00:00.000Z',
      },
      {
        id: 'user-admin',
        name: 'Ana Admin',
        email: 'admin@example.test',
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

function sessionFor(user: FakeUser) {
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
      email_confirmed_at: now(),
      phone: '',
      confirmed_at: now(),
      last_sign_in_at: now(),
      app_metadata: { provider: 'google', providers: ['google'] },
      user_metadata: { full_name: user.name, name: user.name },
      identities: [],
      created_at: user.createdAt,
      updated_at: now(),
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
    const user = userFor(state, token);
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
    const body = (request.postDataJSON() ?? {}) as Record<string, unknown>;
    const token = (request.headers()['authorization'] ?? '').replace(
      /^Bearer\s+/i,
      '',
    );
    const user = userFor(state, token);
    const isStaff = Boolean(user?.roles.includes('admin'));
    const isAdmin = Boolean(user?.roles.includes('admin'));

    if (!user && functionName !== 'get_program_settings') {
      return fail(route, 'not_authenticated');
    }

    switch (functionName) {
      case 'get_my_roles':
        return json(route, user?.roles ?? []);
      case 'get_my_profile':
        return json(route, {
          id: user?.id,
          full_name: user?.name,
          email: user?.email,
          created_at: user?.createdAt,
        });
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
        const rows = state.users
          .filter((item) => item.roles.includes('customer'))
          .filter((item) => !item.roles.includes('admin'))
          .filter(
            (item) =>
              !search ||
              item.name.toLowerCase().includes(search) ||
              item.email.toLowerCase().includes(search),
          )
          .map((item) => {
            const claimed = state.purchases.filter(
              (purchase) =>
                purchase.customerId === item.id && purchase.status === 'claimed',
            );
            return {
              id: item.id,
              full_name: item.name,
              email: item.email,
              points_balance: item.balance,
              purchase_count: claimed.length,
              total_spent: claimed.reduce(
                (sum, purchase) => sum + purchase.amount_cop,
                0,
              ),
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
        return json(route, {
          profile: {
            id: customer.id,
            full_name: customer.name,
            email: customer.email,
            created_at: customer.createdAt,
          },
          points_balance: customer.balance,
          purchase_count: claimed.length,
          total_spent: claimed.reduce(
            (sum, purchase) => sum + purchase.amount_cop,
            0,
          ),
          purchases: claimed.map((purchase) => ({
            id: purchase.id,
            amount_cop: purchase.amount_cop,
            points_awarded: purchase.points_awarded,
            claimed_at: purchase.claimed_at,
            status: purchase.status,
          })),
          movements,
          redemptions: state.redemptions
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
      default:
        return fail(route, `unknown_function:${functionName}`);
    }
  });
}
