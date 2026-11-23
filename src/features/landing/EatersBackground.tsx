import { useEffect, useRef } from "react";

export interface EatersBackgroundProps {
  /** Permite pausar externamente el bucle de animación del fondo. */
  paused?: boolean;
}

interface EatersPalette {
  tile: string;
  eaten: string;
  heads: [string, string, string];
}

interface EatersController {
  setUserPaused: (paused: boolean) => void;
  destroy: () => void;
}

const DX = [-1, 0, 1, -1, 1, -1, 0, 1] as const;
const DY = [-1, -1, -1, 0, 0, 1, 1, 1] as const;

const GUTTER = 1;
/**
 * Ritmo ambiental muy pausado (1133–2333 ms por paso, -25% velocidad) e inicio ya
 * propagado por todo el lienzo para acompañar el fondo sin concentrar ni distraer
 * la mirada respecto a los textos y la animación principal (WCAG 2.3.1).
 */
const MIN_STEP_INTERVAL_MS = 1133;
const MAX_STEP_INTERVAL_MS = 2333;
const REGROW_TRIGGER_RATIO = 0.92;
const REGROW_STOP_RATIO = 0.25;
const REGROW_STEP_MS = 427;
const INITIAL_EATEN_TARGET_RATIO = 0.48;
const MAX_PREWARM_ROUNDS = 45;
const RESIZE_DEBOUNCE_MS = 150;
const MAX_FRAME_DELTA_MS = 100;

const DEFAULT_PALETTE: EatersPalette = {
  tile: "rgba(166, 191, 202, 0.26)",
  eaten: "rgba(255, 255, 255, 0.48)",
  heads: ["rgba(110, 146, 162, 0.26)", "rgba(250, 210, 75, 0.34)", "rgba(23, 101, 204, 0.15)"],
};

function readPaletteFromCanvas(canvasEl: HTMLCanvasElement): EatersPalette {
  const cs = window.getComputedStyle(canvasEl);
  return {
    tile: cs.color || DEFAULT_PALETTE.tile,
    eaten: cs.borderTopColor || DEFAULT_PALETTE.eaten,
    heads: [
      cs.borderRightColor || DEFAULT_PALETTE.heads[0],
      cs.borderBottomColor || DEFAULT_PALETTE.heads[1],
      cs.borderLeftColor || DEFAULT_PALETTE.heads[2],
    ],
  };
}

function palettesEqual(a: EatersPalette, b: EatersPalette): boolean {
  return (
    a.tile === b.tile &&
    a.eaten === b.eaten &&
    a.heads[0] === b.heads[0] &&
    a.heads[1] === b.heads[1] &&
    a.heads[2] === b.heads[2]
  );
}

function createEatersEngine(
  layerEl: HTMLDivElement,
  canvasEl: HTMLCanvasElement,
  initialPaused: boolean,
): EatersController | null {
  let ctx: CanvasRenderingContext2D | null = null;
  try {
    ctx = canvasEl.getContext("2d", { alpha: true });
  } catch {
    return null;
  }
  if (!ctx) return null;

  const context2d = ctx;
  const reducedMotionMql =
    typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-reduced-motion: reduce)")
      : null;
  const darkSchemeMql =
    typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-color-scheme: dark)")
      : null;
  const forcedColorsMql =
    typeof window.matchMedia === "function" ? window.matchMedia("(forced-colors: active)") : null;

  let viewportW = 0;
  let viewportH = 0;
  let tileSize = 48;
  let cols = 0;
  let rows = 0;
  let total = 0;

  let cells = new Uint8Array(0);
  let occupancy = new Uint8Array(0);
  let headVariant = new Uint8Array(0);
  let dirtyFlag = new Uint8Array(0);
  let dirtyList = new Int32Array(0);
  let dirtyCount = 0;
  let eatenCount = 0;

  let regrowOrder = new Int32Array(0);
  let regrowing = false;
  let regrowCursor = 0;
  let regrowAccum = 0;

  let walkerCount = 0;
  let wRow = new Int16Array(0);
  let wCol = new Int16Array(0);
  let wInterval = new Float32Array(0);
  let wElapsed = new Float32Array(0);
  let wVariant = new Uint8Array(0);

  let palette: EatersPalette = DEFAULT_PALETTE;
  let reducedMotion = Boolean(reducedMotionMql?.matches);
  let userPaused = initialPaused;
  let forcedColors = Boolean(forcedColorsMql?.matches);
  let tabHidden = typeof document !== "undefined" ? document.hidden : false;
  let contentSkipped = false;
  let rafId: number | null = null;
  let lastTs = 0;
  let resizeTimer: number | null = null;
  let destroyed = false;

  function markDirty(idx: number) {
    if (dirtyFlag[idx] === 0) {
      dirtyFlag[idx] = 1;
      dirtyList[dirtyCount++] = idx;
    }
  }

  function drawCell(idx: number) {
    const row = (idx / cols) | 0;
    const col = idx - row * cols;
    const x = col * tileSize + GUTTER;
    const y = row * tileSize + GUTTER;
    const size = tileSize - GUTTER;

    context2d.clearRect(x, y, size, size);
    if (occupancy[idx] > 0) {
      context2d.fillStyle = palette.heads[headVariant[idx] as 0 | 1 | 2];
    } else if (cells[idx] === 0) {
      context2d.fillStyle = palette.tile;
    } else {
      context2d.fillStyle = palette.eaten;
    }
    context2d.fillRect(x, y, size, size);
  }

  function flushDirty() {
    for (let i = 0; i < dirtyCount; i++) {
      const idx = dirtyList[i];
      dirtyFlag[idx] = 0;
      drawCell(idx);
    }
    dirtyCount = 0;
  }

  function redrawAll() {
    context2d.clearRect(0, 0, viewportW, viewportH);
    if (forcedColors) return;
    const size = tileSize - GUTTER;

    // 1) Celdas sin comer en un solo batch
    context2d.fillStyle = palette.tile;
    for (let i = 0; i < total; i++) {
      if (occupancy[i] === 0 && cells[i] === 0) {
        const row = (i / cols) | 0;
        const col = i - row * cols;
        context2d.fillRect(col * tileSize + GUTTER, row * tileSize + GUTTER, size, size);
      }
    }

    // 2) Celdas comidas en un solo batch
    context2d.fillStyle = palette.eaten;
    for (let i = 0; i < total; i++) {
      if (occupancy[i] === 0 && cells[i] === 1) {
        const row = (i / cols) | 0;
        const col = i - row * cols;
        context2d.fillRect(col * tileSize + GUTTER, row * tileSize + GUTTER, size, size);
      }
    }

    // 3) Cabezas activas agrupadas por variante de paleta (slate / dorado / azul)
    for (let v = 0; v < 3; v++) {
      context2d.fillStyle = palette.heads[v as 0 | 1 | 2];
      for (let i = 0; i < total; i++) {
        if (occupancy[i] > 0 && headVariant[i] === v) {
          const row = (i / cols) | 0;
          const col = i - row * cols;
          context2d.fillRect(col * tileSize + GUTTER, row * tileSize + GUTTER, size, size);
        }
      }
    }
  }

  function shuffleRegrowOrder() {
    if (regrowOrder.length !== total) {
      regrowOrder = new Int32Array(total);
      for (let i = 0; i < total; i++) {
        regrowOrder[i] = i;
      }
    }
    // Orden aleatorio (Fisher-Yates) para regenerar celdas de forma distribuida sin focalizar en el centro
    for (let i = total - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      const tmp = regrowOrder[i];
      regrowOrder[i] = regrowOrder[j];
      regrowOrder[j] = tmp;
    }
  }

  function stepWalker(i: number, recordDirty: boolean) {
    const oldRow = wRow[i];
    const oldCol = wCol[i];
    const oldIdx = oldRow * cols + oldCol;

    if (occupancy[oldIdx] > 0) occupancy[oldIdx]--;
    if (cells[oldIdx] === 0) {
      cells[oldIdx] = 1;
      eatenCount++;
    }

    let newRow = oldRow;
    let newCol = oldCol;
    let picked = false;

    // 25% exploración hacia vecinos sin comer para abrir corredores orgánicos
    if (!regrowing && eatenCount < total && Math.random() < 0.25) {
      const startDir = (Math.random() * 8) | 0;
      for (let k = 0; k < 8; k++) {
        const dir = (startDir + k) & 7;
        const nr = oldRow + DY[dir];
        const nc = oldCol + DX[dir];
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && cells[nr * cols + nc] === 0) {
          newRow = nr;
          newCol = nc;
          picked = true;
          break;
        }
      }
    }

    // 75% caminata aleatoria de 8 vecinos con rebote suave en los límites
    if (!picked) {
      const dir = (Math.random() * 8) | 0;
      let nr = oldRow + DY[dir];
      let nc = oldCol + DX[dir];
      if (nr < 0) nr = rows > 1 ? 1 : 0;
      else if (nr >= rows) nr = rows > 1 ? rows - 2 : 0;
      if (nc < 0) nc = cols > 1 ? 1 : 0;
      else if (nc >= cols) nc = cols > 1 ? cols - 2 : 0;
      newRow = nr;
      newCol = nc;
    }

    const newIdx = newRow * cols + newCol;
    wRow[i] = newRow;
    wCol[i] = newCol;
    occupancy[newIdx]++;
    headVariant[newIdx] = wVariant[i];

    if (recordDirty) {
      markDirty(oldIdx);
      markDirty(newIdx);
    }
  }

  function measureViewport() {
    return {
      width: Math.max(1, layerEl.clientWidth || window.innerWidth || 1024),
      height: Math.max(1, layerEl.clientHeight || window.innerHeight || 768),
    };
  }

  function resetGrid() {
    const measured = measureViewport();
    viewportW = measured.width;
    viewportH = measured.height;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvasEl.width = Math.floor(viewportW * dpr);
    canvasEl.height = Math.floor(viewportH * dpr);
    context2d.setTransform(dpr, 0, 0, dpr, 0, 0);

    // 48px (2 × 24px de la retícula CSS) en escritorio, 36px en móvil
    tileSize = Math.min(viewportW, viewportH) >= 640 ? 48 : 36;
    cols = Math.max(1, Math.ceil(viewportW / tileSize));
    rows = Math.max(1, Math.ceil(viewportH / tileSize));
    total = cols * rows;

    cells = new Uint8Array(total);
    occupancy = new Uint8Array(total);
    headVariant = new Uint8Array(total);
    dirtyFlag = new Uint8Array(total);
    dirtyList = new Int32Array(total);
    dirtyCount = 0;
    eatenCount = 0;
    regrowing = false;
    regrowCursor = 0;
    regrowAccum = 0;

    shuffleRegrowOrder();

    walkerCount = Math.max(8, Math.min(18, Math.round(total / 34)));
    wRow = new Int16Array(walkerCount);
    wCol = new Int16Array(walkerCount);
    wInterval = new Float32Array(walkerCount);
    wElapsed = new Float32Array(walkerCount);
    wVariant = new Uint8Array(walkerCount);

    // Distribución estratificada inicial por todo el viewport (sin brote concentrado en el centro)
    const strataCols = Math.max(
      1,
      Math.min(walkerCount, Math.ceil(Math.sqrt(walkerCount * (cols / Math.max(1, rows))))),
    );
    const strataRows = Math.max(1, Math.ceil(walkerCount / strataCols));

    for (let i = 0; i < walkerCount; i++) {
      const sRow = Math.floor(i / strataCols);
      const sCol = i % strataCols;
      const rowStart = Math.floor((sRow * rows) / strataRows);
      const rowEnd = Math.max(rowStart + 1, Math.floor(((sRow + 1) * rows) / strataRows));
      const colStart = Math.floor((sCol * cols) / strataCols);
      const colEnd = Math.max(colStart + 1, Math.floor(((sCol + 1) * cols) / strataCols));

      const startRow = Math.min(
        rows - 1,
        rowStart + Math.floor(Math.random() * (rowEnd - rowStart)),
      );
      const startCol = Math.min(
        cols - 1,
        colStart + Math.floor(Math.random() * (colEnd - colStart)),
      );
      const startIdx = startRow * cols + startCol;

      wRow[i] = startRow;
      wCol[i] = startCol;
      wInterval[i] =
        MIN_STEP_INTERVAL_MS + Math.random() * (MAX_STEP_INTERVAL_MS - MIN_STEP_INTERVAL_MS);
      wElapsed[i] = Math.random() * wInterval[i];
      // Distribución armónica con la paleta 65/25/10: ~75% slate, ~18% dorado, ~7% azul
      wVariant[i] = i % 13 === 0 ? 2 : i % 5 === 0 ? 1 : 0;
      occupancy[startIdx]++;
      headVariant[startIdx] = wVariant[i];
    }

    // Pre-simulación silenciosa hasta alcanzar una propagación orgánica (~48% del lienzo)
    const targetEaten = Math.floor(total * INITIAL_EATEN_TARGET_RATIO);
    for (let round = 0; round < MAX_PREWARM_ROUNDS && eatenCount < targetEaten; round++) {
      for (let i = 0; i < walkerCount; i++) {
        stepWalker(i, false);
      }
    }

    palette = readPaletteFromCanvas(canvasEl);
    redrawAll();
  }

  function shouldRun() {
    return (
      !destroyed && !forcedColors && !reducedMotion && !userPaused && !tabHidden && !contentSkipped
    );
  }

  function tick(ts: number) {
    rafId = null;
    if (!shouldRun()) return;

    const dt = lastTs ? Math.max(0, Math.min(ts - lastTs, MAX_FRAME_DELTA_MS)) : 16.67;
    lastTs = ts;

    for (let i = 0; i < walkerCount; i++) {
      wElapsed[i] += dt;
      if (wElapsed[i] >= wInterval[i]) {
        wElapsed[i] -= wInterval[i];
        stepWalker(i, true);
      }
    }

    if (!regrowing && eatenCount >= total * REGROW_TRIGGER_RATIO) {
      regrowing = true;
      regrowCursor = 0;
      regrowAccum = 0;
      shuffleRegrowOrder();
    }

    if (regrowing) {
      regrowAccum += dt;
      while (regrowAccum >= REGROW_STEP_MS) {
        regrowAccum -= REGROW_STEP_MS;
        let restored = 0;
        while (regrowCursor < total && restored < 1) {
          const idx = regrowOrder[regrowCursor++];
          if (cells[idx] === 1 && occupancy[idx] === 0) {
            cells[idx] = 0;
            eatenCount--;
            markDirty(idx);
            restored++;
          }
        }
        if (regrowCursor >= total || eatenCount <= total * REGROW_STOP_RATIO) {
          regrowing = false;
          break;
        }
      }
    }

    if (dirtyCount > 0) {
      flushDirty();
    }

    rafId = window.requestAnimationFrame(tick);
  }

  function syncLoop() {
    if (shouldRun()) {
      if (rafId === null) {
        lastTs = 0;
        rafId = window.requestAnimationFrame(tick);
      }
    } else if (rafId !== null) {
      window.cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  function refreshThemePalette() {
    if (destroyed || forcedColors) return;
    const nextPalette = readPaletteFromCanvas(canvasEl);
    if (!palettesEqual(palette, nextPalette)) {
      palette = nextPalette;
      redrawAll();
    }
  }

  const onVisibilityChange = () => {
    tabHidden = document.hidden;
    syncLoop();
  };

  const onContentVisibilityChange: EventListener = (event) => {
    const skipped = (event as Event & { skipped?: boolean }).skipped;
    contentSkipped = Boolean(skipped);
    syncLoop();
  };

  const onReducedMotionChange = (event: MediaQueryListEvent) => {
    reducedMotion = event.matches;
    syncLoop();
  };

  const onForcedColorsChange = (event: MediaQueryListEvent) => {
    forcedColors = event.matches;
    if (forcedColors) {
      context2d.clearRect(0, 0, viewportW, viewportH);
    } else if (total === 0) {
      resetGrid();
    } else {
      palette = readPaletteFromCanvas(canvasEl);
      redrawAll();
    }
    syncLoop();
  };

  const onDarkSchemeChange = () => {
    refreshThemePalette();
  };

  const onResize = () => {
    if (resizeTimer !== null) window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      resizeTimer = null;
      if (destroyed) return;
      const measured = measureViewport();
      if (measured.width !== viewportW || Math.abs(measured.height - viewportH) > 40) {
        resetGrid();
        syncLoop();
      }
    }, RESIZE_DEBOUNCE_MS);
  };

  document.addEventListener("visibilitychange", onVisibilityChange);
  window.addEventListener("resize", onResize, { passive: true });
  reducedMotionMql?.addEventListener?.("change", onReducedMotionChange);
  darkSchemeMql?.addEventListener?.("change", onDarkSchemeChange);
  forcedColorsMql?.addEventListener?.("change", onForcedColorsChange);

  let intersectionObserver: IntersectionObserver | null = null;
  const supportsContentVisibility =
    typeof document !== "undefined" && "contentVisibility" in document.documentElement.style;
  if (supportsContentVisibility) {
    layerEl.addEventListener("contentvisibilityautostatechange", onContentVisibilityChange);
  } else if (typeof IntersectionObserver === "function") {
    intersectionObserver = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        contentSkipped = !entry.isIntersecting;
        syncLoop();
      },
      { rootMargin: "200px" },
    );
    intersectionObserver.observe(layerEl);
  }

  let themeObserver: MutationObserver | null = null;
  if (typeof MutationObserver === "function") {
    themeObserver = new MutationObserver(() => {
      refreshThemePalette();
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "style"],
    });
  }

  if (!forcedColors) {
    resetGrid();
    syncLoop();
  }

  return {
    setUserPaused(nextPaused: boolean) {
      userPaused = nextPaused;
      syncLoop();
    },
    destroy() {
      destroyed = true;
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
        rafId = null;
      }
      if (resizeTimer !== null) {
        window.clearTimeout(resizeTimer);
        resizeTimer = null;
      }
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("resize", onResize);
      reducedMotionMql?.removeEventListener?.("change", onReducedMotionChange);
      darkSchemeMql?.removeEventListener?.("change", onDarkSchemeChange);
      forcedColorsMql?.removeEventListener?.("change", onForcedColorsChange);
      if (supportsContentVisibility) {
        layerEl.removeEventListener("contentvisibilityautostatechange", onContentVisibilityChange);
      }
      intersectionObserver?.disconnect();
      themeObserver?.disconnect();
    },
  };
}

/**
 * Fondo animado "Eaters" adaptado en Canvas 2D para la landing page.
 * Sincronizado con los modos claro y oscuro, pausa/reproducción,
 * alto contraste (forced-colors) y ahorro energético.
 */
export function EatersBackground({ paused = false }: EatersBackgroundProps) {
  const layerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const controllerRef = useRef<EatersController | null>(null);
  const initialPausedRef = useRef(paused);
  const prevPausedRef = useRef(paused);

  useEffect(() => {
    const layerEl = layerRef.current;
    const canvasEl = canvasRef.current;
    if (!layerEl || !canvasEl) return;

    const controller = createEatersEngine(layerEl, canvasEl, initialPausedRef.current);
    controllerRef.current = controller;

    return () => {
      controllerRef.current = null;
      controller?.destroy();
    };
  }, []);

  useEffect(() => {
    if (prevPausedRef.current === paused) return;
    prevPausedRef.current = paused;
    controllerRef.current?.setUserPaused(paused);
  }, [paused]);

  return (
    <div ref={layerRef} className="eaters-bg-layer" aria-hidden="true">
      <canvas ref={canvasRef} className="eaters-canvas" />
    </div>
  );
}
