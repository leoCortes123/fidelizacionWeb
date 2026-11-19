import { expect, test } from "@playwright/test";

test("la landing muestra la animación del proceso, el manual interactivo de 5 pasos y la descarga de la app", async ({
  page,
}) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto("/");

  await expect(
    page.getByRole("heading", { level: 1, name: /Programa de puntos para tu negocio/i }),
  ).toBeVisible();

  // Animación principal en el hero (ciclo completo) y en el manual (escena activa).
  const heroStage = page.locator(".hero-frame .fa-stage");
  await expect(heroStage).toBeVisible();
  const manualStage = page.locator(".manual-stage .fa-stage");
  await expect(manualStage).toBeVisible();
  await expect(manualStage).toHaveAttribute("data-active-moment", "1");

  // Botón "Descargar app" destacado en cabecera y hero.
  await expect(
    page.locator(".hero .hero-buttons").getByRole("button", { name: /Descargar app/i }),
  ).toBeVisible();
  await expect(
    page.locator(".hero .hero-buttons").getByRole("link", { name: /Crear mi programa de puntos/i }),
  ).toHaveAttribute("href", "/admin/onboarding?new=1");

  // Navegación por las pestañas del manual cambia tanto el texto como la escena animada.
  await page.getByRole("tab", { name: /Canje/i }).click();
  await expect(page.getByRole("tab", { name: /Canje/i })).toHaveAttribute("aria-selected", "true");
  await expect(manualStage).toHaveAttribute("data-active-moment", "4");
  await expect(
    page.getByRole("heading", { level: 3, name: /Aprueba el canje desde tu caja/i }),
  ).toBeVisible();

  await page.getByRole("button", { name: /Siguiente/i }).click();
  await expect(manualStage).toHaveAttribute("data-active-moment", "5");
  await expect(page.getByRole("button", { name: /Siguiente/i })).toBeDisabled();

  // Pregunta frecuente desplegable.
  const firstFaq = page.locator(".faq-item").first();
  await firstFaq.locator("summary").click();
  await expect(firstFaq).toHaveAttribute("open", "");

  // Control de pausa de animaciones (WCAG 2.2.2).
  await page.getByRole("button", { name: /Pausar animaciones/i }).click();
  await expect(page.getByRole("button", { name: /Reanudar animaciones/i })).toHaveAttribute(
    "aria-pressed",
    "true",
  );

  // Sin desbordamiento horizontal en escritorio.
  const overflowDesktop = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflowDesktop).toBeLessThanOrEqual(0);
  expect(pageErrors).toEqual([]);
});

test("la landing es responsiva en móvil (360px, 375px, 412px y 430px) con barra fija y sin recortes", async ({
  page,
}) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  for (const viewport of [
    { width: 430, height: 932 },
    { width: 412, height: 915 },
    { width: 375, height: 812 },
    { width: 360, height: 780 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/");

    await expect(page.locator(".hero-frame .fa-stage")).toBeVisible();
    await expect(page.locator(".manual-stage .fa-stage")).toBeVisible();

    // Barra fija inferior con "Descargar app" y "Crear programa".
    const mobileBar = page.getByRole("region", { name: "Acciones rápidas" });
    await expect(mobileBar).toBeVisible();
    await expect(mobileBar.getByRole("button", { name: /Descargar app/i })).toBeVisible();
    await expect(mobileBar.getByRole("link", { name: /Crear programa/i })).toBeVisible();

    // Ningún elemento (cabecera, HUD o manual) sobresale del ancho del viewport.
    const layout = await page.evaluate(() => {
      const docOverflow = document.documentElement.scrollWidth - window.innerWidth;
      const navActions = document
        .querySelector(".retro-header .nav-actions")
        ?.getBoundingClientRect();
      const frame = document.querySelector(".hero-frame")?.getBoundingClientRect();
      const hud = document.querySelector(".hero-frame .fa-stage-hud")?.getBoundingClientRect();
      const manualStage = document.querySelector(".manual-stage")?.getBoundingClientRect();
      const manualNav = document.querySelector(".manual-nav")?.getBoundingClientRect();
      return {
        docOverflow,
        navOverflowRight: navActions ? Math.round(navActions.right - window.innerWidth) : 0,
        hudOverflowRight: frame && hud ? Math.round(hud.right - frame.right) : 0,
        manualStageOverflowRight: manualStage
          ? Math.round(manualStage.right - window.innerWidth)
          : 0,
        manualNavOverflowRight: manualNav ? Math.round(manualNav.right - window.innerWidth) : 0,
      };
    });

    expect(layout.docOverflow).toBeLessThanOrEqual(0);
    expect(layout.navOverflowRight).toBeLessThanOrEqual(0);
    expect(layout.hudOverflowRight).toBeLessThanOrEqual(0);
    expect(layout.manualStageOverflowRight).toBeLessThanOrEqual(0);
    expect(layout.manualNavOverflowRight).toBeLessThanOrEqual(0);
  }

  expect(pageErrors).toEqual([]);
});
