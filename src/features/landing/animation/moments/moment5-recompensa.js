import {
  spriteFideliappCoin,
  spriteCoffeeAndCroissant,
  spriteCustomerHand,
  spriteStaffHand,
} from "../assets/pixel-sprites.js";

export const MOMENT5_META = {
  id: "moment-5-recompensa",
  number: 5,
  stageLabel: "PASO 05 · FIDELIZACIÓN",
  title: "Entrega de la recompensa y ciclo de fidelización",
  description: "PREMIA A TU CLIENTE Y HAZ QUE VUELVA",
  duration: 3.85,
  defaultPause: 1.5,
};

export function renderMoment5HTML() {
  return `
    <div class="fa-moment fa-moment-5" data-moment="5">
      <p class="fa-scene-caption">
        PREMIA A TU CLIENTE Y <span class="fa-txt-accent">HAZ QUE VUELVA</span>
      </p>

      <!-- Destello pixelado de transformación inicial -->
      <div class="fa-m5-transform-flash" aria-hidden="true"></div>

      <!-- Moneda gigante de Fideliapp que emerge detrás en el centro (protagonista del ciclo) -->
      <div class="fa-m5-giant-coin-stage">
        <div class="fa-m5-giant-coin fa-idle-bob">
          ${spriteFideliappCoin()}
        </div>
      </div>

      <!-- Estrellas y destellos de celebración ★ y ✦ -->
      <div class="fa-m5-celebration-stars" aria-hidden="true">
        <span class="fa-pixel-sparkle fa-m5-star fa-s1">★</span>
        <span class="fa-pixel-sparkle fa-m5-star fa-s2">✦</span>
        <span class="fa-pixel-sparkle fa-m5-star fa-s3">★</span>
        <span class="fa-pixel-sparkle fa-m5-star fa-s4">✦</span>
      </div>

      <!-- Producto/Alimento de recompensa con brillo de loot y entrega entre manos -->
      <div class="fa-m5-delivery-scene">
        <!-- Mano del cliente (izquierda, diseño referencias/hand.svg) recibiendo la recompensa -->
        <div class="fa-m5-hand-customer">
          ${spriteCustomerHand({ pose: "receive" })}
        </div>

        <!-- Tarjeta / Contenedor Loot del producto gratis -->
        <div class="fa-product-card fa-loot-card fa-m5-loot-card">
          <div class="fa-product-badge fa-badge-gold">★ PREMIO GRATIS ★</div>
          <div class="fa-product-art fa-idle-bob">
            ${spriteCoffeeAndCroissant()}
          </div>
          <div class="fa-product-meta">
            <span class="fa-product-title">Combo Personal</span>
            <strong class="fa-amount-pill fa-pill-emerald">¡ENTREGADO!</strong>
          </div>
        </div>

        <!-- Mano del encargado (derecha, diseño referencias/hand.svg) entregando el producto -->
        <div class="fa-m5-hand-staff">
          ${spriteStaffHand({ pose: "deliver" })}
        </div>
      </div>

      <!-- Indicador de bucle de fidelización -->
      <div class="fa-loop-banner fa-m5-loop-banner">
        <span>★ LVL UP · VUELVE PRONTO ★</span>
      </div>
    </div>
  `;
}

export function createMoment5Timeline(
  rootEl,
  gsapInstance = window.gsap,
  timelineOptions = {}
) {
  const readingPause =
    typeof timelineOptions.scenePause === "number"
      ? Math.max(0.1, timelineOptions.scenePause)
      : MOMENT5_META.defaultPause;
  const endTime = Number((2.35 + readingPause).toFixed(2));

  const scope = rootEl.querySelector('.fa-moment[data-moment="5"]') || rootEl;
  const caption = scope.querySelector(".fa-scene-caption");
  const flash = scope.querySelector(".fa-m5-transform-flash");
  const lootCard = scope.querySelector(".fa-m5-loot-card");
  const handStaff = scope.querySelector(".fa-m5-hand-staff");
  const handCustomer = scope.querySelector(".fa-m5-hand-customer");
  const stars = scope.querySelectorAll(".fa-m5-star");
  const giantCoinStage = scope.querySelector(".fa-m5-giant-coin-stage");
  const giantCoin = scope.querySelector(".fa-m5-giant-coin");
  const loopBanner = scope.querySelector(".fa-m5-loop-banner");

  const tl = gsapInstance.timeline();

  tl.set(scope, { autoAlpha: 1 });
  tl.set(caption, { autoAlpha: 0, y: -10, scale: 0.94 });
  tl.set(flash, { autoAlpha: 0, scale: 0.5 });
  tl.set(lootCard, { autoAlpha: 0, scale: 0.65, y: 14, x: 0 });
  tl.set(handStaff, { autoAlpha: 0, x: 80, y: 8 });
  tl.set(handCustomer, { autoAlpha: 0, x: -80, y: 8 });
  tl.set(stars, { autoAlpha: 0, scale: 0.4 });
  tl.set(giantCoinStage, { autoAlpha: 0, y: 40, scale: 0.6 });
  tl.set(giantCoin, { scaleX: 1 });
  tl.set(loopBanner, { autoAlpha: 0, y: 16, scale: 0.9 });

  // 1. Entrada del texto pixelado y transformación mediante destello en el producto de recompensa (0.00s -> 0.50s)
  tl.to(
    caption,
    { autoAlpha: 1, y: 0, scale: 1, duration: 0.24, ease: "steps(4)" },
    0.02
  );
  tl.to(flash, { autoAlpha: 1, scale: 1.25, duration: 0.09, ease: "steps(2)" }, 0.02);
  tl.to(flash, { autoAlpha: 0, scale: 1.5, duration: 0.14, ease: "steps(2)" }, 0.11);
  tl.to(
    lootCard,
    { autoAlpha: 1, scale: 1, y: 0, duration: 0.34, ease: "steps(4)" },
    0.1
  );

  // 2. La mano del encargado entrega el producto a la mano del cliente (0.50s -> 1.05s)
  tl.to(
    handStaff,
    { autoAlpha: 1, x: 14, y: 0, duration: 0.28, ease: "steps(4)" },
    0.5
  );
  tl.to(
    handCustomer,
    { autoAlpha: 1, x: -14, y: 0, duration: 0.28, ease: "steps(4)" },
    0.62
  );
  tl.to(lootCard, { x: -6, duration: 0.12, ease: "steps(2)" }, 0.88);
  tl.to(lootCard, { x: 0, duration: 0.12, ease: "steps(2)" }, 1.0);

  // Pausa de celebración (0.8 s: 1.05s -> 1.85s) con destellos ★ y ✦
  tl.to(
    stars,
    {
      autoAlpha: 1,
      scale: 1.2,
      duration: 0.18,
      stagger: 0.05,
      repeat: 3,
      yoyo: true,
      ease: "steps(1)",
    },
    1.05
  );

  // 3. Detrás del producto emerge la moneda principal de Fideliapp girando en 8-bits (1.85s -> 2.35s)
  tl.to(
    [handStaff, handCustomer],
    { autoAlpha: 0, duration: 0.2, ease: "steps(3)" },
    1.85
  );
  tl.to(
    lootCard,
    { y: 42, scale: 0.88, duration: 0.28, ease: "steps(4)" },
    1.88
  );
  tl.to(
    giantCoinStage,
    { autoAlpha: 1, y: -44, scale: 1, duration: 0.32, ease: "steps(4)" },
    1.9
  );
  tl.to(
    giantCoin,
    {
      scaleX: 0.24,
      duration: 0.14,
      repeat: 5,
      yoyo: true,
      ease: "steps(1)",
    },
    1.95
  );
  tl.to(
    loopBanner,
    { autoAlpha: 1, y: 0, scale: 1, duration: 0.22, ease: "steps(3)" },
    2.12
  );
  tl.to(caption, { scale: 1.05, duration: 0.1, yoyo: true, repeat: 1, ease: "steps(1)" }, 2.12);

  // 4. Pausa final configurable: Moneda de Fideliapp centrada junto al producto
  const rawRepeats = Math.max(0, Math.floor((readingPause - 0.25) / 0.25));
  const starRepeats = rawRepeats % 2 === 0 ? rawRepeats : rawRepeats - 1;
  tl.to(
    stars,
    {
      autoAlpha: 1,
      scale: 1.1,
      duration: Math.min(0.22, readingPause * 0.5),
      repeat: Math.max(0, starRepeats),
      yoyo: true,
      ease: "steps(1)",
    },
    2.35
  );
  tl.set(scope, { autoAlpha: 1 }, endTime);

  return tl;
}

export function mountMoment5(containerEl, options = {}) {
  containerEl.innerHTML = `<div class="fa-stage fa-stage-single"><div class="fa-moments-viewport">${renderMoment5HTML()}</div></div>`;
  const gsapInstance = options.gsap || window.gsap;
  const tl = createMoment5Timeline(containerEl, gsapInstance, options);
  if (typeof options.speed === "number" && options.speed > 0) {
    tl.timeScale(options.speed);
  }
  if (options.loop !== false) {
    tl.repeat(-1);
  }
  return tl;
}
