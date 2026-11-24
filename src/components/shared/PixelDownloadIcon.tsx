export interface PixelIconProps {
  size?: number;
  className?: string;
}

export function PixelDownloadIcon({ size = 18, className }: PixelIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      shapeRendering="crispEdges"
      className={className ? `px-icon ${className}` : "px-icon"}
      aria-hidden="true"
      focusable="false"
    >
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
