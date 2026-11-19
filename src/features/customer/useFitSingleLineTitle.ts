import { useLayoutEffect, type DependencyList, type RefObject } from "react";

const MIN_TITLE_FIT_SCALE = 0.45;
const TEXT_FIT_DECLARATION = "shrink per-line-all 45%";

/**
 * Ajusta `--title-fit-scale` en un título de una sola línea para que quepa
 * en el espacio horizontal disponible sin agrandar su contenedor.
 */
export function useFitSingleLineTitle(
  titleRef: RefObject<HTMLElement | null>,
  containerRef: RefObject<HTMLElement | null>,
  deps: DependencyList,
) {
  useLayoutEffect(() => {
    const titleEl = titleRef.current;
    const containerEl = containerRef.current;
    if (!titleEl || !containerEl) return;
    if (
      typeof CSS !== "undefined" &&
      typeof CSS.supports === "function" &&
      CSS.supports("text-fit", TEXT_FIT_DECLARATION)
    ) {
      return;
    }

    const fitTitle = () => {
      // Restablecer a escala 1 antes de medir para evitar leer el tamaño ya reducido.
      titleEl.style.setProperty("--title-fit-scale", "1");
      const availableWidth = titleEl.clientWidth;
      const neededWidth = titleEl.scrollWidth;
      if (availableWidth <= 0 || neededWidth <= 0) return;
      const nextScale =
        neededWidth > availableWidth
          ? Math.max(MIN_TITLE_FIT_SCALE, availableWidth / neededWidth)
          : 1;
      titleEl.style.setProperty("--title-fit-scale", nextScale.toFixed(4));
    };

    fitTitle();

    let cancelled = false;
    const observer =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => fitTitle()) : null;
    observer?.observe(containerEl);

    if (typeof document !== "undefined" && document.fonts?.ready) {
      void document.fonts.ready.then(() => {
        if (!cancelled) fitTitle();
      });
    }

    return () => {
      cancelled = true;
      observer?.disconnect();
    };
  }, deps);
}
