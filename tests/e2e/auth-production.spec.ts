import { expect, test } from "@playwright/test";
import { createFakeState, injectSession, installFakeSupabase, TOKENS } from "./fake-supabase";

test("registro con confirmación requerida muestra 'Revisa tu correo', reenvía y vuelve al login", async ({
  page,
}) => {
  const state = createFakeState();
  await installFakeSupabase(page, state, { requireEmailConfirmation: true });

  await page.goto("/login?mode=register");
  await page.getByLabel(/^Nombre$/i).fill("Camila Confirmación");
  await page.getByLabel(/^Correo$/i).fill("camila@confirmar.test");
  await page.getByLabel(/^Contraseña$/i).fill("ClaveSegura1");
  await page.getByRole("checkbox", { name: /Acepto los/i }).check();
  await page.getByRole("button", { name: /^Crear cuenta$/i }).click();

  await expect(page.getByRole("heading", { name: /Revisa tu correo/i })).toBeVisible();
  await expect(page.getByText("camila@confirmar.test")).toBeVisible();

  await page.getByRole("button", { name: /Reenviar correo de confirmación/i }).click();
  await expect(
    page.getByText(/Reenviamos el enlace de confirmación a camila@confirmar\.test/i),
  ).toBeVisible();

  // Intentar iniciar sesión sin confirmar muestra error y permite reenviar.
  await page.getByRole("button", { name: /Volver a iniciar sesión/i }).click();
  await page.getByLabel(/^Correo$/i).fill("camila@confirmar.test");
  await page.getByLabel(/^Contraseña$/i).fill("ClaveSegura1");
  await page.getByRole("button", { name: /Entrar con correo/i }).click();

  await expect(page.getByText(/Debes confirmar tu correo antes de entrar/i)).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Reenviar correo de confirmación/i }),
  ).toBeVisible();
});

test("flujo de recuperación de contraseña en /login y /restablecer-clave", async ({ page }) => {
  const state = createFakeState();
  await installFakeSupabase(page, state);

  await page.goto("/login");
  await page.getByLabel(/^Correo$/i).fill("cliente@fideliapp.test");
  await page.getByRole("button", { name: /¿Olvidaste tu contraseña\?/i }).click();

  await expect(page.getByRole("heading", { name: /Restablecer contraseña/i })).toBeVisible();
  await expect(page.getByLabel(/Correo electrónico/i)).toHaveValue("cliente@fideliapp.test");
  await page.getByRole("button", { name: /Enviar enlace de recuperación/i }).click();

  await expect(
    page.getByText(/Si existe una cuenta con ese correo, recibirás un enlace/i),
  ).toBeVisible();

  // Simular llegada al enlace de recuperación /restablecer-clave con sesión activa.
  await injectSession(page.context(), state, TOKENS.customer);
  await page.goto("/restablecer-clave");

  await expect(page.getByRole("heading", { name: /Restablecer contraseña/i })).toBeVisible();
  await page.getByLabel(/^Nueva contraseña$/i).fill("NuevaClave123");
  await page.getByLabel(/^Confirmar contraseña$/i).fill("NuevaClave123");
  await page.getByRole("button", { name: /Guardar nueva contraseña/i }).click();

  await expect(page.getByText(/Contraseña actualizada/i)).toBeVisible();
});
