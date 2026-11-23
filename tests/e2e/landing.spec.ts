import { expect, test } from "@playwright/test";

test("el inicio muestra animación 1vh, botones CTA, explorador de roles, marquesina pausable y modo oscuro", async ({
  page,
}) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto("/");

  await expect(
    page.getByRole("heading", { level: 1, name: /Programa de puntos para tu negocio/i }),
  ).toBeVisible();

  // Animación principal en el hero y fondo animado Eaters presentes.
  const heroStage = page.locator(".hero-frame .fa-stage");
  await expect(heroStage).toBeVisible();
  await expect(page.locator(".eaters-canvas")).toBeVisible();

  // Botón "Descargar app" en cabecera y CTAs verde + azul en el hero.
  await expect(
    page.locator(".retro-header").getByRole("button", { name: /Descargar app/i }),
  ).toBeVisible();
  const startButton = page
    .locator(".hero .hero-buttons")
    .getByRole("link", { name: /Empezar gratis/i });
  const pricingButton = page
    .locator(".hero .hero-buttons")
    .getByRole("link", { name: /Ver planes y precios/i });
  await expect(startButton).toHaveAttribute("href", "/admin/onboarding?new=1");
  await expect(pricingButton).toHaveAttribute("href", "/precios");

  // En escritorio: botón azul al lado derecho del botón verde y colores correctos.
  const heroButtonsGeometry = await page.evaluate(() => {
    const start = document.querySelector(".hero .hero-buttons .btn-start");
    const primary = document.querySelector(".hero .hero-buttons .btn-primary");
    if (!start || !primary) return null;
    const startRect = start.getBoundingClientRect();
    const primaryRect = primary.getBoundingClientRect();
    return {
      startRight: startRect.right,
      startTop: startRect.top,
      primaryLeft: primaryRect.left,
      primaryTop: primaryRect.top,
      startBg: getComputedStyle(start).backgroundColor,
      primaryBg: getComputedStyle(primary).backgroundColor,
    };
  });
  expect(heroButtonsGeometry).not.toBeNull();
  expect(heroButtonsGeometry!.primaryLeft).toBeGreaterThanOrEqual(heroButtonsGeometry!.startRight);
  expect(
    Math.abs(heroButtonsGeometry!.startTop - heroButtonsGeometry!.primaryTop),
  ).toBeLessThanOrEqual(2);

  const parseRgb = (rgb: string) => (rgb.match(/\d+/g) ?? []).map(Number);
  const [sr, sg, sb] = parseRgb(heroButtonsGeometry!.startBg);
  const [pr, pg, pb] = parseRgb(heroButtonsGeometry!.primaryBg);
  expect(sg).toBeGreaterThan(sr);
  expect(sg).toBeGreaterThan(sb);
  expect(pb).toBeGreaterThan(pr);
  expect(pb).toBeGreaterThan(pg);

  // Alineación superior entre eyebrow y HUD de escenas en escritorio.
  const alignment = await page.evaluate(() => {
    const eyebrow = document.querySelector(".hero .eyebrow")?.getBoundingClientRect();
    const hud = document.querySelector(".hero-frame .fa-stage-hud")?.getBoundingClientRect();
    return {
      eyebrowTop: eyebrow?.top ?? -1,
      hudTop: hud?.top ?? -100,
      eyebrowHeight: eyebrow?.height ?? 0,
      hudHeight: hud?.height ?? 0,
    };
  });
  expect(Math.abs(alignment.eyebrowTop - alignment.hudTop)).toBeLessThanOrEqual(2);
  expect(Math.abs(alignment.eyebrowHeight - alignment.hudHeight)).toBeLessThanOrEqual(2);

  // Todas las escenas mantienen el HUD en una sola línea sin truncamiento.
  for (const num of [1, 2, 3, 4, 5]) {
    await heroStage.locator(`.fa-hud-dot[data-goto-moment="${num}"]`).click();
    await expect(heroStage).toHaveAttribute("data-active-moment", String(num));
    const hudCheck = await page.evaluate(() => {
      const hud = document.querySelector(".hero-frame .fa-stage-hud");
      const title = document.querySelector(".hero-frame .fa-hud-stage");
      const dots = document.querySelector(".hero-frame .fa-hud-dots");
      if (!hud || !title || !dots) return null;
      const hudRect = hud.getBoundingClientRect();
      const titleRect = title.getBoundingClientRect();
      const dotsRect = dots.getBoundingClientRect();
      return {
        hudHeight: hudRect.height,
        titleRight: titleRect.right,
        dotsLeft: dotsRect.left,
        centerDeltaY: Math.abs(
          titleRect.top + titleRect.height / 2 - (dotsRect.top + dotsRect.height / 2),
        ),
        titleScrollOverflow: title.scrollWidth - title.clientWidth,
        hudOverflowRight: Math.round(dotsRect.right - hudRect.right),
      };
    });
    expect(hudCheck).not.toBeNull();
    expect(hudCheck!.hudHeight).toBeLessThanOrEqual(52);
    expect(hudCheck!.titleRight).toBeLessThanOrEqual(hudCheck!.dotsLeft + 1);
    expect(hudCheck!.centerDeltaY).toBeLessThanOrEqual(3);
    expect(hudCheck!.titleScrollOverflow).toBeLessThanOrEqual(1);
    expect(hudCheck!.hudOverflowRight).toBeLessThanOrEqual(0);
  }

  // Control de pausa de marquesina (WCAG 2.2.2).
  await page.getByRole("button", { name: /Pausar marquesina/i }).click();
  await expect(page.locator(".ticker")).toHaveClass(/ticker-paused/);

  // Explorador interactivo por rol.
  await page.getByRole("tab", { name: /Encargado en caja/i }).click();
  await expect(page.getByRole("tab", { name: /Encargado en caja/i })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(
    page.getByRole("heading", { level: 3, name: /Genera el QR de venta/i }),
  ).toBeVisible();

  // Alternancia de modo oscuro desde el botón pixel art del header.
  const lightLead = await page.evaluate(() => {
    const cs = getComputedStyle(document.querySelector(".hero .lead")!);
    return { color: cs.color, bg: cs.backgroundColor };
  });
  await page.getByRole("button", { name: /Cambiar a modo oscuro/i }).click();
  await expect(page.locator("html")).toHaveClass(/\bdark\b/);
  const darkLead = await page.evaluate(() => {
    const cs = getComputedStyle(document.querySelector(".hero .lead")!);
    return { color: cs.color, bg: cs.backgroundColor };
  });
  expect(lightLead.bg).toBe("rgba(0, 0, 0, 0)");
  expect(darkLead.bg).toBe("rgba(0, 0, 0, 0)");
  expect(darkLead.color).not.toBe(lightLead.color);

  const overflowDesktop = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflowDesktop).toBeLessThanOrEqual(0);
  expect(pageErrors).toEqual([]);
});

test("navegación multipágina: Cómo funciona, Funciones, Precios y Preguntas", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto("/");

  // 1. Cómo funciona: manual de 5 pasos con animación sincronizada.
  await page
    .locator(".retro-header .navlinks")
    .getByRole("link", { name: "Cómo funciona" })
    .click();
  await expect(page).toHaveURL(/\/como-funciona$/);
  await expect(
    page.getByRole("heading", { level: 1, name: /¿Cómo funciona .* en tu negocio\?/i }),
  ).toBeVisible();

  const manualStage = page.locator(".manual-stage .fa-stage");
  await expect(manualStage).toBeVisible();
  await expect(manualStage).toHaveAttribute("data-active-moment", "1");

  await page.getByRole("tab", { name: /Canje/i }).click();
  await expect(manualStage).toHaveAttribute("data-active-moment", "4");
  await expect(
    page.getByRole("heading", { level: 3, name: /Aprueba el canje desde tu caja/i }),
  ).toBeVisible();

  await page.getByRole("button", { name: /Paso siguiente/i }).click();
  await expect(manualStage).toHaveAttribute("data-active-moment", "5");
  await expect(page.getByRole("button", { name: /Paso siguiente/i })).toBeDisabled();

  // 2. Funciones: módulos con ilustraciones pixel art cargadas.
  await page.locator(".retro-header .navlinks").getByRole("link", { name: "Funciones" }).click();
  await expect(page).toHaveURL(/\/funciones$/);
  await expect(
    page.getByRole("heading", { level: 1, name: /Todo lo que .* hace por tu negocio/i }),
  ).toBeVisible();
  const heroArtLoaded = await page.evaluate(() => {
    const img = document.querySelector<HTMLImageElement>(".hero-static-img");
    return Boolean(img && img.complete && img.naturalWidth > 0);
  });
  expect(heroArtLoaded).toBe(true);

  // 3. Precios: selector mensual/anual actualiza importes COP.
  await page.locator(".retro-header .navlinks").getByRole("link", { name: "Precios" }).click();
  await expect(page).toHaveURL(/\/precios$/);
  await expect(page.getByText(/59\.000/)).toBeVisible();
  await page.getByRole("button", { name: /Pago anual/i }).click();
  await expect(page.getByText(/49\.000/)).toBeVisible();
  await expect(page.locator(".compare-plans-wrap")).toBeVisible();

  // 4. Preguntas: búsqueda y acordeón desplegable.
  await page.locator(".retro-header .navlinks").getByRole("link", { name: "Preguntas" }).click();
  await expect(page).toHaveURL(/\/preguntas$/);
  const firstFaq = page.locator(".faq-item").first();
  await firstFaq.locator("summary").click();
  await expect(firstFaq).toHaveAttribute("open", "");
  await page.getByRole("searchbox", { name: /Buscar pregunta/i }).fill("mezcla");
  await expect(page.locator(".faq-item")).toHaveCount(1);

  expect(pageErrors).toEqual([]);
});

test("el sitio público es responsivo en móvil (360px, 375px, 412px y 430px) sin desbordamiento", async ({
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

    // Escena 5 (título más largo) sigue en una sola línea en móvil sin truncar.
    const heroStageMobile = page.locator(".hero-frame .fa-stage");
    await heroStageMobile.locator('.fa-hud-dot[data-goto-moment="5"]').click();
    await expect(heroStageMobile).toHaveAttribute("data-active-moment", "5");

    const mobileHud = await page.evaluate(() => {
      const hud = document.querySelector(".hero-frame .fa-stage-hud");
      const title = document.querySelector(".hero-frame .fa-hud-stage");
      const dots = document.querySelector(".hero-frame .fa-hud-dots");
      if (!hud || !title || !dots) return null;
      const hudRect = hud.getBoundingClientRect();
      const titleRect = title.getBoundingClientRect();
      const dotsRect = dots.getBoundingClientRect();
      return {
        hudHeight: hudRect.height,
        titleRight: titleRect.right,
        dotsLeft: dotsRect.left,
        titleScrollOverflow: title.scrollWidth - title.clientWidth,
        centerDeltaY: Math.abs(
          titleRect.top + titleRect.height / 2 - (dotsRect.top + dotsRect.height / 2),
        ),
      };
    });
    expect(mobileHud).not.toBeNull();
    expect(mobileHud!.hudHeight).toBeLessThanOrEqual(52);
    expect(mobileHud!.titleRight).toBeLessThanOrEqual(mobileHud!.dotsLeft + 1);
    expect(mobileHud!.titleScrollOverflow).toBeLessThanOrEqual(1);
    expect(mobileHud!.centerDeltaY).toBeLessThanOrEqual(3);

    // Barra fija inferior con "Descargar app" y "Crear programa".
    const mobileBar = page.getByRole("region", { name: "Acciones rápidas" });
    await expect(mobileBar).toBeVisible();
    await expect(mobileBar.getByRole("button", { name: /Descargar app/i })).toBeVisible();
    await expect(mobileBar.getByRole("link", { name: /Crear programa/i })).toBeVisible();

    // Menú móvil abre y cierra correctamente.
    const menuBtn = page.getByRole("button", { name: /Abrir menú/i });
    await expect(menuBtn).toBeVisible();
    await menuBtn.click();
    await expect(page.getByRole("navigation", { name: "Menú móvil" })).toBeVisible();
    await page.getByRole("button", { name: /Cerrar menú/i }).click();
    await expect(page.getByRole("navigation", { name: "Menú móvil" })).toHaveCount(0);

    // Sin desbordamiento horizontal en inicio y cabecera dentro del viewport.
    const homeLayout = await page.evaluate(() => {
      const navActions = document
        .querySelector(".retro-header .nav-actions")
        ?.getBoundingClientRect();
      return {
        overflow: document.documentElement.scrollWidth - window.innerWidth,
        navOverflowRight: navActions ? Math.round(navActions.right - window.innerWidth) : 0,
      };
    });
    expect(homeLayout.overflow).toBeLessThanOrEqual(0);
    expect(homeLayout.navOverflowRight).toBeLessThanOrEqual(0);

    await page.goto("/precios");
    await expect(page.locator(".pricing-grid")).toBeVisible();
    // En móvil el filtro de tabla comparativa sí es visible e interactivo.
    await page.getByRole("button", { name: /Level Up · Pro/i }).click();
    await expect(page.locator(".compare-plans-wrap")).toHaveAttribute("data-plan-filter", "pro");
    const pricingOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(pricingOverflow).toBeLessThanOrEqual(0);
  }

  expect(pageErrors).toEqual([]);
});
