import { useState } from "react";
import { PixelPauseIcon, PixelPlayIcon } from "@/features/landing/PixelIcons";

export type PixelArtVariant = "qr" | "campaigns" | "economy" | "arcade";

export function inferArtVariant(src: string): PixelArtVariant {
  if (src.includes("campaigns")) return "campaigns";
  if (src.includes("economy")) return "economy";
  if (src.includes("arcade")) return "arcade";
  return "qr";
}

export interface AnimatedPixelArtProps {
  src: string;
  alt: string;
  variant?: PixelArtVariant;
  width?: number;
  height?: number;
  loading?: "eager" | "lazy";
  fetchPriority?: "high" | "low";
  className?: string;
  /** Permite pausar desde un control externo (ej. cuando la tarjeta completa es un enlace). */
  paused?: boolean;
  /** Muestra un botón compacto de pausa/reanudación sobre la esquina (desactivar dentro de <a>). */
  showToggle?: boolean;
}

/**
 * Ilustración pixel art 32-bit con movimiento sutil por CSS en hilo compositor
 * (translate/rotate/scale/opacity), micro-destellos temáticos y soporte completo
 * de prefers-reduced-motion y pausa manual (WCAG 2.2.2).
 */
export function AnimatedPixelArt({
  src,
  alt,
  variant,
  width = 640,
  height = 480,
  loading = "lazy",
  fetchPriority,
  className = "",
  paused: controlledPaused,
  showToggle = true,
}: AnimatedPixelArtProps) {
  const [localPaused, setLocalPaused] = useState(false);
  const isPaused = controlledPaused ?? localPaused;
  const resolvedVariant = variant ?? inferArtVariant(src);

  return (
    <div
      className={`pixel-art-stage pixel-art-variant-${resolvedVariant} ${
        isPaused ? "is-paused" : ""
      } ${className}`.trim()}
    >
      <div className="pixel-art-viewport">
        <img
          src={src}
          alt={alt}
          className="pixel-art-img pixel-art-motion-img"
          loading={loading}
          fetchPriority={fetchPriority}
          decoding="async"
          width={width}
          height={height}
        />

        {/* Capa decorativa de micro-animaciones CSS temáticas (hilo compositor, sin parpadeos) */}
        <div className="pixel-art-fx" aria-hidden="true">
          <span className="px-fx-sheen" />
          {resolvedVariant === "qr" && <span className="px-fx-scanline" />}
          <span className="px-fx-spark px-fx-spark-a" />
          <span className="px-fx-spark px-fx-spark-b" />
          <span className="px-fx-spark px-fx-spark-c" />
        </div>
      </div>

      {showToggle && controlledPaused === undefined && (
        <button
          type="button"
          className="pixel-art-toggle"
          onClick={() => setLocalPaused((prev) => !prev)}
          aria-label={
            isPaused
              ? "Reanudar movimiento de la ilustración"
              : "Pausar movimiento de la ilustración"
          }
          title={isPaused ? "Reanudar movimiento" : "Pausar movimiento"}
        >
          {isPaused ? <PixelPlayIcon size={12} /> : <PixelPauseIcon size={12} />}
        </button>
      )}
    </div>
  );
}
