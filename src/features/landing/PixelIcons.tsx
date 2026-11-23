export interface PixelIconProps {
  size?: number;
  className?: string;
}

const baseProps = (size: number, className?: string) => ({
  width: size,
  height: size,
  viewBox: "0 0 16 16",
  shapeRendering: "crispEdges" as const,
  className: className ? `px-icon ${className}` : "px-icon",
  "aria-hidden": true as const,
  focusable: false as const,
});

/**
 * Íconos pixel art 32-bit (cuadrícula 16x16 con contorno #16262e y sombreado multicapa)
 * diseñados para mantener alto contraste sobre amarillo, blanco, azul, verde y modo oscuro.
 */

export function PixelDownloadIcon({ size = 18, className }: PixelIconProps) {
  return (
    <svg {...baseProps(size, className)}>
      {/* Flecha de descarga con contorno oscuro y relleno azul cobalto 32-bit */}
      <rect x="6" y="1" width="4" height="1" fill="#16262e" />
      <rect x="5" y="2" width="1" height="5" fill="#16262e" />
      <rect x="10" y="2" width="1" height="5" fill="#16262e" />
      <rect x="3" y="6" width="2" height="1" fill="#16262e" />
      <rect x="11" y="6" width="2" height="1" fill="#16262e" />
      <rect x="2" y="7" width="1" height="1" fill="#16262e" />
      <rect x="13" y="7" width="1" height="1" fill="#16262e" />
      <rect x="3" y="8" width="1" height="1" fill="#16262e" />
      <rect x="12" y="8" width="1" height="1" fill="#16262e" />
      <rect x="4" y="9" width="1" height="1" fill="#16262e" />
      <rect x="11" y="9" width="1" height="1" fill="#16262e" />
      <rect x="5" y="10" width="2" height="1" fill="#16262e" />
      <rect x="9" y="10" width="2" height="1" fill="#16262e" />
      <rect x="7" y="11" width="2" height="1" fill="#16262e" />
      {/* Relleno 32-bit de la flecha */}
      <rect x="6" y="2" width="4" height="5" fill="#1765cc" />
      <rect x="6" y="2" width="1" height="5" fill="#60a5fa" />
      <rect x="9" y="2" width="1" height="5" fill="#10448f" />
      <rect x="3" y="7" width="10" height="1" fill="#1765cc" />
      <rect x="3" y="7" width="3" height="1" fill="#60a5fa" />
      <rect x="4" y="8" width="8" height="1" fill="#1765cc" />
      <rect x="5" y="9" width="6" height="1" fill="#1454ad" />
      <rect x="7" y="10" width="2" height="1" fill="#10448f" />
      {/* Bandeja inferior metálica */}
      <rect x="1" y="10" width="2" height="4" fill="#16262e" />
      <rect x="13" y="10" width="2" height="4" fill="#16262e" />
      <rect x="2" y="14" width="12" height="1" fill="#16262e" />
      <rect x="2" y="12" width="12" height="2" fill="#2b4652" />
      <rect x="2" y="12" width="12" height="1" fill="#94a3b8" />
      <rect x="2" y="11" width="1" height="2" fill="#cbd5e1" />
      <rect x="13" y="11" width="1" height="2" fill="#64748b" />
    </svg>
  );
}

export function PixelBoltIcon({ size = 18, className }: PixelIconProps) {
  return (
    <svg {...baseProps(size, className)}>
      {/* Contorno oscuro de rayo arcade de alto contraste sobre amarillo */}
      <rect x="7" y="1" width="5" height="1" fill="#16262e" />
      <rect x="6" y="2" width="1" height="2" fill="#16262e" />
      <rect x="11" y="2" width="1" height="2" fill="#16262e" />
      <rect x="5" y="4" width="1" height="2" fill="#16262e" />
      <rect x="10" y="4" width="1" height="2" fill="#16262e" />
      <rect x="4" y="6" width="1" height="2" fill="#16262e" />
      <rect x="9" y="6" width="4" height="1" fill="#16262e" />
      <rect x="3" y="8" width="4" height="1" fill="#16262e" />
      <rect x="12" y="7" width="1" height="2" fill="#16262e" />
      <rect x="6" y="9" width="1" height="2" fill="#16262e" />
      <rect x="11" y="9" width="1" height="2" fill="#16262e" />
      <rect x="5" y="11" width="1" height="2" fill="#16262e" />
      <rect x="9" y="11" width="2" height="1" fill="#16262e" />
      <rect x="8" y="12" width="1" height="2" fill="#16262e" />
      <rect x="5" y="13" width="3" height="2" fill="#16262e" />
      {/* Relleno eléctrico azul cobalto + destello cian/blanco */}
      <rect x="7" y="2" width="4" height="2" fill="#1765cc" />
      <rect x="7" y="2" width="2" height="2" fill="#60a5fa" />
      <rect x="6" y="4" width="4" height="2" fill="#1765cc" />
      <rect x="6" y="4" width="2" height="2" fill="#93c5fd" />
      <rect x="5" y="6" width="4" height="2" fill="#1765cc" />
      <rect x="5" y="6" width="2" height="1" fill="#fff8e6" />
      <rect x="7" y="7" width="5" height="2" fill="#1765cc" />
      <rect x="7" y="7" width="2" height="1" fill="#60a5fa" />
      <rect x="7" y="9" width="4" height="2" fill="#10448f" />
      <rect x="7" y="9" width="2" height="2" fill="#38bdf8" />
      <rect x="6" y="11" width="3" height="2" fill="#1765cc" />
      <rect x="6" y="11" width="1" height="2" fill="#60a5fa" />
      <rect x="6" y="13" width="1" height="1" fill="#93c5fd" />
    </svg>
  );
}

export function PixelPhoneIcon({ size = 18, className }: PixelIconProps) {
  return (
    <svg {...baseProps(size, className)}>
      {/* Chasis del celular */}
      <rect x="4" y="1" width="8" height="1" fill="#16262e" />
      <rect x="3" y="2" width="1" height="12" fill="#16262e" />
      <rect x="12" y="2" width="1" height="12" fill="#16262e" />
      <rect x="4" y="14" width="8" height="1" fill="#16262e" />
      {/* Marco metálico slate */}
      <rect x="4" y="2" width="8" height="12" fill="#2b4652" />
      <rect x="4" y="2" width="1" height="11" fill="#64748b" />
      {/* Auricular superior y botón inferior */}
      <rect x="6" y="2" width="4" height="1" fill="#16262e" />
      <rect x="7" y="13" width="2" height="1" fill="#cbd5e1" />
      {/* Pantalla azul vibrante con moneda dorada */}
      <rect x="5" y="4" width="6" height="8" fill="#1765cc" />
      <rect x="5" y="4" width="2" height="3" fill="#60a5fa" />
      <rect x="5" y="10" width="6" height="2" fill="#10448f" />
      {/* Mini moneda / destello en pantalla */}
      <rect x="7" y="6" width="2" height="2" fill="#fad24b" />
      <rect x="7" y="6" width="1" height="1" fill="#fff8e6" />
      <rect x="6" y="9" width="4" height="1" fill="#24d04a" />
    </svg>
  );
}

export function PixelQrIcon({ size = 18, className }: PixelIconProps) {
  return (
    <svg {...baseProps(size, className)}>
      {/* Marco exterior */}
      <rect x="1" y="1" width="14" height="14" fill="#16262e" />
      <rect x="2" y="2" width="12" height="12" fill="#fff8e6" />
      {/* Patrón superior izquierdo */}
      <rect x="3" y="3" width="4" height="4" fill="#16262e" />
      <rect x="4" y="4" width="2" height="2" fill="#1765cc" />
      {/* Patrón superior derecho */}
      <rect x="9" y="3" width="4" height="4" fill="#16262e" />
      <rect x="10" y="4" width="2" height="2" fill="#1765cc" />
      {/* Patrón inferior izquierdo */}
      <rect x="3" y="9" width="4" height="4" fill="#16262e" />
      <rect x="4" y="10" width="2" height="2" fill="#169c35" />
      {/* Módulos de datos centrales + acento dorado */}
      <rect x="8" y="8" width="2" height="2" fill="#fad24b" />
      <rect x="11" y="8" width="2" height="1" fill="#16262e" />
      <rect x="10" y="10" width="3" height="1" fill="#1765cc" />
      <rect x="8" y="11" width="2" height="2" fill="#16262e" />
      <rect x="11" y="12" width="2" height="1" fill="#16262e" />
    </svg>
  );
}

export function PixelTimerIcon({ size = 18, className }: PixelIconProps) {
  return (
    <svg {...baseProps(size, className)}>
      {/* Corona superior verde */}
      <rect x="6" y="1" width="4" height="1" fill="#16262e" />
      <rect x="7" y="2" width="2" height="1" fill="#24d04a" />
      {/* Contorno circular del cronómetro */}
      <rect x="5" y="3" width="6" height="1" fill="#16262e" />
      <rect x="3" y="4" width="2" height="1" fill="#16262e" />
      <rect x="11" y="4" width="2" height="1" fill="#16262e" />
      <rect x="2" y="5" width="1" height="6" fill="#16262e" />
      <rect x="13" y="5" width="1" height="6" fill="#16262e" />
      <rect x="3" y="11" width="2" height="2" fill="#16262e" />
      <rect x="11" y="11" width="2" height="2" fill="#16262e" />
      <rect x="5" y="13" width="6" height="2" fill="#16262e" />
      {/* Bisel metálico */}
      <rect x="5" y="4" width="6" height="1" fill="#94a3b8" />
      <rect x="3" y="5" width="10" height="6" fill="#64748b" />
      <rect x="5" y="11" width="6" height="2" fill="#475569" />
      {/* Esfera crema */}
      <rect x="5" y="5" width="6" height="7" fill="#fff8e6" />
      <rect x="4" y="6" width="8" height="5" fill="#fff8e6" />
      {/* Agujas */}
      <rect x="7" y="6" width="1" height="3" fill="#1765cc" />
      <rect x="7" y="8" width="3" height="1" fill="#d9412e" />
      <rect x="7" y="8" width="1" height="1" fill="#16262e" />
    </svg>
  );
}

export function PixelSparklesIcon({ size = 16, className }: PixelIconProps) {
  return (
    <svg {...baseProps(size, className)}>
      {/* Destello principal azul cobalto + cian con contorno oscuro (alto contraste sobre amarillo) */}
      <rect x="6" y="1" width="2" height="2" fill="#16262e" />
      <rect x="5" y="3" width="1" height="2" fill="#16262e" />
      <rect x="8" y="3" width="1" height="2" fill="#16262e" />
      <rect x="3" y="5" width="2" height="1" fill="#16262e" />
      <rect x="9" y="5" width="2" height="1" fill="#16262e" />
      <rect x="1" y="6" width="2" height="2" fill="#16262e" />
      <rect x="11" y="6" width="2" height="2" fill="#16262e" />
      <rect x="3" y="8" width="2" height="1" fill="#16262e" />
      <rect x="9" y="8" width="2" height="1" fill="#16262e" />
      <rect x="5" y="9" width="1" height="2" fill="#16262e" />
      <rect x="8" y="9" width="1" height="2" fill="#16262e" />
      <rect x="6" y="11" width="2" height="2" fill="#16262e" />
      {/* Relleno 32-bit estrella principal */}
      <rect x="6" y="3" width="2" height="8" fill="#1765cc" />
      <rect x="3" y="6" width="8" height="2" fill="#1765cc" />
      <rect x="5" y="5" width="4" height="4" fill="#38bdf8" />
      <rect x="6" y="6" width="2" height="2" fill="#fff8e6" />
      {/* Chispa secundaria esmeralda */}
      <rect x="12" y="10" width="2" height="1" fill="#16262e" />
      <rect x="11" y="11" width="4" height="2" fill="#16262e" />
      <rect x="12" y="13" width="2" height="1" fill="#16262e" />
      <rect x="12" y="11" width="2" height="2" fill="#24d04a" />
      <rect x="12" y="11" width="1" height="1" fill="#fff8e6" />
    </svg>
  );
}

export function PixelCheckIcon({ size = 20, className }: PixelIconProps) {
  return (
    <svg {...baseProps(size, className)}>
      {/* Insignia cuadrada 32-bit esmeralda con bisel */}
      <rect x="1" y="1" width="14" height="14" fill="#16262e" />
      <rect x="2" y="2" width="12" height="12" fill="#169c35" />
      <rect x="2" y="2" width="12" height="2" fill="#24d04a" />
      <rect x="2" y="2" width="2" height="10" fill="#24d04a" />
      <rect x="2" y="12" width="12" height="2" fill="#0f6d25" />
      <rect x="12" y="4" width="2" height="10" fill="#0f6d25" />
      {/* Sombra del check */}
      <rect x="4" y="8" width="2" height="2" fill="#16262e" />
      <rect x="6" y="10" width="2" height="2" fill="#16262e" />
      <rect x="8" y="8" width="2" height="2" fill="#16262e" />
      <rect x="10" y="6" width="2" height="2" fill="#16262e" />
      {/* Check crema luminoso */}
      <rect x="4" y="7" width="2" height="2" fill="#fff8e6" />
      <rect x="6" y="9" width="2" height="2" fill="#fff8e6" />
      <rect x="8" y="7" width="2" height="2" fill="#fff8e6" />
      <rect x="10" y="5" width="2" height="2" fill="#fff8e6" />
    </svg>
  );
}

export function PixelArrowRightIcon({
  size = 16,
  className,
  tone = "gold",
}: PixelIconProps & { tone?: "gold" | "blue" }) {
  const main = tone === "blue" ? "#1765cc" : "#fad24b";
  const hi = tone === "blue" ? "#60a5fa" : "#fff8e6";
  const shade = tone === "blue" ? "#10448f" : "#d97706";
  return (
    <svg {...baseProps(size, className)}>
      {/* Contorno oscuro */}
      <rect x="7" y="2" width="2" height="1" fill="#16262e" />
      <rect x="7" y="3" width="1" height="2" fill="#16262e" />
      <rect x="9" y="3" width="2" height="1" fill="#16262e" />
      <rect x="11" y="4" width="2" height="1" fill="#16262e" />
      <rect x="2" y="5" width="6" height="1" fill="#16262e" />
      <rect x="13" y="5" width="1" height="1" fill="#16262e" />
      <rect x="1" y="6" width="1" height="4" fill="#16262e" />
      <rect x="14" y="6" width="1" height="4" fill="#16262e" />
      <rect x="2" y="10" width="6" height="1" fill="#16262e" />
      <rect x="13" y="10" width="1" height="1" fill="#16262e" />
      <rect x="7" y="11" width="1" height="2" fill="#16262e" />
      <rect x="11" y="11" width="2" height="1" fill="#16262e" />
      <rect x="9" y="12" width="2" height="1" fill="#16262e" />
      <rect x="7" y="13" width="2" height="1" fill="#16262e" />
      {/* Relleno 32-bit con alto contraste según fondo */}
      <rect x="2" y="6" width="12" height="4" fill={main} />
      <rect x="8" y="4" width="3" height="8" fill={main} />
      <rect x="11" y="5" width="2" height="6" fill={main} />
      <rect x="8" y="3" width="1" height="10" fill={main} />
      {/* Brillo superior y sombra inferior */}
      <rect x="2" y="6" width="11" height="1" fill={hi} />
      <rect x="8" y="4" width="2" height="1" fill={hi} />
      <rect x="2" y="9" width="11" height="1" fill={shade} />
      <rect x="8" y="11" width="2" height="1" fill={shade} />
    </svg>
  );
}

export function PixelChevronLeftIcon({ size = 16, className }: PixelIconProps) {
  return (
    <svg {...baseProps(size, className)}>
      <rect x="9" y="2" width="2" height="1" fill="#16262e" />
      <rect x="7" y="3" width="2" height="1" fill="#16262e" />
      <rect x="11" y="3" width="1" height="2" fill="#16262e" />
      <rect x="5" y="4" width="2" height="2" fill="#16262e" />
      <rect x="4" y="6" width="1" height="4" fill="#16262e" />
      <rect x="5" y="10" width="2" height="2" fill="#16262e" />
      <rect x="7" y="12" width="2" height="1" fill="#16262e" />
      <rect x="9" y="13" width="2" height="1" fill="#16262e" />
      <rect x="11" y="11" width="1" height="2" fill="#16262e" />
      <rect x="9" y="5" width="2" height="1" fill="#16262e" />
      <rect x="8" y="6" width="1" height="4" fill="#16262e" />
      <rect x="9" y="10" width="2" height="1" fill="#16262e" />
      {/* Relleno cobalto 32-bit */}
      <rect x="9" y="3" width="2" height="2" fill="#60a5fa" />
      <rect x="7" y="4" width="2" height="2" fill="#60a5fa" />
      <rect x="5" y="6" width="3" height="4" fill="#1765cc" />
      <rect x="5" y="6" width="2" height="2" fill="#60a5fa" />
      <rect x="7" y="10" width="2" height="2" fill="#1765cc" />
      <rect x="9" y="11" width="2" height="2" fill="#10448f" />
    </svg>
  );
}

export function PixelChevronRightIcon({ size = 16, className }: PixelIconProps) {
  return (
    <svg {...baseProps(size, className)}>
      <rect x="5" y="2" width="2" height="1" fill="#16262e" />
      <rect x="7" y="3" width="2" height="1" fill="#16262e" />
      <rect x="4" y="3" width="1" height="2" fill="#16262e" />
      <rect x="9" y="4" width="2" height="2" fill="#16262e" />
      <rect x="11" y="6" width="1" height="4" fill="#16262e" />
      <rect x="9" y="10" width="2" height="2" fill="#16262e" />
      <rect x="7" y="12" width="2" height="1" fill="#16262e" />
      <rect x="5" y="13" width="2" height="1" fill="#16262e" />
      <rect x="4" y="11" width="1" height="2" fill="#16262e" />
      <rect x="5" y="5" width="2" height="1" fill="#16262e" />
      <rect x="7" y="6" width="1" height="4" fill="#16262e" />
      <rect x="5" y="10" width="2" height="1" fill="#16262e" />
      {/* Relleno cobalto 32-bit */}
      <rect x="5" y="3" width="2" height="2" fill="#60a5fa" />
      <rect x="7" y="4" width="2" height="2" fill="#60a5fa" />
      <rect x="8" y="6" width="3" height="4" fill="#1765cc" />
      <rect x="9" y="6" width="2" height="2" fill="#60a5fa" />
      <rect x="7" y="10" width="2" height="2" fill="#1765cc" />
      <rect x="5" y="11" width="2" height="2" fill="#10448f" />
    </svg>
  );
}

export function PixelSearchIcon({ size = 18, className }: PixelIconProps) {
  return (
    <svg {...baseProps(size, className)}>
      {/* Aro oscuro de la lupa */}
      <rect x="4" y="1" width="5" height="1" fill="#16262e" />
      <rect x="2" y="2" width="2" height="2" fill="#16262e" />
      <rect x="9" y="2" width="2" height="2" fill="#16262e" />
      <rect x="1" y="4" width="1" height="5" fill="#16262e" />
      <rect x="11" y="4" width="1" height="5" fill="#16262e" />
      <rect x="2" y="9" width="2" height="2" fill="#16262e" />
      <rect x="9" y="9" width="2" height="2" fill="#16262e" />
      <rect x="4" y="11" width="5" height="1" fill="#16262e" />
      {/* Bisel dorado y cristal azul cielo */}
      <rect x="4" y="2" width="5" height="9" fill="#38bdf8" />
      <rect x="2" y="4" width="9" height="5" fill="#38bdf8" />
      <rect x="3" y="3" width="7" height="7" fill="#60a5fa" />
      <rect x="4" y="3" width="2" height="2" fill="#fff8e6" />
      <rect x="3" y="5" width="1" height="2" fill="#e0f2fe" />
      {/* Mango 32-bit */}
      <rect x="10" y="10" width="2" height="2" fill="#16262e" />
      <rect x="11" y="11" width="2" height="2" fill="#fad24b" />
      <rect x="12" y="12" width="2" height="2" fill="#d97706" />
      <rect x="13" y="11" width="1" height="2" fill="#16262e" />
      <rect x="11" y="13" width="2" height="1" fill="#16262e" />
      <rect x="13" y="13" width="2" height="2" fill="#16262e" />
    </svg>
  );
}

export function PixelPlayIcon({ size = 14, className }: PixelIconProps) {
  return (
    <svg {...baseProps(size, className)}>
      <rect x="3" y="2" width="2" height="12" fill="#16262e" />
      <rect x="5" y="3" width="2" height="10" fill="#16262e" />
      <rect x="7" y="4" width="2" height="8" fill="#16262e" />
      <rect x="9" y="5" width="2" height="6" fill="#16262e" />
      <rect x="11" y="6" width="2" height="4" fill="#16262e" />
      <rect x="13" y="7" width="1" height="2" fill="#16262e" />
      {/* Relleno verde esmeralda 32-bit con alto contraste sobre amarillo */}
      <rect x="4" y="3" width="1" height="10" fill="#86efac" />
      <rect x="5" y="4" width="2" height="8" fill="#24d04a" />
      <rect x="7" y="5" width="2" height="6" fill="#169c35" />
      <rect x="9" y="6" width="2" height="4" fill="#169c35" />
      <rect x="11" y="7" width="1" height="2" fill="#0f6d25" />
    </svg>
  );
}

export function PixelPauseIcon({ size = 14, className }: PixelIconProps) {
  return (
    <svg {...baseProps(size, className)}>
      {/* Dos barras con contorno #16262e y relleno azul cobalto */}
      <rect x="2" y="2" width="5" height="12" fill="#16262e" />
      <rect x="9" y="2" width="5" height="12" fill="#16262e" />
      <rect x="3" y="3" width="3" height="10" fill="#1765cc" />
      <rect x="3" y="3" width="1" height="10" fill="#60a5fa" />
      <rect x="10" y="3" width="3" height="10" fill="#1765cc" />
      <rect x="10" y="3" width="1" height="10" fill="#60a5fa" />
    </svg>
  );
}

export function PixelMenuIcon({ size = 18, className }: PixelIconProps) {
  return (
    <svg {...baseProps(size, className)}>
      {/* 3 barras pixel art con borde oscuro y relleno azul */}
      <rect x="1" y="2" width="14" height="3" fill="#16262e" />
      <rect x="2" y="3" width="12" height="1" fill="#1765cc" />
      <rect x="2" y="3" width="4" height="1" fill="#60a5fa" />

      <rect x="1" y="6" width="14" height="4" fill="#16262e" />
      <rect x="2" y="7" width="12" height="2" fill="#1765cc" />
      <rect x="2" y="7" width="12" height="1" fill="#60a5fa" />

      <rect x="1" y="11" width="14" height="3" fill="#16262e" />
      <rect x="2" y="12" width="12" height="1" fill="#1765cc" />
      <rect x="2" y="12" width="4" height="1" fill="#60a5fa" />
    </svg>
  );
}

export function PixelCloseIcon({ size = 18, className }: PixelIconProps) {
  return (
    <svg {...baseProps(size, className)}>
      {/* X pixel art coral/rojo con contorno oscuro */}
      <rect x="2" y="2" width="3" height="3" fill="#16262e" />
      <rect x="11" y="2" width="3" height="3" fill="#16262e" />
      <rect x="4" y="4" width="3" height="3" fill="#16262e" />
      <rect x="9" y="4" width="3" height="3" fill="#16262e" />
      <rect x="6" y="6" width="4" height="4" fill="#16262e" />
      <rect x="4" y="9" width="3" height="3" fill="#16262e" />
      <rect x="9" y="9" width="3" height="3" fill="#16262e" />
      <rect x="2" y="11" width="3" height="3" fill="#16262e" />
      <rect x="11" y="11" width="3" height="3" fill="#16262e" />
      {/* Relleno 32-bit */}
      <rect x="3" y="3" width="2" height="2" fill="#ef4444" />
      <rect x="11" y="3" width="2" height="2" fill="#ef4444" />
      <rect x="5" y="5" width="2" height="2" fill="#f87171" />
      <rect x="9" y="5" width="2" height="2" fill="#ef4444" />
      <rect x="7" y="7" width="2" height="2" fill="#fca5a5" />
      <rect x="5" y="9" width="2" height="2" fill="#dc2626" />
      <rect x="9" y="9" width="2" height="2" fill="#dc2626" />
      <rect x="3" y="11" width="2" height="2" fill="#b91c1c" />
      <rect x="11" y="11" width="2" height="2" fill="#b91c1c" />
    </svg>
  );
}

export function PixelStarIcon({ size = 16, className }: PixelIconProps) {
  return (
    <svg {...baseProps(size, className)}>
      <rect x="7" y="1" width="2" height="2" fill="#16262e" />
      <rect x="6" y="3" width="4" height="2" fill="#16262e" />
      <rect x="1" y="5" width="14" height="3" fill="#16262e" />
      <rect x="3" y="8" width="10" height="2" fill="#16262e" />
      <rect x="4" y="10" width="8" height="2" fill="#16262e" />
      <rect x="3" y="12" width="4" height="2" fill="#16262e" />
      <rect x="9" y="12" width="4" height="2" fill="#16262e" />
      <rect x="2" y="14" width="3" height="1" fill="#16262e" />
      <rect x="11" y="14" width="3" height="1" fill="#16262e" />
      {/* Relleno dorado 32-bit */}
      <rect x="7" y="2" width="2" height="4" fill="#fad24b" />
      <rect x="7" y="2" width="1" height="3" fill="#fff8e6" />
      <rect x="2" y="6" width="12" height="1" fill="#fad24b" />
      <rect x="3" y="6" width="5" height="1" fill="#fff8e6" />
      <rect x="4" y="7" width="8" height="3" fill="#fad24b" />
      <rect x="5" y="10" width="6" height="1" fill="#e89c1c" />
      <rect x="4" y="11" width="2" height="2" fill="#e89c1c" />
      <rect x="10" y="11" width="2" height="2" fill="#d97706" />
    </svg>
  );
}

export function PixelCoinIcon({ size = 18, className }: PixelIconProps) {
  return (
    <svg {...baseProps(size, className)}>
      <rect x="5" y="1" width="6" height="1" fill="#16262e" />
      <rect x="3" y="2" width="2" height="2" fill="#16262e" />
      <rect x="11" y="2" width="2" height="2" fill="#16262e" />
      <rect x="2" y="4" width="1" height="8" fill="#16262e" />
      <rect x="13" y="4" width="1" height="8" fill="#16262e" />
      <rect x="3" y="12" width="2" height="2" fill="#16262e" />
      <rect x="11" y="12" width="2" height="2" fill="#16262e" />
      <rect x="5" y="14" width="6" height="1" fill="#16262e" />
      {/* Disco dorado con brillo y relieve */}
      <rect x="5" y="2" width="6" height="12" fill="#fad24b" />
      <rect x="3" y="4" width="10" height="8" fill="#fad24b" />
      <rect x="5" y="2" width="5" height="2" fill="#fff8e6" />
      <rect x="3" y="4" width="2" height="4" fill="#fff8e6" />
      <rect x="11" y="5" width="2" height="7" fill="#d97706" />
      <rect x="5" y="12" width="6" height="2" fill="#d97706" />
      {/* Emblema central */}
      <rect x="7" y="5" width="2" height="6" fill="#b45309" />
      <rect x="6" y="5" width="1" height="5" fill="#fff8e6" />
    </svg>
  );
}

export function PixelShieldIcon({ size = 18, className }: PixelIconProps) {
  return (
    <svg {...baseProps(size, className)}>
      <rect x="3" y="1" width="10" height="1" fill="#16262e" />
      <rect x="2" y="2" width="1" height="6" fill="#16262e" />
      <rect x="13" y="2" width="1" height="6" fill="#16262e" />
      <rect x="3" y="8" width="1" height="3" fill="#16262e" />
      <rect x="12" y="8" width="1" height="3" fill="#16262e" />
      <rect x="4" y="11" width="2" height="2" fill="#16262e" />
      <rect x="10" y="11" width="2" height="2" fill="#16262e" />
      <rect x="6" y="13" width="4" height="2" fill="#16262e" />
      {/* Cuerpo azul cobalto 32-bit */}
      <rect x="3" y="2" width="10" height="6" fill="#1765cc" />
      <rect x="4" y="8" width="8" height="3" fill="#1765cc" />
      <rect x="6" y="11" width="4" height="2" fill="#10448f" />
      <rect x="3" y="2" width="5" height="6" fill="#3b82f6" />
      <rect x="3" y="2" width="4" height="2" fill="#60a5fa" />
      {/* Check dorado/crema */}
      <rect x="5" y="7" width="2" height="2" fill="#fff8e6" />
      <rect x="7" y="9" width="2" height="1" fill="#fff8e6" />
      <rect x="8" y="6" width="2" height="3" fill="#fff8e6" />
      <rect x="10" y="5" width="1" height="2" fill="#fff8e6" />
    </svg>
  );
}

export function PixelGiftIcon({ size = 18, className }: PixelIconProps) {
  return (
    <svg {...baseProps(size, className)}>
      {/* Moño verde esmeralda */}
      <rect x="4" y="1" width="3" height="3" fill="#16262e" />
      <rect x="9" y="1" width="3" height="3" fill="#16262e" />
      <rect x="5" y="2" width="2" height="2" fill="#24d04a" />
      <rect x="9" y="2" width="2" height="2" fill="#169c35" />
      {/* Tapa y caja */}
      <rect x="1" y="4" width="14" height="4" fill="#16262e" />
      <rect x="2" y="8" width="12" height="7" fill="#16262e" />
      <rect x="2" y="5" width="12" height="2" fill="#fad24b" />
      <rect x="2" y="5" width="5" height="1" fill="#fff8e6" />
      <rect x="3" y="8" width="10" height="6" fill="#fad24b" />
      <rect x="10" y="8" width="3" height="6" fill="#e89c1c" />
      {/* Cinta vertical azul + verde */}
      <rect x="7" y="4" width="2" height="10" fill="#1765cc" />
      <rect x="7" y="5" width="1" height="9" fill="#60a5fa" />
    </svg>
  );
}

export function PixelStepsIcon({ size = 18, className }: PixelIconProps) {
  return (
    <svg {...baseProps(size, className)}>
      {/* Tres barras ascendentes 32-bit */}
      <rect x="1" y="10" width="4" height="5" fill="#16262e" />
      <rect x="2" y="11" width="2" height="3" fill="#24d04a" />
      <rect x="6" y="6" width="4" height="9" fill="#16262e" />
      <rect x="7" y="7" width="2" height="7" fill="#1765cc" />
      <rect x="7" y="7" width="1" height="4" fill="#60a5fa" />
      <rect x="11" y="2" width="4" height="13" fill="#16262e" />
      <rect x="12" y="3" width="2" height="11" fill="#fad24b" />
      <rect x="12" y="3" width="1" height="5" fill="#fff8e6" />
    </svg>
  );
}

export function PixelTagIcon({ size = 18, className }: PixelIconProps) {
  return (
    <svg {...baseProps(size, className)}>
      <rect x="2" y="2" width="7" height="1" fill="#16262e" />
      <rect x="1" y="3" width="1" height="6" fill="#16262e" />
      <rect x="9" y="3" width="2" height="1" fill="#16262e" />
      <rect x="11" y="4" width="2" height="2" fill="#16262e" />
      <rect x="13" y="6" width="2" height="4" fill="#16262e" />
      <rect x="2" y="9" width="2" height="2" fill="#16262e" />
      <rect x="4" y="11" width="2" height="2" fill="#16262e" />
      <rect x="6" y="13" width="4" height="2" fill="#16262e" />
      <rect x="10" y="11" width="3" height="2" fill="#16262e" />
      <rect x="12" y="9" width="2" height="2" fill="#16262e" />
      {/* Cuerpo verde esmeralda */}
      <rect x="2" y="3" width="7" height="6" fill="#24d04a" />
      <rect x="4" y="5" width="7" height="6" fill="#169c35" />
      <rect x="6" y="7" width="7" height="5" fill="#169c35" />
      <rect x="6" y="11" width="4" height="2" fill="#0f6d25" />
      <rect x="2" y="3" width="5" height="2" fill="#86efac" />
      {/* Ojal dorado */}
      <rect x="4" y="5" width="2" height="2" fill="#16262e" />
      <rect x="4" y="5" width="1" height="1" fill="#fad24b" />
    </svg>
  );
}

export function PixelHelpIcon({ size = 18, className }: PixelIconProps) {
  return (
    <svg {...baseProps(size, className)}>
      {/* Burbuja de diálogo azul */}
      <rect x="2" y="1" width="12" height="1" fill="#16262e" />
      <rect x="1" y="2" width="1" height="9" fill="#16262e" />
      <rect x="14" y="2" width="1" height="9" fill="#16262e" />
      <rect x="2" y="11" width="3" height="1" fill="#16262e" />
      <rect x="8" y="11" width="6" height="1" fill="#16262e" />
      <rect x="4" y="12" width="2" height="3" fill="#16262e" />
      <rect x="6" y="12" width="2" height="2" fill="#16262e" />
      {/* Relleno cobalto 32-bit */}
      <rect x="2" y="2" width="12" height="9" fill="#1765cc" />
      <rect x="2" y="2" width="12" height="2" fill="#3b82f6" />
      <rect x="5" y="11" width="2" height="2" fill="#1765cc" />
      {/* Signo ? dorado brillante */}
      <rect x="6" y="3" width="4" height="1" fill="#fad24b" />
      <rect x="5" y="4" width="2" height="1" fill="#fff8e6" />
      <rect x="9" y="4" width="2" height="2" fill="#fad24b" />
      <rect x="7" y="6" width="2" height="2" fill="#fad24b" />
      <rect x="7" y="9" width="2" height="1" fill="#fff8e6" />
    </svg>
  );
}
