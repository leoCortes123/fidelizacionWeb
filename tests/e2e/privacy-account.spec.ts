import { expect, test } from "@playwright/test";
import {
  createFakeState,
  injectSession,
  installFakeSupabase,
  TOKENS,
  type FakeState,
} from "./fake-supabase";

function seedBusiness(state: FakeState) {
  state.businesses.push({
    id: "biz-test",
    name: "Taquería El Fogón",
    slug: "taqueria-el-fogon",
    timezone: "America/Bogota",
    createdBy: "user-admin",
    createdAt: "2026-01-01T12:00:00.000Z",
  });
  state.memberships.push(
    {
      id: "mem-test",
      businessId: "biz-test",
      userId: "user-admin",
      role: "admin",
      canApproveRedemptions: false,
      createdAt: "2026-01-01T12:00:00.000Z",
    },
    {
      id: "mem-customer",
      businessId: "biz-test",
      userId: "user-customer",
      role: "cliente",
      canApproveRedemptions: false,
      createdAt: "2026-01-02T12:00:00.000Z",
    },
  );
  state.loyaltyPrograms["biz-test"] = {
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
}

test("cliente ve políticas aceptadas, descarga sus datos y elimina su cuenta", async ({
  browser,
}) => {
  const state = createFakeState();
  const context = await browser.newContext({ acceptDownloads: true });
  await injectSession(context, state, TOKENS.customer);
  const page = await context.newPage();
  await installFakeSupabase(page, state);

  await page.addInitScript(() => {
    window.localStorage.setItem(
      "fideliapp:draft:test-key",
      JSON.stringify({ phone: "3001234567" }),
    );
  });

  await page.goto("/customer/perfil");

  const consentsList = page.getByTestId("legal-consents-list");
  await expect(consentsList).toContainText(/Términos y Condiciones \(clientes\)/i);
  await expect(consentsList).toContainText(/Política de Tratamiento de Datos/i);
  await expect(consentsList).toContainText(/Vigente/i);

  // Descargar mis datos
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: /Descargar mis datos/i }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/^fideliapp-mis-datos-\d{4}-\d{2}-\d{2}\.json$/);
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  if (stream) {
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk));
    }
  }
  const exported = JSON.parse(Buffer.concat(chunks).toString("utf-8")) as {
    schema_version: string;
    profile: { email: string };
  };
  expect(exported.schema_version).toBe("1.0");
  expect(exported.profile.email).toBe("carla@example.test");

  // Eliminar cuenta
  await page.getByRole("button", { name: /Eliminar mi cuenta/i }).click();
  const dialog = page.getByRole("dialog", { name: /Eliminar mi cuenta/i });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText(/perderás de forma definitiva todas las monedas/i);

  const confirmBtn = dialog.getByRole("button", { name: /Confirmar eliminación/i });
  await expect(confirmBtn).toBeDisabled();

  await dialog.getByLabel(/Para confirmar, escribe/i).fill("ELIMINAR");
  await expect(confirmBtn).toBeEnabled();
  await confirmBtn.click();

  await expect(page).toHaveURL(/\/login/);
  const deletedUser = state.users.find((u) => u.id === "user-customer");
  expect(deletedUser?.name).toBe("Usuario eliminado");
  expect(deletedUser?.email).toBe("deleted+user-customer@anonymized.invalid");

  const leftoverDraft = await page.evaluate(() =>
    window.localStorage.getItem("fideliapp:draft:test-key"),
  );
  expect(leftoverDraft).toBeNull();
});

test("admin único recibe error ACCOUNT_LAST_ADMIN al intentar eliminar su cuenta", async ({
  browser,
}) => {
  const state = createFakeState();
  seedBusiness(state);
  const context = await browser.newContext();
  await injectSession(context, state, TOKENS.admin);
  const page = await context.newPage();
  await installFakeSupabase(page, state);

  await page.goto("/admin/perfil");
  await page.getByRole("button", { name: /Eliminar mi cuenta/i }).click();

  const dialog = page.getByRole("dialog", { name: /Eliminar mi cuenta/i });
  await dialog.getByLabel(/Para confirmar, escribe/i).fill("ELIMINAR");
  await dialog.getByRole("button", { name: /Confirmar eliminación/i }).click();

  await expect(dialog.getByRole("alert")).toContainText(/único administrador/i);
  await expect(page).toHaveURL(/\/admin\/perfil/);
});

test("cliente ve regla de vencimiento FIFO y próximos vencimientos en el negocio", async ({
  browser,
}) => {
  const state = createFakeState();
  seedBusiness(state);
  const customer = state.users.find((u) => u.id === "user-customer");
  if (customer) customer.balance = 120;
  const context = await browser.newContext();
  await injectSession(context, state, TOKENS.customer);
  const page = await context.newPage();
  await installFakeSupabase(page, state);

  await page.goto("/customer/business/biz-test");
  await page.getByRole("tab", { name: /MOVIMIENTOS/i }).click();

  const expiryBox = page.getByTestId("points-expiry-summary");
  await expect(expiryBox).toBeVisible();
  await expect(expiryBox).toContainText(/Vigencia FIFO: las monedas vencen a los 365 días/i);
  await expect(expiryBox).toContainText(/Próximo vencimiento:/i);
});
