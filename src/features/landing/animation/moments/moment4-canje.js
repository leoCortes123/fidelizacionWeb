import {
  spriteFideliappCoin,
  spriteCustomerHand,
  spriteStaffHand,
  spriteRewardTrophy,
  spritePixelQr,
  spritePixelHeart,
  spritePixelCheck,
  spriteDeviceStatusIcons,
} from "../assets/pixel-sprites.js";

export const MOMENT4_META = {
  id: "moment-4-canje",
  number: 4,
  stageLabel: "PASO 04 · VALIDACIÓN",
  title: "Solicitud y validación del canje",
  description: "APRUEBA EL CANJE DESDE TU CAJA",
  duration: 3.7,
  defaultPause: 1.0,
};

export function renderMoment4HTML() {
  return `
    <div class="fa-moment fa-moment-4" data-moment="4">
      <p class="fa-scene-caption">
        APRUEBA EL CANJE <span class="fa-txt-accent">DESDE TU CAJA</span>
      </p>

      <!-- Monedas que salen del contador con animación de gasto (-2.000) -->
      <div class="fa-m4-spent-coins" aria-hidden="true">
        <div class="fa-flying-coin fa-m4-coin-1">${spriteFideliappCoin()}</div>
        <div class="fa-flying-coin fa-m4-coin-2">${spriteFideliappCoin()}</div>
        <div class="fa-flying-coin fa-m4-coin-3">${spriteFideliappCoin()}</div>
      </div>

      <!-- Tarjeta Player Card que se convierte en Ticket / QR de Canje -->
      <div class="fa-player-card fa-m4-card">
        <div class="fa-card-window-bar">
          <span class="fa-card-window-title">
            <span class="fa-led-green" aria-hidden="true"></span>
            <span class="fa-m4-window-title">PLAYER CARD · CANJE</span>
          </span>
          <span class="fa-card-hearts" aria-hidden="true">
            ${spritePixelHeart()}
            ${spritePixelHeart()}
            ${spritePixelHeart()}
          </span>
        </div>

        <div class="fa-card-body">
          <!-- Contador de monedas donde se descuentan (2.000 -> 0 MONEDAS) -->
          <div class="fa-card-points-row fa-m4-counter-row">
            <div class="fa-card-coin-icon">
              ${spriteFideliappCoin()}
            </div>
            <strong class="fa-card-points-val fa-m4-points-val">2.000 MONEDAS</strong>
            <span class="fa-m4-spend-tag">-2.000</span>
          </div>

          <!-- Vista 1: Premio desbloqueado con botón CANJEAR -->
          <div class="fa-m4-view-request">
            <div class="fa-reward-slot">
              <div class="fa-reward-icon-box fa-m4-coin-badge">
                ${spriteRewardTrophy()}
              </div>
              <div class="fa-reward-details">
                <span class="fa-reward-tag">PREMIO LISTO</span>
                <strong class="fa-reward-name">Combo Personal</strong>
              </div>
            </div>

            <div class="fa-m4-redeem-cta-wrap">
              <div class="fa-retro-btn fa-btn-red fa-m4-btn-redeem">
                <span>CANJEAR</span>
              </div>
            </div>
          </div>

          <!-- Vista 2: Ticket / Código QR de canje + Tablet POS del encargado con botón APROBAR -->
          <div class="fa-m4-view-ticket">
            <div class="fa-ticket-qr-row">
              <div class="fa-ticket-qr-box">
                ${spritePixelQr()}
              </div>
              <div class="fa-ticket-info">
                <span class="fa-ticket-code">TICKET #FD-204</span>
                <strong class="fa-ticket-prize">Combo Personal</strong>
                <span class="fa-ticket-cost">2.000 MONEDAS CANJEADAS</span>
              </div>
            </div>

            <!-- Mini terminal / Tablet POS del encargado para validar -->
            <div class="fa-pos-mini-terminal">
              <div class="fa-pos-mini-bar">
                <span class="fa-header-left">
                  <span class="fa-led-green" aria-hidden="true"></span>
                  <span>TABLET POS · ENCARGADO</span>
                </span>
                ${spriteDeviceStatusIcons()}
              </div>
              <div class="fa-m4-approve-bar">
                <span class="fa-staff-device-tag">SOLICITUD RECIBIDA</span>
                <div class="fa-retro-btn fa-btn-emerald fa-m4-btn-approve">
                  <span>APROBAR</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Sello retro CANJE APROBADO con check pixelado -->
        <div class="fa-retro-stamp fa-m4-stamp">
          <span class="fa-stamp-check">${spritePixelCheck()}</span>
          <span>CANJE APROBADO</span>
        </div>
      </div>

      <!-- Mano del cliente (referencias/hand.svg) presionando CANJEAR -->
      <div class="fa-m4-hand-customer">
        ${spriteCustomerHand({ pose: "point" })}
      </div>

      <!-- Mano del encargado (referencias/hand.svg) presionando APROBAR -->
      <div class="fa-m4-hand-staff">
        ${spriteStaffHand({ pose: "point" })}
      </div>
    </div>
  `;
}

export function createMoment4Timeline(
  rootEl,
  gsapInstance = window.gsap,
  timelineOptions = {}
) {
  const readingPause =
    typeof timelineOptions.scenePause === "number"
      ? Math.max(0.1, timelineOptions.scenePause)
      : MOMENT4_META.defaultPause;
  const endTime = Number((2.7 + readingPause).toFixed(2));

  const scope = rootEl.querySelector('.fa-moment[data-moment="4"]') || rootEl;
  const caption = scope.querySelector(".fa-scene-caption");
  const card = scope.querySelector(".fa-m4-card");
  const winTitle = scope.querySelector(".fa-m4-window-title");
  const pointsVal = scope.querySelector(".fa-m4-points-val");
  const spendTag = scope.querySelector(".fa-m4-spend-tag");

  const viewRequest = scope.querySelector(".fa-m4-view-request");
  const btnRedeem = scope.querySelector(".fa-m4-btn-redeem");
  const viewTicket = scope.querySelector(".fa-m4-view-ticket");
  const btnApprove = scope.querySelector(".fa-m4-btn-approve");
  const stamp = scope.querySelector(".fa-m4-stamp");

  const handCustomer = scope.querySelector(".fa-m4-hand-customer");
  const handStaff = scope.querySelector(".fa-m4-hand-staff");
  const coin1 = scope.querySelector(".fa-m4-coin-1");
  const coin2 = scope.querySelector(".fa-m4-coin-2");
  const coin3 = scope.querySelector(".fa-m4-coin-3");

  const tl = gsapInstance.timeline();

  tl.set(scope, { autoAlpha: 1 });
  tl.set(caption, { autoAlpha: 0, y: -10, scale: 0.94 });
  tl.set(card, { autoAlpha: 1, x: 0, y: 0, scale: 1 });
  tl.set(viewRequest, { autoAlpha: 1, display: "block" });
  tl.set(viewTicket, { autoAlpha: 0, display: "none" });
  tl.set(btnRedeem, { y: 0, boxShadow: "0 4px 0 #1e1c1a", backgroundColor: "#e6533f" });
  tl.set(btnApprove, { y: 0, boxShadow: "0 4px 0 #1e1c1a", backgroundColor: "#34d399" });
  tl.set(spendTag, { autoAlpha: 0, y: 8 });
  tl.set(stamp, { autoAlpha: 0, scale: 1.9, rotation: -6 });
  tl.set(handCustomer, { autoAlpha: 0, x: -35, y: 48 });
  tl.set(handStaff, { autoAlpha: 0, x: 48, y: 48 });
  tl.set([coin1, coin2, coin3], { autoAlpha: 0, x: 0, y: -40, scale: 0.9 });

  tl.call(() => {
    if (pointsVal) pointsVal.textContent = "2.000 MONEDAS";
    if (winTitle) winTitle.textContent = "PLAYER CARD · CANJE";
  }, null, 0);

  // 1. Entrada del texto pixelado y el dedo del cliente presionando CANJEAR (0.00s -> 0.45s)
  tl.to(
    caption,
    { autoAlpha: 1, y: 0, scale: 1, duration: 0.24, ease: "steps(4)" },
    0.02
  );
  tl.to(
    handCustomer,
    { autoAlpha: 1, x: 0, y: 0, duration: 0.24, ease: "steps(4)" },
    0.05
  );
  tl.to(handCustomer, { y: 4, duration: 0.07, ease: "steps(1)" }, 0.32);
  tl.to(
    btnRedeem,
    {
      y: 4,
      boxShadow: "0 0px 0 #1e1c1a",
      backgroundColor: "#b83726",
      duration: 0.07,
      ease: "steps(1)",
    },
    0.32
  );
  tl.to(
    btnRedeem,
    {
      y: 0,
      boxShadow: "0 4px 0 #1e1c1a",
      backgroundColor: "#e6533f",
      duration: 0.06,
      ease: "steps(1)",
    },
    0.41
  );

  // Pausa breve tras pulsar CANJEAR (0.5 s: 0.45s -> 0.95s)
  tl.to(
    handCustomer,
    { autoAlpha: 0, y: 36, duration: 0.16, ease: "steps(3)" },
    0.82
  );

  // 2. Las monedas requeridas salen del contador con animación de gasto y aparece el QR/ticket de canje (0.95s -> 1.55s)
  tl.set(spendTag, { autoAlpha: 1, y: 6 }, 0.95);
  tl.to(spendTag, { y: -10, duration: 0.3, ease: "steps(3)" }, 0.96);
  tl.set([coin1, coin2, coin3], { autoAlpha: 1, y: -38 }, 0.96);
  tl.to(
    coin1,
    { x: -85, y: -125, scale: 0.65, duration: 0.36, ease: "steps(4)" },
    0.96
  );
  tl.to(
    coin2,
    { x: 0, y: -140, scale: 0.65, duration: 0.36, ease: "steps(4)" },
    1.02
  );
  tl.to(
    coin3,
    { x: 85, y: -125, scale: 0.65, duration: 0.36, ease: "steps(4)" },
    1.08
  );
  tl.set([coin1, coin2, coin3, spendTag], { autoAlpha: 0 }, 1.42);

  tl.call(() => {
    if (pointsVal) pointsVal.textContent = "0 MONEDAS";
    if (winTitle) winTitle.textContent = "TICKET QR · SOLICITUD";
  }, null, 1.18);

  tl.set(viewRequest, { autoAlpha: 0, display: "none" }, 1.22);
  tl.set(viewTicket, { autoAlpha: 1, display: "block" }, 1.22);

  // 3. La mano del encargado presiona el botón de validación APROBAR desde la Tablet POS (1.55s -> 2.00s)
  tl.to(
    handStaff,
    { autoAlpha: 1, x: 0, y: 0, duration: 0.24, ease: "steps(4)" },
    1.55
  );
  tl.to(handStaff, { y: 4, duration: 0.07, ease: "steps(1)" }, 1.84);
  tl.to(
    btnApprove,
    {
      y: 4,
      boxShadow: "0 0px 0 #1e1c1a",
      backgroundColor: "#059669",
      duration: 0.07,
      ease: "steps(1)",
    },
    1.84
  );
  tl.to(
    btnApprove,
    {
      y: 0,
      boxShadow: "0 4px 0 #1e1c1a",
      backgroundColor: "#34d399",
      duration: 0.06,
      ease: "steps(1)",
    },
    1.93
  );
  tl.to(
    handStaff,
    { autoAlpha: 0, x: 36, y: 32, duration: 0.16, ease: "steps(3)" },
    1.98
  );

  // 4. Pausa de confirmación (0.7 s: 2.00s -> 2.70s) con sello retro CANJE APROBADO y check pixelado
  tl.to(caption, { scale: 1.05, duration: 0.1, yoyo: true, repeat: 1, ease: "steps(1)" }, 2.02);
  tl.to(
    stamp,
    { autoAlpha: 1, scale: 1, rotation: -3, duration: 0.16, ease: "steps(3)" },
    2.02
  );
  tl.to(card, { y: 3, duration: 0.04, ease: "steps(1)" }, 2.16);
  tl.to(card, { y: 0, duration: 0.04, ease: "steps(1)" }, 2.2);

  // 5. Resultado + Pausa de lectura configurable
  const rawRepeats = Math.max(0, Math.floor((readingPause - 0.25) / 0.25));
  const stampRepeats = rawRepeats % 2 === 0 ? rawRepeats : rawRepeats - 1;
  tl.to(
    stamp,
    {
      boxShadow: "0 0 0 3px #ffd166, 6px 6px 0 #1e1c1a",
      duration: Math.min(0.22, readingPause * 0.5),
      repeat: Math.max(0, stampRepeats),
      yoyo: true,
      ease: "steps(1)",
    },
    2.7
  );
  tl.set(scope, { autoAlpha: 1 }, endTime);

  return tl;
}

export function mountMoment4(containerEl, options = {}) {
  containerEl.innerHTML = `<div class="fa-stage fa-stage-single"><div class="fa-moments-viewport">${renderMoment4HTML()}</div></div>`;
  const gsapInstance = options.gsap || window.gsap;
  const tl = createMoment4Timeline(containerEl, gsapInstance, options);
  if (typeof options.speed === "number" && options.speed > 0) {
    tl.timeScale(options.speed);
  }
  if (options.loop !== false) {
    tl.repeat(-1);
  }
  return tl;
}
