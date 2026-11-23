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

  // Fondo animado Eaters presente sin interferir con el contenido.
  await expect(page.locator(".eaters-canvas")).toBeVisible();

  // Botón "Descargar app" destacado en cabecera y botones CTA verde + azul en el hero.
  await expect(
    page.locator(".retro-header").getByRole("button", { name: /Descargar app/i }),
  ).toBeVisible();
  const startButton = page
    .locator(".hero .hero-buttons")
    .getByRole("link", { name: /Crear mi programa de puntos/i });
  const howItWorksButton = page
    .locator(".hero .hero-buttons")
    .getByRole("link", { name: /Ver cómo funciona/i });
  await expect(startButton).toHaveAttribute("href", "/admin/onboarding?new=1");
  await expect(howItWorksButton).toHaveAttribute("href", "#como-funciona");

  // En escritorio: botón "Ver cómo funciona" azul al lado derecho del botón verde "Crear mi programa...".
  const heroButtonsGeometry = await page.evaluate(() => {
    const start = document.querySelector(".hero .hero-buttons .btn-start");
    const how = document.querySelector(".hero .hero-buttons .btn-primary");
    if (!start || !how) return null;
    const startRect = start.getBoundingClientRect();
    const howRect = how.getBoundingClientRect();
    const startBg = getComputedStyle(start).backgroundColor;
    const howBg = getComputedStyle(how).backgroundColor;
    return {
      startLeft: startRect.left,
      startRight: startRect.right,
      startTop: startRect.top,
      howLeft: howRect.left,
      howTop: howRect.top,
      startBg,
      howBg,
    };
  });
  expect(heroButtonsGeometry).not.toBeNull();
  expect(heroButtonsGeometry!.howLeft).toBeGreaterThanOrEqual(heroButtonsGeometry!.startRight);
  expect(Math.abs(heroButtonsGeometry!.startTop - heroButtonsGeometry!.howTop)).toBeLessThanOrEqual(
    2,
  );
  // Verde (G dominante) para iniciar y azul (B dominante) para ver cómo funciona.
  const parseRgb = (rgb: string) => (rgb.match(/\d+/g) ?? []).map(Number);
  const [sr, sg, sb] = parseRgb(heroButtonsGeometry!.startBg);
  const [hr, hg, hb] = parseRgb(heroButtonsGeometry!.howBg);
  expect(sg).toBeGreaterThan(sr);
  expect(sg).toBeGreaterThan(sb);
  expect(hb).toBeGreaterThan(hr);
  expect(hb).toBeGreaterThan(hg);

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

  // Sin botones de pausa/reproducir y alineación superior entre eyebrow y HUD de escenas en escritorio.
  await expect(page.getByRole("button", { name: /Pausar animación/i })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Reproducir animación/i })).toHaveCount(0);

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

  // Todas las escenas (incluidas 2, 4 y 5 de título largo) mantienen el HUD en una sola línea:
  // texto a la izquierda, botones a la derecha y sin saltos ni truncamiento.
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
      const titleCenterY = titleRect.top + titleRect.height / 2;
      const dotsCenterY = dotsRect.top + dotsRect.height / 2;
      return {
        hudHeight: hudRect.height,
        titleRight: titleRect.right,
        dotsLeft: dotsRect.left,
        centerDeltaY: Math.abs(titleCenterY - dotsCenterY),
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

  // Sin desbordamiento horizontal en escritorio.
  const overflowDesktop = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflowDesktop).toBeLessThanOrEqual(0);
  expect(pageErrors).toEqual([]);
});

test("en escritorio cada sección (hero, manual en sus 5 pasos y demás secciones) cabe completa en 1vh sin desbordarse", async ({
  page,
}) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  const desktopViewports = [
    { width: 921, height: 600 },
    { width: 960, height: 600 },
    { width: 1024, height: 600 },
    { width: 1280, height: 620 },
    { width: 1280, height: 720 },
    { width: 1366, height: 768 },
    { width: 1440, height: 900 },
    { width: 1920, height: 600 },
    { width: 1920, height: 1080 },
  ];

  await page.goto("/");
  await expect(page.locator(".hero-frame .fa-stage")).toBeVisible();
  await expect(page.locator(".manual-stage .fa-stage")).toBeVisible();

  for (const viewport of desktopViewports) {
    await page.setViewportSize(viewport);
    await page.waitForTimeout(80);

    // 1. Verificar cabecera en una línea y que los botones del hero permanecen lado a lado (verde izq, azul der)
    const heroCheck = await page.evaluate(() => {
      const header = document.querySelector(".retro-header")!.getBoundingClientRect();
      const navLinksOverflow = Array.from(
        document.querySelectorAll<HTMLElement>(".retro-header .navlinks a"),
      ).some((a) => a.getBoundingClientRect().bottom > header.bottom + 1);
      const hero = document.querySelector(".hero")!.getBoundingClientRect();
      const ticker = document.querySelector(".ticker")!.getBoundingClientRect();
      const start = document
        .querySelector(".hero .hero-buttons .btn-start")!
        .getBoundingClientRect();
      const how = document
        .querySelector(".hero .hero-buttons .btn-primary")!
        .getBoundingClientRect();
      const eyebrow = document.querySelector(".hero .eyebrow")!.getBoundingClientRect();
      const hud = document.querySelector(".hero-frame .fa-stage-hud")!.getBoundingClientRect();
      const proof = document.querySelector(".hero .hero-proof")!.getBoundingClientRect();
      const heroArt = document.querySelector(".hero .hero-art")!.getBoundingClientRect();
      return {
        viewportH: window.innerHeight,
        headerH: header.height,
        navLinksOverflow,
        heroScreenH: header.height + hero.height + ticker.height,
        sameRow: Math.abs(start.top - how.top) <= 2 && how.left >= start.right,
        eyebrowAligned:
          Math.abs(eyebrow.top - hud.top) <= 2 && Math.abs(eyebrow.height - hud.height) <= 2,
        proofGapToTicker: Math.round(ticker.top - proof.bottom),
        proofInLeftColumn: proof.right <= heroArt.left + 1,
        docOverflowX: document.documentElement.scrollWidth - window.innerWidth,
      };
    });

    expect(
      heroCheck.navLinksOverflow,
      `Los enlaces del header no deben desbordarse en ${viewport.width}x${viewport.height}`,
    ).toBe(false);
    expect(
      heroCheck.heroScreenH,
      `Hero + header + ticker desborda 1vh en ${viewport.width}x${viewport.height}`,
    ).toBeLessThanOrEqual(viewport.height + 2);
    expect(
      heroCheck.sameRow,
      `Botones del hero deben ir lado a lado en ${viewport.width}x${viewport.height}`,
    ).toBe(true);
    expect(
      heroCheck.eyebrowAligned,
      `Eyebrow y HUD deben alinearse en ${viewport.width}x${viewport.height}`,
    ).toBe(true);
    expect(
      heroCheck.proofGapToTicker,
      `Las etiquetas .hero-proof deben permanecer cerca del banner inferior en ${viewport.width}x${viewport.height}`,
    ).toBeGreaterThanOrEqual(0);
    expect(
      heroCheck.proofGapToTicker,
      `Las etiquetas .hero-proof deben permanecer cerca del banner inferior en ${viewport.width}x${viewport.height}`,
    ).toBeLessThanOrEqual(24);
    expect(
      heroCheck.proofInLeftColumn,
      `Las etiquetas .hero-proof deben pertenecer solo a la columna izquierda en ${viewport.width}x${viewport.height}`,
    ).toBe(true);
    expect(heroCheck.docOverflowX).toBeLessThanOrEqual(0);

    // 2. Verificar que el manual cabe en 1vh en cada uno de sus 5 pasos
    for (const stepNum of [1, 2, 3, 4, 5]) {
      await page.locator(`#paso-tab-${stepNum}`).click();
      const manualH = await page.evaluate(() => {
        const headerH = document.querySelector(".retro-header")!.getBoundingClientRect().height;
        const sectionH = document.querySelector("#como-funciona")!.getBoundingClientRect().height;
        return { sectionH, maxAllowed: window.innerHeight - headerH + 2 };
      });
      expect(
        manualH.sectionH,
        `Manual paso ${stepNum} desborda 1vh en ${viewport.width}x${viewport.height}`,
      ).toBeLessThanOrEqual(manualH.maxAllowed);
    }

    // 3. Verificar todas las demás secciones + cierre (CTA final + footer)
    const sections = await page.evaluate(() => {
      const headerH = document.querySelector(".retro-header")!.getBoundingClientRect().height;
      const footerH = document.querySelector(".retro-footer")!.getBoundingClientRect().height;
      const maxSectionH = window.innerHeight - headerH + 2;
      return Array.from(document.querySelectorAll<HTMLElement>("main > section.retro-section")).map(
        (el, idx) => {
          const isClosing = el.classList.contains("cta-section");
          const rect = el.getBoundingClientRect();
          return {
            id: el.id || el.className || `section-${idx}`,
            height: isClosing ? rect.height + footerH : rect.height,
            maxAllowed: maxSectionH,
          };
        },
      );
    });

    for (const sec of sections) {
      expect(
        sec.height,
        `Sección "${sec.id}" desborda 1vh en ${viewport.width}x${viewport.height}`,
      ).toBeLessThanOrEqual(sec.maxAllowed);
    }
  }

  // Verificar también modo oscuro: .lead sin caja contenedora y con cambio de color de alto contraste.
  await page.setViewportSize({ width: 1280, height: 720 });
  const lightLead = await page.evaluate(() => {
    const cs = getComputedStyle(document.querySelector(".hero .lead")!);
    return { color: cs.color, bg: cs.backgroundColor };
  });
  await page.evaluate(() => document.documentElement.classList.add("dark"));
  const darkLead = await page.evaluate(() => {
    const cs = getComputedStyle(document.querySelector(".hero .lead")!);
    return { color: cs.color, bg: cs.backgroundColor };
  });
  expect(lightLead.bg).toBe("rgba(0, 0, 0, 0)");
  expect(darkLead.bg).toBe("rgba(0, 0, 0, 0)");
  expect(darkLead.color).not.toBe(lightLead.color);

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

    // Ningún elemento (cabecera, HUD, letrero de pasos, paginación o tabla comparativa) sobresale del ancho del viewport.
    const layout = await page.evaluate(() => {
      const docOverflow = document.documentElement.scrollWidth - window.innerWidth;
      const navActions = document
        .querySelector(".retro-header .nav-actions")
        ?.getBoundingClientRect();
      const frame = document.querySelector(".hero-frame")?.getBoundingClientRect();
      const hud = document.querySelector(".hero-frame .fa-stage-hud")?.getBoundingClientRect();
      const manualStage = document.querySelector(".manual-stage")?.getBoundingClientRect();
      const manualStepper = document.querySelector(".manual-stepper")?.getBoundingClientRect();
      const manualPagination = document.querySelector(".manual-pagination") as HTMLElement | null;
      const compareWrap = document.querySelector(".compare-wrap") as HTMLElement | null;
      return {
        docOverflow,
        navOverflowRight: navActions ? Math.round(navActions.right - window.innerWidth) : 0,
        hudOverflowRight: frame && hud ? Math.round(hud.right - frame.right) : 0,
        manualStageOverflowRight: manualStage
          ? Math.round(manualStage.right - window.innerWidth)
          : 0,
        manualStepperOverflowRight: manualStepper
          ? Math.round(manualStepper.right - window.innerWidth)
          : 0,
        manualPaginationScrollOverflow: manualPagination
          ? manualPagination.scrollWidth - manualPagination.clientWidth
          : 0,
        compareScrollOverflow: compareWrap ? compareWrap.scrollWidth - compareWrap.clientWidth : 0,
      };
    });

    expect(layout.docOverflow).toBeLessThanOrEqual(0);
    expect(layout.navOverflowRight).toBeLessThanOrEqual(0);
    expect(layout.hudOverflowRight).toBeLessThanOrEqual(0);
    expect(layout.manualStageOverflowRight).toBeLessThanOrEqual(0);
    expect(layout.manualStepperOverflowRight).toBeLessThanOrEqual(0);
    expect(layout.manualPaginationScrollOverflow).toBeLessThanOrEqual(1);
    expect(layout.compareScrollOverflow).toBeLessThanOrEqual(1);
  }

  expect(pageErrors).toEqual([]);
});
