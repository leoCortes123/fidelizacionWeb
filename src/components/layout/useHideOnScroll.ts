import { useEffect, useState, type RefObject } from "react";

interface Options {
  /** Desplazamiento mínimo para cambiar de estado. */
  threshold?: number;
  /** Zona superior donde la barra siempre se muestra. */
  alwaysVisibleBelow?: number;
  /**
   * Ancho mínimo (px) a partir del cual se permite ocultar la barra.
   * En pantallas más angostas (móvil) la barra permanece fija.
   */
  minWidth?: number;
}

/**
 * Oculta la barra superior al desplazarse hacia abajo y la muestra al subir.
 * Escucha el contenedor real de scroll (no `window`) para el layout de altura
 * completa con menú fijo.
 *
 * En móvil la barra no se oculta: se mantiene siempre visible.
 */
export function useHideOnScroll(
  containerRef: RefObject<HTMLElement | null>,
  { threshold = 8, alwaysVisibleBelow = 56, minWidth = 768 }: Options = {},
) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const media =
      typeof window.matchMedia === "function"
        ? window.matchMedia(`(min-width: ${minWidth}px)`)
        : null;

    let lastTop = element.scrollTop;
    let frame = 0;

    const onScroll = () => {
      // En móvil la barra permanece siempre visible.
      if (media && !media.matches) {
        setHidden(false);
        lastTop = element.scrollTop;
        return;
      }

      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const top = element.scrollTop;

        if (top <= alwaysVisibleBelow) {
          setHidden(false);
          lastTop = top;
          return;
        }

        const delta = top - lastTop;
        if (Math.abs(delta) < threshold) return;
        setHidden(delta > 0);
        lastTop = top;
      });
    };

    const onMediaChange = () => {
      lastTop = element.scrollTop;
      setHidden(false);
    };

    element.addEventListener("scroll", onScroll, { passive: true });
    media?.addEventListener("change", onMediaChange);
    return () => {
      element.removeEventListener("scroll", onScroll);
      media?.removeEventListener("change", onMediaChange);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [alwaysVisibleBelow, containerRef, minWidth, threshold]);

  return hidden;
}
