import {
  spriteFideliappCoin,
  spriteCustomerHand,
  spritePixelQr,
  spriteDeviceStatusIcons,
} from "../assets/pixel-sprites.js";

export const MOMENT2_META = {
  id: "moment-2-escaneo",
  number: 2,
  stageLabel: "PASO 02 · ESCANEO QR",
  title: "Escaneo del QR y reclamo de monedas",
  description: "TU CLIENTE ESCANEA Y SUMA MONEDAS",
  duration: 3.6,
  defaultPause: 1.2,
};

export function renderMoment2HTML() {
  return `
    <div class="fa-moment fa-moment-2" data-moment="2">
      <p class="fa-scene-caption">
        TU CLIENTE ESCANEA Y <span class="fa-txt-accent">SUMA MONEDAS</span>
      </p>

      <!-- Tablet POS del encargado con el QR (izquierda/fondo) -->
      <div class="fa-m2-staff-unit">
        <div class="fa-device-tablet fa-tablet-compact">
          <div class="fa-tablet-side-btns" aria-hidden="true"></div>
          <div class="fa-tablet-top-bezel" aria-hidden="true">
            <span class="fa-bezel-cam"></span>
            <span class="fa-bezel-speaker"></span>
          </div>
          <div class="fa-phone-header fa-header-blue">
            <span class="fa-header-left">
              <span class="fa-led-green" aria-hidden="true"></span>
              <span>POS · QR VENTA</span>
            </span>
          </div>
          <div class="fa-phone-screen">
            <div class="fa-qr-stage fa-m2-qr-box">
              <div class="fa-qr-arcade-frame">
                ${spritePixelQr()}
              </div>
              <!-- Línea láser roja (#e6533f) de escaneo pixelart -->
              <div class="fa-laser-line fa-m2-laser" aria-hidden="true"></div>
              <!-- Flash retro de confirmación de lectura (0.5 s) -->
              <div class="fa-qr-detect-flash fa-m2-qr-flash" aria-hidden="true"></div>
            </div>
            <div class="fa-qr-ready-tag">CÓDIGO DETECTADO</div>
          </div>
          <div class="fa-tablet-bottom-bezel" aria-hidden="true">
            <span class="fa-tablet-home-btn"></span>
          </div>
          <div class="fa-tablet-dock" aria-hidden="true"></div>
        </div>
      </div>

      <!-- 3 Monedas de Fideliapp protagonistas que saltan en parábola (coin jump) -->
      <div class="fa-m2-coins-flight" aria-hidden="true">
        <div class="fa-flying-coin fa-m2-coin-1">${spriteFideliappCoin()}</div>
        <div class="fa-flying-coin fa-m2-coin-2">${spriteFideliappCoin()}</div>
        <div class="fa-flying-coin fa-m2-coin-3">${spriteFideliappCoin()}</div>
      </div>

      <!-- Smartphone detallado del cliente sostenido por la mano del cliente -->
      <div class="fa-m2-customer-unit">
        <div class="fa-m2-hand-customer">
          ${spriteCustomerHand({ pose: "pay" })}
        </div>

        <div class="fa-device-phone fa-m2-customer-phone">
          <div class="fa-phone-side-btns" aria-hidden="true"></div>
          <div class="fa-phone-top-bezel" aria-hidden="true">
            <span class="fa-bezel-cam"></span>
            <span class="fa-bezel-earpiece"></span>
          </div>
          <div class="fa-phone-header fa-header-ink">
            <span class="fa-header-left">
              <span class="fa-led-red" aria-hidden="true"></span>
              <span>MÓVIL · CLIENTE</span>
            </span>
            ${spriteDeviceStatusIcons()}
          </div>
          <div class="fa-phone-screen fa-m2-customer-screen">
            <div class="fa-screen-kicker">COMBO PERSONAL</div>

            <!-- Moneda gigante protagonista brillando en la pantalla del cliente -->
            <div class="fa-m2-hero-coin-box">
              <span class="fa-pixel-sparkle fa-sp-tl" aria-hidden="true">✦</span>
              <span class="fa-pixel-sparkle fa-sp-tr" aria-hidden="true">★</span>
              <div class="fa-m2-hero-coin fa-idle-bob">
                ${spriteFideliappCoin()}
              </div>
              <span class="fa-pixel-sparkle fa-sp-br" aria-hidden="true">✦</span>
            </div>

            <!-- Contador de saldo del cliente que se actualiza al recibir las monedas -->
            <div class="fa-m2-balance-panel">
              <span class="fa-balance-label">SALDO ACTUALIZADO</span>
              <strong class="fa-balance-value fa-m2-balance-num">1.850 MONEDAS</strong>
            </div>
          </div>
          <div class="fa-phone-bottom-bezel" aria-hidden="true">
            <span class="fa-phone-home-bar"></span>
          </div>
        </div>

        <!-- Indicador flotante tipo arcade (+150 MONEDAS) -->
        <div class="fa-floating-arcade-text fa-m2-plus-toast">
          +150 MONEDAS
        </div>
      </div>
    </div>
  `;
}

export function createMoment2Timeline(
  rootEl,
  gsapInstance = window.gsap,
  timelineOptions = {}
) {
  const readingPause =
    typeof timelineOptions.scenePause === "number"
      ? Math.max(0.1, timelineOptions.scenePause)
      : MOMENT2_META.defaultPause;
  const endTime = Number((2.4 + readingPause).toFixed(2));

  const scope = rootEl.querySelector('.fa-moment[data-moment="2"]') || rootEl;
  const caption = scope.querySelector(".fa-scene-caption");
  const staffUnit = scope.querySelector(".fa-m2-staff-unit");
  const customerUnit = scope.querySelector(".fa-m2-customer-unit");
  const customerPhone = scope.querySelector(".fa-m2-customer-phone");
  const customerHand = scope.querySelector(".fa-m2-hand-customer");
  const laser = scope.querySelector(".fa-m2-laser");
  const qrFlash = scope.querySelector(".fa-m2-qr-flash");

  const coin1 = scope.querySelector(".fa-m2-coin-1");
  const coin2 = scope.querySelector(".fa-m2-coin-2");
  const coin3 = scope.querySelector(".fa-m2-coin-3");
  const heroCoin = scope.querySelector(".fa-m2-hero-coin");
  const sparkles = scope.querySelectorAll(".fa-m2-hero-coin-box .fa-pixel-sparkle");
  const balanceNum = scope.querySelector(".fa-m2-balance-num");
  const plusToast = scope.querySelector(".fa-m2-plus-toast");

  const tl = gsapInstance.timeline();

  tl.set(scope, { autoAlpha: 1 });
  tl.set(caption, { autoAlpha: 0, y: -10, scale: 0.94 });
  tl.set(staffUnit, { autoAlpha: 1, x: -78, y: -12, scale: 0.92 });
  tl.set(customerUnit, { autoAlpha: 0, x: 145, y: 40, scale: 0.92 });
  tl.set(customerPhone, { x: 0, y: 0 });
  tl.set(customerHand, { autoAlpha: 1, x: 0, y: 0 });
  tl.set(laser, { autoAlpha: 0, y: 0 });
  tl.set(qrFlash, { autoAlpha: 0 });
  tl.set([coin1, coin2, coin3], { autoAlpha: 0, x: -75, y: -18, scale: 0.85, scaleX: 1 });
  tl.set(heroCoin, { scale: 0.82, scaleX: 1 });
  tl.set(sparkles, { autoAlpha: 0, scale: 0.5 });
  tl.set(plusToast, { autoAlpha: 0, y: 16 });
  tl.call(() => {
    if (balanceNum) balanceNum.textContent = "1.850 MONEDAS";
  }, null, 0);

  // 1. Entrada del texto pixelado y mano del cliente acercando su teléfono frente al QR (0.00s -> 0.55s)
  tl.to(
    caption,
    { autoAlpha: 1, y: 0, scale: 1, duration: 0.24, ease: "steps(4)" },
    0.02
  );
  tl.to(
    customerUnit,
    { autoAlpha: 1, x: 74, y: 12, scale: 0.95, duration: 0.48, ease: "steps(6)" },
    0.04
  );

  // 2. Línea láser roja (#e6533f) recorre el QR de arriba abajo (0.55s -> 1.05s)
  tl.set(laser, { autoAlpha: 1, y: 0 }, 0.55);
  tl.to(laser, { y: 112, duration: 0.48, ease: "steps(8)" }, 0.56);

  // Pausa de confirmación (0.5 s: 1.05s -> 1.55s) con flash retro al detectar el código
  tl.to(
    qrFlash,
    { autoAlpha: 0.9, duration: 0.08, yoyo: true, repeat: 3, ease: "steps(1)" },
    1.05
  );
  tl.set(laser, { autoAlpha: 0 }, 1.48);

  // 3. Del código QR saltan 3 monedas de Fideliapp con arco parabólico (coin jump)
  const coins = [
    { el: coin1, start: 1.55, saldo: "1.900 MONEDAS" },
    { el: coin2, start: 1.73, saldo: "1.950 MONEDAS" },
    { el: coin3, start: 1.91, saldo: "2.000 MONEDAS" },
  ];

  coins.forEach(({ el, start, saldo }) => {
    tl.set(el, { autoAlpha: 1, x: -78, y: -15, scale: 0.9, scaleX: 1 }, start);
    tl.to(el, { x: 74, duration: 0.36, ease: "steps(6)" }, start);
    tl.to(el, { y: -92, scale: 1.15, duration: 0.18, ease: "steps(3)" }, start);
    tl.to(el, { y: 6, scale: 0.95, duration: 0.18, ease: "steps(3)" }, start + 0.18);
    tl.to(
      el,
      { scaleX: 0.25, duration: 0.09, yoyo: true, repeat: 3, ease: "steps(1)" },
      start
    );
    tl.set(el, { autoAlpha: 0 }, start + 0.36);

    const hitTime = start + 0.36;
    tl.to(customerPhone, { x: 2, y: -2, duration: 0.03, ease: "steps(1)" }, hitTime);
    tl.to(customerPhone, { x: -2, y: 2, duration: 0.03, ease: "steps(1)" }, hitTime + 0.03);
    tl.to(customerPhone, { x: 0, y: 0, duration: 0.03, ease: "steps(1)" }, hitTime + 0.06);
    tl.call(() => {
      if (balanceNum) balanceNum.textContent = saldo;
    }, null, hitTime);
  });

  // Texto flotante +150 MONEDAS que sube por pasos (steps(4))
  tl.to(caption, { scale: 1.05, duration: 0.1, yoyo: true, repeat: 1, ease: "steps(1)" }, 1.88);
  tl.set(plusToast, { autoAlpha: 1, y: 14 }, 1.88);
  tl.to(plusToast, { y: -22, duration: 0.42, ease: "steps(4)" }, 1.9);

  // 5. Resultado: Smartphone del cliente en primer plano con gran moneda brillando (Pausa configurable)
  tl.to(
    staffUnit,
    { autoAlpha: 0, x: -130, scale: 0.82, duration: 0.24, ease: "steps(4)" },
    2.32
  );
  tl.to(
    customerHand,
    { autoAlpha: 0, x: -30, duration: 0.2, ease: "steps(3)" },
    2.32
  );
  tl.to(
    customerUnit,
    { x: 0, y: 0, scale: 1.02, duration: 0.26, ease: "steps(4)" },
    2.34
  );
  tl.to(heroCoin, { scale: 1.14, duration: 0.2, ease: "steps(3)" }, 2.4);
  const rawRepeats = Math.max(0, Math.floor((readingPause - 0.35) / 0.2));
  const sparkleRepeats = rawRepeats % 2 === 0 ? rawRepeats : rawRepeats - 1;
  tl.to(
    sparkles,
    {
      autoAlpha: 1,
      scale: 1.1,
      duration: Math.min(0.18, readingPause * 0.5),
      stagger: 0.04,
      repeat: Math.max(0, sparkleRepeats),
      yoyo: true,
      ease: "steps(1)",
    },
    2.42
  );
  tl.set(scope, { autoAlpha: 1 }, endTime);

  return tl;
}

export function mountMoment2(containerEl, options = {}) {
  containerEl.innerHTML = `<div class="fa-stage fa-stage-single"><div class="fa-moments-viewport">${renderMoment2HTML()}</div></div>`;
  const gsapInstance = options.gsap || window.gsap;
  const tl = createMoment2Timeline(containerEl, gsapInstance, options);
  if (typeof options.speed === "number" && options.speed > 0) {
    tl.timeScale(options.speed);
  }
  if (options.loop !== false) {
    tl.repeat(-1);
  }
  return tl;
}
