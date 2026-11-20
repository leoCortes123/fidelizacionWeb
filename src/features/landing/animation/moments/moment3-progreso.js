import {
  spriteFideliappCoin,
  spriteRewardLock,
  spriteRewardTrophy,
  spritePixelHeart,
} from "../assets/pixel-sprites.js";

export const MOMENT3_META = {
  id: "moment-3-progreso",
  number: 3,
  stageLabel: "PASO 03 · PROGRESO",
  title: "Progreso en la tarjeta de recompensas",
  description: "TU CLIENTE AVANZA Y DESBLOQUEA PREMIO",
  duration: 3.65,
  defaultPause: 1.2,
};

export function renderMoment3HTML() {
  const blocksHTML = Array.from({ length: 10 }, (_, idx) => {
    const blockNum = idx + 1;
    const isInitial = blockNum <= 6;
    return `<span class="fa-prog-block ${isInitial ? "is-initial" : "is-step"}" data-block="${blockNum}"></span>`;
  }).join("");

  return `
    <div class="fa-moment fa-moment-3" data-moment="3">
      <p class="fa-scene-caption">
        TU CLIENTE AVANZA Y <span class="fa-txt-accent">DESBLOQUEA PREMIO</span>
      </p>

      <!-- Monedas de Fideliapp que se absorben hacia la barra de progreso -->
      <div class="fa-m3-absorb-coins" aria-hidden="true">
        <div class="fa-flying-coin fa-m3-coin-a">${spriteFideliappCoin()}</div>
        <div class="fa-flying-coin fa-m3-coin-b">${spriteFideliappCoin()}</div>
        <div class="fa-flying-coin fa-m3-coin-c">${spriteFideliappCoin()}</div>
      </div>

      <!-- Tarjeta de recompensas estilo Player Card (#1e1c1a + #fffdf5) -->
      <div class="fa-player-card fa-m3-card">
        <div class="fa-card-window-bar">
          <span class="fa-card-window-title">
            <span class="fa-led-green" aria-hidden="true"></span>
            <span>PLAYER CARD · FIDELIAPP</span>
          </span>
          <span class="fa-card-hearts" aria-hidden="true">
            ${spritePixelHeart()}
            ${spritePixelHeart()}
            ${spritePixelHeart()}
          </span>
        </div>

        <div class="fa-card-body">
          <div class="fa-card-hud-top">
            <span class="fa-card-kicker">PROGRESO DE RECOMPENSA</span>
            <span class="fa-level-pill fa-m3-status-pill">LVL 04 · HABITUAL</span>
          </div>

          <div class="fa-card-points-row">
            <div class="fa-card-coin-icon">
              ${spriteFideliappCoin()}
            </div>
            <strong class="fa-card-points-val fa-m3-points-val">1.200 / 2.000</strong>
          </div>

          <!-- Etiqueta de hito ¡PREMIO DESBLOQUEADO! -->
          <div class="fa-m3-unlock-banner">
            ¡PREMIO DESBLOQUEADO!
          </div>

          <!-- Barra de progreso segmentada en 10 bloques pixelados -->
          <div class="fa-segmented-bar fa-m3-bar" aria-hidden="true">
            ${blocksHTML}
          </div>

          <div class="fa-bar-footer">
            <span class="fa-m3-bar-caption">META: 2.000 MONEDAS</span>
            <strong class="fa-m3-bar-pct">60%</strong>
          </div>

          <!-- Caja del premio (bloqueado -> desbloqueado con estrellas ✦) y botón CANJEAR -->
          <div class="fa-reward-slot fa-m3-reward-slot">
            <div class="fa-reward-icon-box fa-m3-icon-box">
              <div class="fa-m3-icon-locked">${spriteRewardLock()}</div>
              <div class="fa-m3-icon-unlocked">${spriteRewardTrophy()}</div>
              <span class="fa-pixel-sparkle fa-sp-tl fa-m3-star" aria-hidden="true">✦</span>
              <span class="fa-pixel-sparkle fa-sp-tr fa-m3-star" aria-hidden="true">✦</span>
              <span class="fa-pixel-sparkle fa-sp-br fa-m3-star" aria-hidden="true">★</span>
            </div>

            <div class="fa-reward-details">
              <span class="fa-reward-tag fa-m3-reward-tag">BLOQUEADO</span>
              <strong class="fa-reward-name">Combo Personal</strong>
            </div>

            <div class="fa-retro-btn fa-btn-disabled fa-m3-btn-redeem">
              <span>CANJEAR</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function createMoment3Timeline(
  rootEl,
  gsapInstance = window.gsap,
  timelineOptions = {}
) {
  const readingPause =
    typeof timelineOptions.scenePause === "number"
      ? Math.max(0.1, timelineOptions.scenePause)
      : MOMENT3_META.defaultPause;
  const endTime = Number((2.45 + readingPause).toFixed(2));

  const scope = rootEl.querySelector('.fa-moment[data-moment="3"]') || rootEl;
  const caption = scope.querySelector(".fa-scene-caption");
  const card = scope.querySelector(".fa-m3-card");
  const coinA = scope.querySelector(".fa-m3-coin-a");
  const coinB = scope.querySelector(".fa-m3-coin-b");
  const coinC = scope.querySelector(".fa-m3-coin-c");

  const bar = scope.querySelector(".fa-m3-bar");
  const stepBlocks = scope.querySelectorAll(".fa-prog-block.is-step");
  const pointsVal = scope.querySelector(".fa-m3-points-val");
  const barPct = scope.querySelector(".fa-m3-bar-pct");
  const statusPill = scope.querySelector(".fa-m3-status-pill");
  const unlockBanner = scope.querySelector(".fa-m3-unlock-banner");

  const iconBox = scope.querySelector(".fa-m3-icon-box");
  const iconLocked = scope.querySelector(".fa-m3-icon-locked");
  const iconUnlocked = scope.querySelector(".fa-m3-icon-unlocked");
  const stars = scope.querySelectorAll(".fa-m3-star");
  const rewardTag = scope.querySelector(".fa-m3-reward-tag");
  const btnRedeem = scope.querySelector(".fa-m3-btn-redeem");

  const tl = gsapInstance.timeline();

  tl.set(scope, { autoAlpha: 1 });
  tl.set(caption, { autoAlpha: 0, y: -10, scale: 0.94 });
  tl.set(card, { autoAlpha: 0, scale: 0.88, y: 24 });
  tl.set([coinA, coinB, coinC], { autoAlpha: 0, y: -120, scale: 1 });
  tl.set(coinA, { x: -56 });
  tl.set(coinB, { x: 0 });
  tl.set(coinC, { x: 56 });
  tl.set(stepBlocks, { autoAlpha: 0, scaleY: 0.3, transformOrigin: "50% 100%" });
  tl.set(bar, { borderColor: "#16262e", boxShadow: "none" });
  tl.set(unlockBanner, { autoAlpha: 0, y: 6, scale: 0.9 });
  tl.set(iconLocked, { autoAlpha: 1, scale: 1 });
  tl.set(iconUnlocked, { autoAlpha: 0, scale: 0.5 });
  tl.set(iconBox, { backgroundColor: "#dce7ec" });
  tl.set(stars, { autoAlpha: 0, scale: 0.5 });
  tl.set(btnRedeem, {
    backgroundColor: "#cbd5e1",
    color: "#64748b",
    boxShadow: "0 3px 0 #16262e",
    scale: 1,
  });

  tl.call(() => {
    if (pointsVal) pointsVal.textContent = "1.200 / 2.000";
    if (barPct) barPct.textContent = "60%";
    if (statusPill) {
      statusPill.textContent = "LVL 04 · EN PROGRESO";
      statusPill.style.backgroundColor = "#fad24b";
    }
    if (rewardTag) {
      rewardTag.textContent = "BLOQUEADO";
      rewardTag.style.color = "#55707d";
    }
  }, null, 0);

  // 1. Entrada del texto pixelado y despliegue de la tarjeta Player Card (0.00s -> 0.45s)
  tl.to(
    caption,
    { autoAlpha: 1, y: 0, scale: 1, duration: 0.24, ease: "steps(4)" },
    0.02
  );
  tl.to(
    card,
    { autoAlpha: 1, scale: 1, y: 0, duration: 0.38, ease: "steps(5)" },
    0.04
  );

  // 2. Las monedas de Fideliapp recién ganadas se absorben hacia la barra de progreso (0.45s -> 0.90s)
  tl.set([coinA, coinB, coinC], { autoAlpha: 1 }, 0.45);
  tl.to(
    [coinA, coinB, coinC],
    {
      x: 0,
      y: -6,
      scale: 0.55,
      duration: 0.4,
      stagger: 0.06,
      ease: "steps(4)",
    },
    0.46
  );
  tl.set([coinA, coinB, coinC], { autoAlpha: 0 }, 0.92);

  // 3. La barra se llena bloque por bloque del 60% al 100% con ritmo escalonado retro (0.90s -> 1.75s)
  const blockSteps = [
    { idx: 0, time: 0.92, pct: "70%", pts: "1.400 / 2.000" },
    { idx: 1, time: 1.12, pct: "80%", pts: "1.600 / 2.000" },
    { idx: 2, time: 1.32, pct: "90%", pts: "1.800 / 2.000" },
    { idx: 3, time: 1.52, pct: "100%", pts: "2.000 / 2.000" },
  ];

  blockSteps.forEach(({ idx, time, pct, pts }) => {
    const blockEl = stepBlocks[idx];
    if (blockEl) {
      tl.to(
        blockEl,
        { autoAlpha: 1, scaleY: 1, duration: 0.14, ease: "steps(2)" },
        time
      );
    }
    tl.call(() => {
      if (barPct) barPct.textContent = pct;
      if (pointsVal) pointsVal.textContent = pts;
    }, null, time + 0.08);
  });

  // 4. Pausa de hito (0.7 s: 1.75s -> 2.45s) al llegar al 100%
  tl.to(caption, { scale: 1.05, duration: 0.1, yoyo: true, repeat: 1, ease: "steps(1)" }, 1.75);
  tl.to(
    bar,
    {
      borderColor: "#155bc0",
      boxShadow: "0 0 0 3px #fad24b",
      duration: 0.14,
      repeat: 3,
      yoyo: true,
      ease: "steps(1)",
    },
    1.75
  );
  tl.to(
    unlockBanner,
    { autoAlpha: 1, y: 0, scale: 1, duration: 0.16, ease: "steps(3)" },
    1.76
  );
  tl.to(iconLocked, { autoAlpha: 0, scale: 0.5, duration: 0.1, ease: "steps(2)" }, 1.78);
  tl.to(
    iconUnlocked,
    { autoAlpha: 1, scale: 1, duration: 0.18, ease: "steps(3)" },
    1.84
  );
  tl.to(iconBox, { backgroundColor: "#fad24b", duration: 0.1, ease: "steps(1)" }, 1.84);

  tl.call(() => {
    if (statusPill) {
      statusPill.textContent = "¡100% COMPLETADO!";
      statusPill.style.backgroundColor = "#24d04a";
    }
    if (rewardTag) {
      rewardTag.textContent = "¡LISTO PARA CANJEAR!";
      rewardTag.style.color = "#155bc0";
    }
  }, null, 1.82);

  tl.to(
    btnRedeem,
    {
      backgroundColor: "#155bc0",
      color: "#ffffff",
      boxShadow: "0 4px 0 #16262e",
      scale: 1.06,
      duration: 0.14,
      ease: "steps(2)",
    },
    1.88
  );
  tl.to(btnRedeem, { scale: 1, duration: 0.12, ease: "steps(2)" }, 2.04);

  // 5. Resultado + Pausa de lectura configurable
  const rawRepeats = Math.max(0, Math.floor((readingPause - 0.3) / 0.2));
  const starRepeats = rawRepeats % 2 === 0 ? rawRepeats : rawRepeats - 1;
  tl.to(
    stars,
    {
      autoAlpha: 1,
      scale: 1.15,
      duration: Math.min(0.18, readingPause * 0.5),
      stagger: 0.04,
      repeat: Math.max(0, starRepeats),
      yoyo: true,
      ease: "steps(1)",
    },
    2.45
  );
  tl.set(scope, { autoAlpha: 1 }, endTime);

  return tl;
}

export function mountMoment3(containerEl, options = {}) {
  containerEl.innerHTML = `<div class="fa-stage fa-stage-single"><div class="fa-moments-viewport">${renderMoment3HTML()}</div></div>`;
  const gsapInstance = options.gsap || window.gsap;
  const tl = createMoment3Timeline(containerEl, gsapInstance, options);
  if (typeof options.speed === "number" && options.speed > 0) {
    tl.timeScale(options.speed);
  }
  if (options.loop !== false) {
    tl.repeat(-1);
  }
  return tl;
}
