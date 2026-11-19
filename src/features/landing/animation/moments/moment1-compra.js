import {
  spriteCoffeeAndCroissant,
  spritePixelBill,
  spriteCustomerHand,
  spriteStaffHand,
  spritePixelQr,
  spritePixelCheck,
  spriteDeviceStatusIcons,
} from "../assets/pixel-sprites.js";

export const MOMENT1_META = {
  id: "moment-1-compra",
  number: 1,
  stageLabel: "PASO 01 · VENTA",
  title: "Compra y generación del QR",
  description: "COBRA LA VENTA Y GENERA EL QR",
  duration: 3.6,
  defaultPause: 1.2,
};

export function renderMoment1HTML() {
  return `
    <div class="fa-moment fa-moment-1" data-moment="1">
      <p class="fa-scene-caption">
        COBRA LA VENTA Y <span class="fa-txt-accent">GENERA EL QR</span>
      </p>

      <!-- Fase A: Producto + Indicador de importe ($15.000) + Pago del cliente -->
      <div class="fa-m1-purchase-group">
        <div class="fa-product-card">
          <div class="fa-product-badge">ORDEN #01</div>
          <div class="fa-product-art fa-idle-bob">
            ${spriteCoffeeAndCroissant()}
          </div>
          <div class="fa-product-meta">
            <span class="fa-product-title">Combo Personal</span>
            <strong class="fa-amount-pill">$15.000</strong>
          </div>
        </div>

        <!-- Mano del cliente (diseño referencias/hand.svg) entregando billete pixelart -->
        <div class="fa-m1-customer-pay">
          <div class="fa-m1-hand-customer">
            ${spriteCustomerHand({ pose: "pay" })}
          </div>
          <div class="fa-m1-bill">
            ${spritePixelBill()}
          </div>
        </div>

        <!-- Destello pixelado + Indicador PAGO OK (pausa 0.6 s) -->
        <div class="fa-m1-flash" aria-hidden="true"></div>
        <div class="fa-toast-badge fa-toast-emerald fa-m1-pago-ok">
          <span class="fa-toast-icon">${spritePixelCheck()}</span>
          <span>PAGO OK</span>
        </div>
      </div>

      <!-- Fase B: Tablet POS del encargado + Mano del encargado + Botón GENERAR QR + QR por bloques -->
      <div class="fa-m1-staff-phone-wrap">
        <div class="fa-device-tablet fa-m1-phone">
          <div class="fa-tablet-side-btns" aria-hidden="true"></div>
          <div class="fa-tablet-top-bezel" aria-hidden="true">
            <span class="fa-bezel-cam"></span>
            <span class="fa-bezel-speaker"></span>
            <span class="fa-bezel-sensor"></span>
          </div>

          <div class="fa-phone-header fa-header-blue">
            <span class="fa-header-left">
              <span class="fa-led-green" aria-hidden="true"></span>
              <span>TABLET POS · CAJA</span>
            </span>
            ${spriteDeviceStatusIcons()}
          </div>

          <div class="fa-phone-screen">
            <div class="fa-screen-row">
              <span class="fa-screen-lbl">IMPORTE VENTA</span>
              <strong class="fa-screen-amount">$15.000</strong>
            </div>

            <!-- Visor central donde se construye el QR bloque a bloque -->
            <div class="fa-qr-stage fa-m1-qr-stage">
              <div class="fa-qr-placeholder">TERMINAL LISTA</div>
              <div class="fa-qr-arcade-frame fa-m1-qr-frame">
                ${spritePixelQr()}
              </div>
              <div class="fa-qr-ready-tag fa-m1-qr-ready">► ESCANEAR QR ◄</div>
            </div>

            <!-- Botón retro táctil GENERAR QR -->
            <div class="fa-retro-btn fa-btn-blue fa-m1-btn-generate">
              <span>GENERAR QR</span>
            </div>
          </div>

          <div class="fa-tablet-bottom-bezel" aria-hidden="true">
            <span class="fa-tablet-home-btn"></span>
          </div>
          <div class="fa-tablet-dock" aria-hidden="true"></div>
        </div>

        <!-- Mano del encargado (diseño referencias/hand.svg) presionando GENERAR QR -->
        <div class="fa-m1-hand-staff">
          ${spriteStaffHand({ pose: "point" })}
        </div>
      </div>
    </div>
  `;
}

export function createMoment1Timeline(
  rootEl,
  gsapInstance = window.gsap,
  timelineOptions = {}
) {
  const readingPause =
    typeof timelineOptions.scenePause === "number"
      ? Math.max(0.1, timelineOptions.scenePause)
      : MOMENT1_META.defaultPause;
  const endTime = Number((2.4 + readingPause).toFixed(2));

  const scope = rootEl.querySelector('.fa-moment[data-moment="1"]') || rootEl;
  const caption = scope.querySelector(".fa-scene-caption");
  const purchaseGroup = scope.querySelector(".fa-m1-purchase-group");
  const productCard = scope.querySelector(".fa-product-card");
  const customerPay = scope.querySelector(".fa-m1-customer-pay");
  const bill = scope.querySelector(".fa-m1-bill");
  const flash = scope.querySelector(".fa-m1-flash");
  const pagoOk = scope.querySelector(".fa-m1-pago-ok");
  const steams = scope.querySelectorAll(".fa-steam");

  const staffPhoneWrap = scope.querySelector(".fa-m1-staff-phone-wrap");
  const staffPhone = scope.querySelector(".fa-m1-phone");
  const staffHand = scope.querySelector(".fa-m1-hand-staff");
  const btnGenerate = scope.querySelector(".fa-m1-btn-generate");
  const qrPlaceholder = scope.querySelector(".fa-qr-placeholder");
  const qrFrame = scope.querySelector(".fa-m1-qr-frame");
  const qrBlocks = scope.querySelectorAll(".fa-qr-block");
  const qrReadyTag = scope.querySelector(".fa-m1-qr-ready");

  const tl = gsapInstance.timeline();

  // Estado inicial limpio
  tl.set(scope, { autoAlpha: 1 });
  tl.set(caption, { autoAlpha: 0, y: -10, scale: 0.94 });
  tl.set(purchaseGroup, { autoAlpha: 1, x: 0, y: 0, scale: 1 });
  tl.set(productCard, { autoAlpha: 0, scale: 0.85, y: 12 });
  tl.set(customerPay, { autoAlpha: 0, x: -72, y: 8 });
  tl.set(bill, { x: 0, y: 0, scale: 1 });
  tl.set(flash, { autoAlpha: 0, scale: 0.6 });
  tl.set(pagoOk, { autoAlpha: 0, y: 12, scale: 0.85 });

  tl.set(staffPhoneWrap, { autoAlpha: 0, y: 70, scale: 0.92 });
  tl.set(staffPhone, { x: 0, y: 0 });
  tl.set(staffHand, { autoAlpha: 0, x: 48, y: 48 });
  tl.set(btnGenerate, { y: 0, boxShadow: "0 4px 0 #1e1c1a" });
  tl.set(qrPlaceholder, { autoAlpha: 1 });
  tl.set(qrFrame, { autoAlpha: 0, borderColor: "#1e1c1a" });
  tl.set(qrBlocks, { autoAlpha: 0, scale: 0.6, transformOrigin: "50% 50%" });
  tl.set(qrReadyTag, { autoAlpha: 0 });

  // 1. Aparece el texto pixelado de la escena, el producto ($15.000) y la mano del cliente realiza el pago (0.00s - 0.65s)
  tl.to(
    caption,
    { autoAlpha: 1, y: 0, scale: 1, duration: 0.24, ease: "steps(4)" },
    0.02
  );
  tl.to(
    productCard,
    { autoAlpha: 1, scale: 1, y: 0, duration: 0.28, ease: "steps(4)" },
    0.02
  );
  tl.fromTo(
    steams,
    { y: 0 },
    { y: -2, duration: 0.4, stagger: 0.08, ease: "steps(2)" },
    0.1
  );
  tl.to(
    customerPay,
    { autoAlpha: 1, x: 0, y: 0, duration: 0.34, ease: "steps(5)" },
    0.22
  );
  tl.to(bill, { x: 14, y: -6, duration: 0.16, ease: "steps(3)" }, 0.48);

  // 2. Pausa corta (0.6 s: 0.65s -> 1.25s) con destello pixelado e indicador PAGO OK
  tl.to(
    flash,
    { autoAlpha: 1, scale: 1.15, duration: 0.08, ease: "steps(2)" },
    0.65
  );
  tl.to(
    flash,
    { autoAlpha: 0, scale: 1.35, duration: 0.12, ease: "steps(2)" },
    0.73
  );
  tl.to(
    pagoOk,
    { autoAlpha: 1, y: 0, scale: 1, duration: 0.14, ease: "steps(3)" },
    0.66
  );
  tl.to(
    purchaseGroup,
    { autoAlpha: 0, y: -24, scale: 0.9, duration: 0.2, ease: "steps(3)" },
    1.25
  );

  // 3. Entra la Tablet POS del negocio y la mano del encargado presiona GENERAR QR (1.25s -> 1.85s)
  tl.to(
    staffPhoneWrap,
    { autoAlpha: 1, y: 0, scale: 1, duration: 0.28, ease: "steps(4)" },
    1.28
  );
  tl.to(
    staffHand,
    { autoAlpha: 1, x: 0, y: 0, duration: 0.22, ease: "steps(4)" },
    1.46
  );
  tl.to(staffHand, { y: 4, duration: 0.07, ease: "steps(1)" }, 1.68);
  tl.to(
    btnGenerate,
    {
      y: 4,
      boxShadow: "0 0px 0 #1e1c1a",
      backgroundColor: "#b83726",
      duration: 0.07,
      ease: "steps(1)",
    },
    1.68
  );
  tl.to(
    btnGenerate,
    {
      y: 0,
      boxShadow: "0 4px 0 #1e1c1a",
      backgroundColor: "#e6533f",
      duration: 0.08,
      ease: "steps(1)",
    },
    1.78
  );
  tl.to(
    staffHand,
    { autoAlpha: 0, x: 36, y: 32, duration: 0.18, ease: "steps(3)" },
    1.84
  );

  // 4. Construcción bloque a bloque del código QR grande y nítido (1.85s -> 2.40s)
  tl.to(caption, { scale: 1.05, duration: 0.1, yoyo: true, repeat: 1, ease: "steps(1)" }, 1.85);
  tl.set(qrPlaceholder, { autoAlpha: 0 }, 1.85);
  tl.set(qrFrame, { autoAlpha: 1 }, 1.85);
  tl.to(
    qrBlocks,
    {
      autoAlpha: 1,
      scale: 1,
      duration: 0.06,
      stagger: 0.06,
      ease: "steps(1)",
    },
    1.86
  );

  // 5. Resultado fijo en el centro con marco arcade parpadeante (Pausa de lectura configurable)
  tl.set(qrReadyTag, { autoAlpha: 1 }, 2.4);
  const rawRepeats = Math.max(0, Math.floor((readingPause - 0.2) / 0.2));
  const blinkRepeats = rawRepeats % 2 === 0 ? rawRepeats : rawRepeats - 1;
  tl.to(
    qrFrame,
    {
      borderColor: "#e6533f",
      boxShadow: "0 0 0 3px #ffd166, 4px 4px 0 #1e1c1a",
      duration: Math.min(0.2, readingPause),
      repeat: Math.max(0, blinkRepeats),
      yoyo: true,
      ease: "steps(1)",
    },
    2.4
  );
  tl.set(scope, { autoAlpha: 1 }, endTime);

  return tl;
}

export function mountMoment1(containerEl, options = {}) {
  containerEl.innerHTML = `<div class="fa-stage fa-stage-single"><div class="fa-moments-viewport">${renderMoment1HTML()}</div></div>`;
  const gsapInstance = options.gsap || window.gsap;
  const tl = createMoment1Timeline(containerEl, gsapInstance, options);
  if (typeof options.speed === "number" && options.speed > 0) {
    tl.timeScale(options.speed);
  }
  if (options.loop !== false) {
    tl.repeat(-1);
  }
  return tl;
}
