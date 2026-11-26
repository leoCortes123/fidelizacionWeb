import { expect, test } from "@playwright/test";
import {
  createFakeState,
  injectSession,
  installFakeSupabase,
  sessionFor,
  TOKENS,
} from "./fake-supabase";

test("la raíz / redirige a /login sin sesión y conserva ?install=1", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("link", { name: /Volver al inicio/i })).toHaveAttribute(
    "href",
    "https://fideliapp.pages.dev",
  );

  await page.goto("/?install=1");
  await expect(page).toHaveURL(/\/login\?install=1$/);
  await expect(page.getByRole("region", { name: /Instalar aplicación/i })).toBeVisible();
});

test("la raíz / redirige al panel admin cuando hay sesión de administrador", async ({
  browser,
}) => {
  const state = createFakeState();
  state.businesses.push({
    id: "biz-root",
    name: "Café Central",
    slug: "cafe-central",
    timezone: "America/Bogota",
    createdBy: "user-admin",
    createdAt: "2026-01-01T12:00:00.000Z",
  });
  state.memberships.push({
    id: "mem-root-admin",
    businessId: "biz-root",
    userId: "user-admin",
    role: "admin",
    canApproveRedemptions: false,
    createdAt: "2026-01-01T12:00:00.000Z",
  });

  const context = await browser.newContext();
  await injectSession(context, state, TOKENS.admin);
  const page = await context.newPage();
  await installFakeSupabase(page, state);
  const admin = state.users.find((u) => u.token === TOKENS.admin)!;
  await page.evaluate(
    ({ key, value }) => {
      try {
        window.localStorage.setItem(key, JSON.stringify(value));
      } catch {
        // Ignorado.
      }
    },
    { key: "sb-127-auth-token", value: sessionFor(admin) },
  );

  await page.goto("/");
  await expect(page).toHaveURL(/\/admin\/dashboard$/);
  await expect(page.getByRole("heading", { name: /^Café Central$/ })).toBeVisible();
  await context.close();
});
