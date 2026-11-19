/**
 * Catálogo unificado de Sprites Pixel Art 32x32 para la animación de Fideliapp.
 * Las manos están diseñadas con la técnica de contorno pixelado 1px de `referencias/hand.svg`,
 * con mano extendida de 5 dedos y paleta cálida armonizada con la landing page (sin blanco puro).
 */

export function spriteFideliappCoin({ className = "", id = "" } = {}) {
  const idAttr = id ? `id="${id}"` : "";
  return `
    <svg ${idAttr} class="fa-sprite fa-coin-svg ${className}" viewBox="0 0 32 32" shape-rendering="crispEdges" aria-hidden="true">
      <!-- Contorno exterior pixelado (#1e1c1a) -->
      <path fill="#1e1c1a" d="
        M11 2h10v1h3v1h2v2h2v2h1v3h1v10h-1v3h-1v2h-2v2h-2v1h-3v1H11v-1H8v-1H6v-2H4v-2H3v-3H2V11h1V8h1V6h2V4h2V3h3V2z
      "/>
      <!-- Aro dorado base (#facc15) -->
      <path fill="#facc15" d="
        M11 3h10v1h3v1h2v2h2v2h1v3h1v8h-1v3h-1v2h-2v2h-2v1h-3v1H11v-1H8v-1H6v-2H4v-2H3v-3H2v-8h1V9h1V7h2V5h2V4h3V3z
      "/>
      <!-- Luz superior izquierda del aro (#fef08a) -->
      <path fill="#fef08a" d="
        M11 3h9v1h-9V3zM8 4h3v1H8V4zM6 5h2v2H6V5zM4 7h2v2H4V7zM3 9h1v3H3V9zM3 12h1v6H3v-6zM4 5h2v1H4V5z
      "/>
      <!-- Sombra inferior derecha del aro (#d97706 / #92400e) -->
      <path fill="#d97706" d="
        M28 13h1v8h-1v3h-1v2h-2v2h-2v1h-3v1H11v-1h9v-1h3v-1h2v-2h1v-2h1v-3h1v-7z
      "/>
      <path fill="#92400e" d="
        M27 21h1v3h-1v2h-2v2h-3v1H12v-1h8v-1h3v-2h2v-2h2v-2z
      "/>
      <!-- 4 remaches rojos cardinales de la moneda Fideliapp (#e6533f) -->
      <rect x="15" y="4" width="2" height="1" fill="#e6533f" />
      <rect x="15" y="27" width="2" height="1" fill="#e6533f" />
      <rect x="4" y="15" width="1" height="2" fill="#e6533f" />
      <rect x="27" y="15" width="1" height="2" fill="#e6533f" />
      <!-- Anillo interior crema/tinta -->
      <path fill="#fffdf5" d="
        M11 6h10v1h2v1h2v2h1v10h-1v2h-2v1h-2v1H11v-1H9v-1H7v-2H6V10h1V8h2V7h2V6z
      "/>
      <!-- Centro carmesí (#b91c1c) con sombra (#7f1d1d) y brillo (#f87171) -->
      <path fill="#b91c1c" d="
        M11 7h10v1h2v2h2v10h-2v2h-2v1H11v-1H9v-2H7V10h2V8h2V7z
      "/>
      <path fill="#f87171" d="M9 10h2v8H9v-8zm2-2h3v2h-3V8z" />
      <path fill="#7f1d1d" d="M21 12h2v8h-2v2h-8v1h8v-1h2v-2h2V12h-2z" />
      <!-- Letra F central con contorno tinta (#1e1c1a) -->
      <path fill="#1e1c1a" d="
        M11 9h10v5h-6v1h5v4h-5v4h-4V9z
      "/>
      <!-- Relleno dorado de la F (#facc15) y brillo (#fef9c3) -->
      <path fill="#facc15" d="
        M12 10h8v3h-6v3h5v2h-5v4h-2V10z
      "/>
      <path fill="#fef9c3" d="
        M12 10h7v1h-7v-1zm0 1h1v10h-1V11zm2 5h4v1h-4v-1z
      "/>
    </svg>
  `;
}

export function spriteCoffeeAndCroissant({ className = "", id = "" } = {}) {
  const idAttr = id ? `id="${id}"` : "";
  return `
    <svg ${idAttr} class="fa-sprite fa-product-svg ${className}" viewBox="0 0 32 32" shape-rendering="crispEdges" aria-hidden="true">
      <!-- Burbujas / frescura superior animadas con steps() -->
      <g class="fa-steam-group">
        <rect class="fa-steam fa-steam-1" x="5" y="1" width="1" height="2" fill="#94a3b8" />
        <rect class="fa-steam fa-steam-2" x="15" y="8" width="2" height="2" fill="#ffd166" />
        <rect class="fa-steam fa-steam-3" x="25" y="4" width="2" height="2" fill="#94a3b8" />
      </g>

      <!-- Bandeja base (#1e1c1a + #eadec5) -->
      <rect x="1" y="26" width="30" height="3" fill="#1e1c1a" />
      <rect x="3" y="25" width="26" height="2" fill="#eadec5" />
      <rect x="2" y="25" width="1" height="2" fill="#1e1c1a" />
      <rect x="29" y="25" width="1" height="2" fill="#1e1c1a" />

      <!-- 1. GASEOSA CON PITILLO (Izquierda, x=2..10) -->
      <!-- Pitillo doblado -->
      <path fill="#1e1c1a" d="M5 2h4v2H7v3H5V2z" />
      <rect x="6" y="3" width="2" height="1" fill="#e6533f" />
      <rect x="6" y="4" width="1" height="3" fill="#fffdf5" />
      <!-- Tapa del vaso -->
      <rect x="2" y="7" width="9" height="3" fill="#1e1c1a" />
      <rect x="3" y="8" width="7" height="1" fill="#fffdf5" />
      <!-- Vaso de gaseosa -->
      <rect x="3" y="10" width="7" height="15" fill="#1e1c1a" />
      <rect x="4" y="10" width="5" height="14" fill="#e6533f" />
      <rect x="4" y="11" width="1" height="12" fill="#fca5a5" />
      <rect x="7" y="10" width="2" height="14" fill="#b83726" />
      <!-- Franja central del vaso -->
      <rect x="4" y="15" width="5" height="3" fill="#fffdf5" />
      <rect x="5" y="16" width="3" height="1" fill="#ffd166" />

      <!-- 2. PAPAS FRITAS EN CAJA ROJA (Derecha, x=20..30) -->
      <!-- Bastones de papas doradas -->
      <path fill="#1e1c1a" d="M20 7h10v8H20V7z" />
      <rect x="21" y="8" width="2" height="6" fill="#fef08a" />
      <rect x="23" y="7" width="2" height="7" fill="#facc15" />
      <rect x="25" y="8" width="2" height="6" fill="#f2a541" />
      <rect x="27" y="9" width="2" height="5" fill="#facc15" />
      <rect x="23" y="8" width="1" height="6" fill="#d97706" />
      <rect x="27" y="9" width="1" height="5" fill="#d97706" />
      <!-- Caja roja de papas -->
      <path fill="#1e1c1a" d="M20 14h10v11H20V14z" />
      <rect x="21" y="15" width="8" height="9" fill="#e6533f" />
      <rect x="27" y="15" width="2" height="9" fill="#b83726" />
      <rect x="23" y="17" width="4" height="3" fill="#ffd166" />

      <!-- 3. HAMBURGUESA PIXEL-ART (Centro-Frente, x=8..23, y=12..25) -->
      <!-- Contorno de la hamburguesa -->
      <path fill="#1e1c1a" d="
        M10 12h11v1h1v1h1v11H8V14h1v-1h1v-1z
      "/>
      <!-- Pan superior con semillas de ajonjolí -->
      <path fill="#f2a541" d="M10 13h11v1h1v3H9v-3h1v-1z" />
      <rect x="10" y="13" width="6" height="1" fill="#fbd38d" />
      <rect x="19" y="14" width="3" height="3" fill="#d97706" />
      <rect x="11" y="15" width="1" height="1" fill="#fffdf5" />
      <rect x="15" y="14" width="1" height="1" fill="#fffdf5" />
      <rect x="18" y="15" width="1" height="1" fill="#fffdf5" />
      <!-- Lechuga y tomate -->
      <rect x="9" y="17" width="13" height="1" fill="#34d399" />
      <rect x="11" y="18" width="10" height="1" fill="#e6533f" />
      <rect x="9" y="18" width="2" height="1" fill="#4e8c57" />
      <rect x="20" y="18" width="2" height="1" fill="#4e8c57" />
      <!-- Queso cheddar derretido -->
      <rect x="9" y="19" width="13" height="1" fill="#facc15" />
      <rect x="13" y="20" width="3" height="1" fill="#facc15" />
      <!-- Carne asada -->
      <rect x="9" y="20" width="4" height="2" fill="#78350f" />
      <rect x="13" y="21" width="3" height="1" fill="#78350f" />
      <rect x="16" y="20" width="6" height="2" fill="#78350f" />
      <rect x="19" y="20" width="3" height="2" fill="#451a03" />
      <!-- Pan inferior -->
      <rect x="9" y="22" width="13" height="2" fill="#f2a541" />
      <rect x="18" y="22" width="4" height="2" fill="#d97706" />
    </svg>
  `;
}

export function spritePixelBill({ className = "", id = "" } = {}) {
  const idAttr = id ? `id="${id}"` : "";
  return `
    <svg ${idAttr} class="fa-sprite fa-bill-svg ${className}" viewBox="0 0 32 32" shape-rendering="crispEdges" aria-hidden="true">
      <rect x="5" y="11" width="24" height="14" fill="#1e1c1a" />
      <rect x="3" y="9" width="24" height="14" fill="#1e1c1a" />
      <rect x="4" y="10" width="22" height="12" fill="#4e8c57" />
      <rect x="6" y="12" width="18" height="8" fill="#d1fae5" />
      <rect x="6" y="12" width="2" height="2" fill="#4e8c57" />
      <rect x="22" y="12" width="2" height="2" fill="#4e8c57" />
      <rect x="6" y="18" width="2" height="2" fill="#4e8c57" />
      <rect x="22" y="18" width="2" height="2" fill="#4e8c57" />
      <rect x="12" y="12" width="6" height="8" fill="#1e1c1a" />
      <rect x="13" y="13" width="4" height="6" fill="#ffd166" />
      <rect x="14" y="14" width="2" height="4" fill="#1e1c1a" />
    </svg>
  `;
}

/**
 * Mano Extendida Pixel-Art (5 dedos extendidos) inspirada en la técnica de contorno
 * escalonado 1px de `referencias/hand.svg`, usando tonos cálidos de piel/ámbar
 * (#f4c28b base, #fae0b8 luz, #d99b60 sombra) para integrarse con la paleta de la landing.
 */
function renderExtendedPixelHandSVG({
  skinBase = "#f4c28b",
  skinLight = "#fae0b8",
  skinShadow = "#d99b60",
  cuffColor = "#e6533f",
  cuffDark = "#b83726",
  accentDot = "#ffd166",
  transform = "",
  className = "",
  id = "",
}) {
  const idAttr = id ? `id="${id}"` : "";
  const transformAttr = transform ? `transform="${transform}"` : "";
  return `
    <svg ${idAttr} class="fa-sprite fa-hand-svg ${className}" viewBox="0 0 28 28" shape-rendering="crispEdges" aria-hidden="true">
      <g ${transformAttr}>
        <!-- Sombra dura exterior desplazada 1px -->
        <path fill="rgba(30, 28, 26, 0.22)" d="
          M8 4h2v-1h3v1h3v2h3v11h-1v3h-9v-2h-2v-2h-1v-1h-1v-1h-1v-2h2v1h2V4z
        " />

        <!-- Relleno base cálido de los 4 dedos extendidos, pulgar abierto y palma -->
        <!-- Índice (x=8..9, y=4..12) -->
        <rect x="8" y="4" width="2" height="9" fill="${skinBase}" />
        <!-- Medio (x=11..12, y=3..12) -->
        <rect x="11" y="3" width="2" height="10" fill="${skinBase}" />
        <!-- Anular (x=14..15, y=4..12) -->
        <rect x="14" y="4" width="2" height="9" fill="${skinBase}" />
        <!-- Meñique (x=17..18, y=6..12) -->
        <rect x="17" y="6" width="2" height="7" fill="${skinBase}" />
        <!-- Pulgar extendido a 45° a la izquierda -->
        <rect x="3" y="11" width="2" height="2" fill="${skinBase}" />
        <rect x="4" y="12" width="2" height="2" fill="${skinBase}" />
        <rect x="5" y="13" width="2" height="2" fill="${skinBase}" />
        <rect x="6" y="13" width="2" height="3" fill="${skinBase}" />
        <!-- Palma abierta -->
        <rect x="7" y="11" width="12" height="7" fill="${skinBase}" />
        <rect x="8" y="18" width="10" height="2" fill="${skinBase}" />

        <!-- Luces en bordes izquierdos y yemas de los dedos -->
        <rect x="8" y="4" width="1" height="7" fill="${skinLight}" />
        <rect x="11" y="3" width="1" height="8" fill="${skinLight}" />
        <rect x="14" y="4" width="1" height="7" fill="${skinLight}" />
        <rect x="17" y="6" width="1" height="5" fill="${skinLight}" />
        <rect x="3" y="11" width="2" height="1" fill="${skinLight}" />
        <rect x="8" y="13" width="6" height="2" fill="${skinLight}" />

        <!-- Sombreado cálido en pliegue de nudillos, borde derecho y base de palma -->
        <rect x="8" y="11" width="10" height="1" fill="${skinShadow}" />
        <rect x="17" y="12" width="2" height="6" fill="${skinShadow}" />
        <rect x="8" y="18" width="10" height="2" fill="${skinShadow}" />
        <rect x="6" y="15" width="2" height="1" fill="${skinShadow}" />

        <!-- Contorno escalonado 1px (#1e1c1a) y líneas divisorias de dedos estilo referencias/hand.svg -->
        <!-- Índice -->
        <rect x="8" y="3" width="2" height="1" fill="#1e1c1a" />
        <rect x="7" y="4" width="1" height="9" fill="#1e1c1a" />
        <!-- Divisor Índice / Medio -->
        <rect x="10" y="3" width="1" height="8" fill="#1e1c1a" />
        <!-- Medio -->
        <rect x="11" y="2" width="2" height="1" fill="#1e1c1a" />
        <!-- Divisor Medio / Anular -->
        <rect x="13" y="3" width="1" height="8" fill="#1e1c1a" />
        <!-- Anular -->
        <rect x="14" y="3" width="2" height="1" fill="#1e1c1a" />
        <!-- Divisor Anular / Meñique -->
        <rect x="16" y="4" width="1" height="7" fill="#1e1c1a" />
        <!-- Meñique y borde derecho palma -->
        <rect x="17" y="5" width="2" height="1" fill="#1e1c1a" />
        <rect x="19" y="6" width="1" height="11" fill="#1e1c1a" />
        <!-- Contorno del pulgar extendido -->
        <rect x="3" y="10" width="2" height="1" fill="#1e1c1a" />
        <rect x="5" y="11" width="1" height="1" fill="#1e1c1a" />
        <rect x="6" y="12" width="1" height="1" fill="#1e1c1a" />
        <rect x="2" y="11" width="1" height="2" fill="#1e1c1a" />
        <rect x="3" y="13" width="1" height="1" fill="#1e1c1a" />
        <rect x="4" y="14" width="1" height="1" fill="#1e1c1a" />
        <rect x="5" y="15" width="1" height="1" fill="#1e1c1a" />
        <rect x="6" y="16" width="1" height="2" fill="#1e1c1a" />
        <!-- Escalones inferiores de la muñeca -->
        <rect x="7" y="18" width="1" height="2" fill="#1e1c1a" />
        <rect x="18" y="17" width="1" height="3" fill="#1e1c1a" />
        <rect x="8" y="20" width="10" height="1" fill="#1e1c1a" />

        <!-- Puño / manga del rol (Cliente #e6533f / Encargado #467299) -->
        <rect x="8" y="21" width="10" height="4" fill="#1e1c1a" />
        <rect x="9" y="21" width="8" height="3" fill="${cuffColor}" />
        <rect x="9" y="23" width="8" height="1" fill="${cuffDark}" />
        <rect x="15" y="22" width="1" height="1" fill="${accentDot}" />
      </g>
    </svg>
  `;
}

/**
 * Mano del Cliente (Mano extendida cálida con puño rojo coral #e6533f).
 * pose: 'point' (vertical para pulsar botones) | 'pay' | 'receive' (horizontal hacia la derecha)
 */
export function spriteCustomerHand({ pose = "point", className = "", id = "" } = {}) {
  const isHorizontal = pose === "pay" || pose === "receive";
  const transform = isHorizontal ? "rotate(90 14 14)" : "";
  return renderExtendedPixelHandSVG({
    skinBase: "#f4c28b",
    skinLight: "#fae0b8",
    skinShadow: "#d99b60",
    cuffColor: "#e6533f",
    cuffDark: "#b83726",
    accentDot: "#ffd166",
    transform,
    className: `fa-hand-customer ${className}`,
    id,
  });
}

/**
 * Mano del Encargado del negocio (Mano extendida cálida con puño azul #467299).
 * pose: 'point' (vertical para pulsar botones) | 'deliver' (horizontal hacia la izquierda)
 */
export function spriteStaffHand({ pose = "point", className = "", id = "" } = {}) {
  const transform =
    pose === "deliver"
      ? "translate(28 0) scale(-1 1) rotate(90 14 14)"
      : "translate(28 0) scale(-1 1)";
  return renderExtendedPixelHandSVG({
    skinBase: "#eeb882",
    skinLight: "#f8d8b0",
    skinShadow: "#cf8f52",
    cuffColor: "#467299",
    cuffDark: "#2c4c6b",
    accentDot: "#fffdf5",
    transform,
    className: `fa-hand-staff ${className}`,
    id,
  });
}

/**
 * Código QR 32x32 dividido en 8 bloques independientes (.fa-qr-block)
 * para animar su construcción bloque a bloque en el Momento 1.
 */
export function spritePixelQr({ className = "", id = "" } = {}) {
  const idAttr = id ? `id="${id}"` : "";
  return `
    <svg ${idAttr} class="fa-sprite fa-qr-svg ${className}" viewBox="0 0 32 32" shape-rendering="crispEdges" aria-hidden="true">
      <g class="fa-qr-block" data-qr-block="1">
        <path fill="#1e1c1a" d="M2 2h10v10H2V2zm2 2v6h6V4H4zm2 2h2v2H6V6z" />
      </g>
      <g class="fa-qr-block" data-qr-block="2">
        <path fill="#1e1c1a" d="M20 2h10v10H20V2zm2 2v6h6V4h-6zm2 2h2v2h-2V6z" />
      </g>
      <g class="fa-qr-block" data-qr-block="3">
        <path fill="#1e1c1a" d="M2 20h10v10H2V20zm2 2v6h6v-6H4zm2 2h2v2H6v-2z" />
      </g>
      <g class="fa-qr-block" data-qr-block="4">
        <rect x="14" y="2" width="2" height="4" fill="#1e1c1a" />
        <rect x="16" y="6" width="2" height="2" fill="#1e1c1a" />
        <rect x="14" y="8" width="2" height="4" fill="#1e1c1a" />
      </g>
      <g class="fa-qr-block" data-qr-block="5">
        <rect x="2" y="14" width="4" height="2" fill="#1e1c1a" />
        <rect x="8" y="14" width="2" height="4" fill="#1e1c1a" />
        <rect x="4" y="16" width="2" height="2" fill="#1e1c1a" />
      </g>
      <g class="fa-qr-block" data-qr-block="6">
        <rect x="12" y="12" width="8" height="8" fill="#1e1c1a" />
        <rect x="13" y="13" width="6" height="6" fill="#e6533f" />
        <rect x="14" y="14" width="4" height="4" fill="#ffd166" />
      </g>
      <g class="fa-qr-block" data-qr-block="7">
        <rect x="22" y="14" width="4" height="2" fill="#1e1c1a" />
        <rect x="28" y="14" width="2" height="4" fill="#1e1c1a" />
        <rect x="24" y="18" width="4" height="2" fill="#1e1c1a" />
      </g>
      <g class="fa-qr-block" data-qr-block="8">
        <rect x="14" y="22" width="4" height="2" fill="#1e1c1a" />
        <rect x="16" y="26" width="2" height="4" fill="#1e1c1a" />
        <rect x="20" y="22" width="6" height="6" fill="#1e1c1a" />
        <rect x="22" y="24" width="2" height="2" fill="#fffdf5" />
        <rect x="28" y="24" width="2" height="6" fill="#1e1c1a" />
      </g>
    </svg>
  `;
}

export function spriteRewardLock({ className = "" } = {}) {
  return `
    <svg class="fa-sprite fa-lock-svg ${className}" viewBox="0 0 32 32" shape-rendering="crispEdges" aria-hidden="true">
      <path fill="#1e1c1a" d="M10 4h12v2h2v8h4v14H4V14h4V6h2V4zm2 4v6h8V8h-8z" />
      <path fill="#94a3b8" d="M11 6h10v8h-2V8h-6v6h-2V6z" />
      <rect x="6" y="16" width="20" height="10" fill="#64748b" />
      <rect x="7" y="17" width="18" height="2" fill="#cbd5e1" />
      <rect x="14" y="19" width="4" height="5" fill="#1e1c1a" />
      <rect x="15" y="20" width="2" height="2" fill="#ffd166" />
    </svg>
  `;
}

export function spriteRewardTrophy({ className = "" } = {}) {
  return `
    <svg class="fa-sprite fa-trophy-svg ${className}" viewBox="0 0 32 32" shape-rendering="crispEdges" aria-hidden="true">
      <path fill="#1e1c1a" d="
        M7 3h18v3h4v8h-4v3h-3v3h-3v4h5v3h2v3H6v-3h2v-3h5v-4h-3v-3H7v-3H3V6h4V3z
      "/>
      <rect x="5" y="8" width="2" height="4" fill="#d97706" />
      <rect x="25" y="8" width="2" height="4" fill="#d97706" />
      <rect x="9" y="5" width="14" height="10" fill="#facc15" />
      <rect x="11" y="15" width="10" height="3" fill="#f2a541" />
      <rect x="10" y="6" width="3" height="8" fill="#fef9c3" />
      <rect x="15" y="8" width="2" height="6" fill="#e6533f" />
      <rect x="13" y="10" width="6" height="2" fill="#e6533f" />
      <rect x="15" y="18" width="2" height="6" fill="#d97706" />
      <rect x="10" y="24" width="12" height="2" fill="#facc15" />
      <rect x="8" y="26" width="16" height="2" fill="#467299" />
    </svg>
  `;
}

export function spritePixelHeart({ className = "" } = {}) {
  return `
    <svg class="fa-pixel-heart ${className}" viewBox="0 0 12 11" shape-rendering="crispEdges" aria-hidden="true">
      <path fill="#e6533f" d="M2 1h3v1h2V1h3v1h1v3h-1v2H9v1H8v1H7v1H5V9H4V8H3V7H2V5H1V2h1V1z" />
      <rect x="2" y="2" width="2" height="1" fill="#fecaca" />
    </svg>
  `;
}

export function spritePixelCheck({ className = "" } = {}) {
  return `
    <svg class="fa-pixel-check ${className}" viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true">
      <path fill="#1e1c1a" d="M12 3h3v3h-2v2h-2v2H9v2H7v2H5v-2H3v-2H1V7h3v2h2v2h2V9h2V7h2V5h0V3z" />
    </svg>
  `;
}

export function spriteDeviceStatusIcons() {
  return `
    <span class="fa-device-status-icons" aria-hidden="true">
      <!-- Señal -->
      <svg class="fa-status-ico" viewBox="0 0 12 10" shape-rendering="crispEdges">
        <rect x="1" y="7" width="2" height="2" fill="currentColor" />
        <rect x="4" y="5" width="2" height="4" fill="currentColor" />
        <rect x="7" y="3" width="2" height="6" fill="currentColor" />
        <rect x="10" y="1" width="2" height="8" fill="currentColor" />
      </svg>
      <!-- Batería -->
      <svg class="fa-status-ico" viewBox="0 0 14 10" shape-rendering="crispEdges">
        <path fill="currentColor" d="M1 2h10v6H1V2zm1 1v4h8V3H2zm10 1h1v2h-1V4z" />
        <rect x="3" y="4" width="6" height="2" fill="currentColor" />
      </svg>
    </span>
  `;
}
