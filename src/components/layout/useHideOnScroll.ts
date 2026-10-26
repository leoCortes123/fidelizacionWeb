import { useEffect, useState, type RefObject } from 'react';

interface Options {
  /** Desplazamiento mínimo para cambiar de estado. */
  threshold?: number;
  /** Zona superior donde la barra siempre se muestra. */
  alwaysVisibleBelow?: number;
}

/**
 * Oculta la barra superior al desplazarse hacia abajo y la muestra al subir.
 * Escucha el contenedor real de scroll (no `window`) para el layout de altura
 * completa con menú fijo.
 */
export function useHideOnScroll(
  containerRef: RefObject<HTMLElement | null>,
  { threshold = 8, alwaysVisibleBelow = 56 }: Options = {},
) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    let lastTop = element.scrollTop;
    let frame = 0;

    const onScroll = () => {
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

    element.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      element.removeEventListener('scroll', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [alwaysVisibleBelow, containerRef, threshold]);

  return hidden;
}
