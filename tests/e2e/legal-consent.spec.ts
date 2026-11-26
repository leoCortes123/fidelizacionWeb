import { expect, test } from "@playwright/test";
import { createFakeState, injectSession, installFakeSupabase, TOKENS } from "./fake-supabase";

test("registro por correo exige checkbox legal y registra el consentimiento al crear sesión", async ({
  page,
}) => {
  const state = createFakeState();
  await installFakeSupabase(page, state);

  await page.goto("/login?mode=register");
  await page.getByLabel(/^Nombre$/i).fill("Lucía Nueva");
  await page.getByLabel(/^Correo$/i).fill("lucia@nueva.test");
  await page.getByLabel(/^Contraseña$/i).fill("secreto123");

  // Sin marcar el checkbox debe bloquear el envío.
  await page.getByRole("button", { name: /^Crear cuenta$/i }).click();
  await expect(page.locator("#login-legal-consent-error")).toContainText(
    /Debes aceptar los Términos de uso y la Política de Tratamiento de Datos/i,
  );
  expect(state.users.some((u) => u.email === "lucia@nueva.test")).toBe(false);

  // Al marcarlo crea la cuenta, guarda consentimientos y entra al portal sin ConsentGate.
  await page.getByRole("checkbox", { name: /Acepto los/i }).check();
  await page.getByRole("button", { name: /^Crear cuenta$/i }).click();

  await expect(page).toHaveURL(/\/(customer|business\/select)/);
  const createdUser = state.users.find((u) => u.email === "lucia@nueva.test");
  expect(createdUser).toBeDefined();
  expect(
    state.legalConsents.some(
      (c) => c.userId === createdUser?.id && c.documentType === "terms_customer",
    ),
  ).toBe(true);
  expect(
    state.legalConsents.some(
      (c) => c.userId === createdUser?.id && c.documentType === "privacy_policy",
    ),
  ).toBe(true);
});

test("ConsentGate redirige a /aceptar-terminos cuando faltan consentimientos vigentes", async ({
  browser,
}) => {
  const state = createFakeState();
  // Simulamos usuario OAuth/existente sin consentimientos registrados.
  state.legalConsents = state.legalConsents.filter((c) => c.userId !== "user-customer");

  const context = await browser.newContext();
  await injectSession(context, state, TOKENS.customer);
  const page = await context.newPage();
  await installFakeSupabase(page, state);

  await page.goto("/customer");
  await expect(page).toHaveURL(/\/aceptar-terminos\?next=%2Fcustomer/);
  await expect(
    page.getByRole("heading", { name: /Acepta los documentos legales vigentes/i }),
  ).toBeVisible();

  await page.getByRole("checkbox", { name: /Acepto los/i }).check();
  await page.getByRole("button", { name: /Aceptar y continuar/i }).click();

  await expect(page).toHaveURL(/\/customer/);
  expect(
    state.legalConsents.some(
      (c) => c.userId === "user-customer" && c.documentType === "terms_customer",
    ),
  ).toBe(true);

  await context.close();
});

test("OnboardingWizardPage bloquea creación de negocio sin Términos B2B + DPA y permite al aceptarlos", async ({
  browser,
}) => {
  const state = createFakeState();
  const context = await browser.newContext();
  await injectSession(context, state, TOKENS.admin);
  const page = await context.newPage();
  await installFakeSupabase(page, state);

  await page.goto("/admin/onboarding?new=1");
  await page.getByLabel("Nombre del negocio").fill("Panadería Sol");

  // Sin checkboxes B2B debe bloquear antes de llamar a business_register.
  await page.getByRole("button", { name: /Guardar y continuar/i }).click();
  await expect(
    page.getByText(/Acepta los documentos legales para negocios antes de continuar/i),
  ).toBeVisible();
  expect(state.businesses.some((b) => b.slug === "panaderia-sol")).toBe(false);

  await page.getByRole("checkbox", { name: /Acepto los Términos para Negocios/i }).check();
  await page.getByRole("checkbox", { name: /Declaro que tengo facultad legal/i }).check();
  await page.getByRole("button", { name: /Guardar y continuar/i }).click();

  await expect(page.getByRole("heading", { name: /Paso 2 · Datos económicos/i })).toBeVisible();
  expect(state.businesses.some((b) => b.slug === "panaderia-sol")).toBe(true);

  await context.close();
});
