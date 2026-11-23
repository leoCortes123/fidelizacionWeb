import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from "vitest";
import { act, render } from "@testing-library/react";
import { EatersBackground } from "@/features/landing/EatersBackground";

interface MockContext2D {
  fillStyle: string;
  clearRect: ReturnType<typeof vi.fn>;
  fillRect: ReturnType<typeof vi.fn>;
  setTransform: ReturnType<typeof vi.fn>;
}

function createMockContext2D(): MockContext2D {
  return {
    fillStyle: "",
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    setTransform: vi.fn(),
  };
}

function mockMatchMedia(predicate: (query: string) => boolean) {
  return vi.spyOn(window, "matchMedia").mockImplementation(
    (query: string) =>
      ({
        matches: predicate(query),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }) as unknown as MediaQueryList,
  );
}

describe("EatersBackground", () => {
  let mockCtx: MockContext2D;
  let rafSpy: MockInstance<(callback: FrameRequestCallback) => number>;
  let cancelRafSpy: MockInstance<(handle: number) => void>;
  let getContextSpy: MockInstance<typeof HTMLCanvasElement.prototype.getContext>;
  let rafCallbacks: Map<number, FrameRequestCallback>;
  let nextRafId = 1;

  beforeEach(() => {
    mockCtx = createMockContext2D();
    rafCallbacks = new Map();
    nextRafId = 1;

    getContextSpy = vi
      .spyOn(HTMLCanvasElement.prototype, "getContext")
      .mockReturnValue(mockCtx as unknown as CanvasRenderingContext2D);

    rafSpy = vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
      const id = nextRafId++;
      rafCallbacks.set(id, cb);
      return id;
    });
    cancelRafSpy = vi.spyOn(window, "cancelAnimationFrame").mockImplementation((id) => {
      rafCallbacks.delete(id);
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    getContextSpy.mockRestore();
    rafSpy.mockRestore();
    cancelRafSpy.mockRestore();
    document.documentElement.classList.remove("dark");
    Object.defineProperty(document, "hidden", { configurable: true, value: false });
  });

  it("renderiza el canvas decorativo, dibuja la grilla inicial e inicia el bucle rAF", () => {
    const { container, unmount } = render(<EatersBackground />);

    const layer = container.querySelector(".eaters-bg-layer");
    const canvas = container.querySelector("canvas.eaters-canvas");
    expect(layer).toHaveAttribute("aria-hidden", "true");
    expect(canvas).toBeInTheDocument();
    expect(mockCtx.setTransform).toHaveBeenCalled();
    expect(mockCtx.fillRect).toHaveBeenCalled();
    expect(rafSpy).toHaveBeenCalledTimes(1);

    unmount();
    expect(cancelRafSpy).toHaveBeenCalledWith(1);
  });

  it("inicia ya propagado por todo el lienzo (celdas comidas y sin comer desde el primer pintado)", () => {
    const paintedStyles = new Set<string>();
    mockCtx.fillRect.mockImplementation(() => {
      paintedStyles.add(mockCtx.fillStyle);
    });

    const styleSpy = vi.spyOn(window, "getComputedStyle").mockImplementation(
      () =>
        ({
          color: "rgba(166, 191, 202, 0.26)",
          borderTopColor: "rgba(255, 255, 255, 0.48)",
          borderRightColor: "rgba(110, 146, 162, 0.26)",
          borderBottomColor: "rgba(250, 210, 75, 0.34)",
          borderLeftColor: "rgba(23, 101, 204, 0.15)",
        }) as unknown as CSSStyleDeclaration,
    );

    try {
      render(<EatersBackground paused={true} />);
      // Debe dibujar tanto celdas sin comer como celdas comidas y cabezas activas desde el inicio
      expect(paintedStyles.has("rgba(166, 191, 202, 0.26)")).toBe(true);
      expect(paintedStyles.has("rgba(255, 255, 255, 0.48)")).toBe(true);
      expect(paintedStyles.has("rgba(110, 146, 162, 0.26)")).toBe(true);
    } finally {
      styleSpy.mockRestore();
    }
  });

  it("avanza walkers y ejecuta repintado incremental dirty-tile al disparar frames rAF", () => {
    render(<EatersBackground />);
    mockCtx.clearRect.mockClear();
    mockCtx.fillRect.mockClear();

    // Avanza suficientes ticks (100 ms max delta × 20 = 2000 ms > MAX_STEP_INTERVAL_MS)
    let ts = 100;
    for (let step = 0; step < 20; step++) {
      const pending = Array.from(rafCallbacks.entries());
      rafCallbacks.clear();
      for (const [, cb] of pending) {
        cb(ts);
      }
      ts += 100;
    }

    expect(mockCtx.clearRect).toHaveBeenCalled();
    expect(mockCtx.fillRect).toHaveBeenCalled();
  });

  it("pausa y reanuda el bucle rAF al cambiar la prop paused sin reinicializar", () => {
    const { rerender } = render(<EatersBackground paused={false} />);
    expect(rafSpy).toHaveBeenCalledTimes(1);

    rerender(<EatersBackground paused={true} />);
    expect(cancelRafSpy).toHaveBeenCalledWith(1);

    rerender(<EatersBackground paused={false} />);
    expect(rafSpy).toHaveBeenCalledTimes(2);
  });

  it("pausa cuando la pestaña queda oculta (visibilitychange) y reanuda al volver", () => {
    render(<EatersBackground />);
    expect(rafSpy).toHaveBeenCalledTimes(1);

    Object.defineProperty(document, "hidden", { configurable: true, value: true });
    document.dispatchEvent(new Event("visibilitychange"));
    expect(cancelRafSpy).toHaveBeenCalledWith(1);

    Object.defineProperty(document, "hidden", { configurable: true, value: false });
    document.dispatchEvent(new Event("visibilitychange"));
    expect(rafSpy).toHaveBeenCalledTimes(2);
  });

  it("no programa requestAnimationFrame cuando prefers-reduced-motion: reduce está activo", () => {
    const mqlSpy = mockMatchMedia((q) => q === "(prefers-reduced-motion: reduce)");
    try {
      render(<EatersBackground />);
      expect(mockCtx.fillRect).toHaveBeenCalled();
      expect(rafSpy).not.toHaveBeenCalled();
    } finally {
      mqlSpy.mockRestore();
    }
  });

  it("omite pintado y animación en modo alto contraste (forced-colors: active)", () => {
    const mqlSpy = mockMatchMedia((q) => q === "(forced-colors: active)");
    try {
      render(<EatersBackground />);
      expect(mockCtx.fillRect).not.toHaveBeenCalled();
      expect(rafSpy).not.toHaveBeenCalled();
    } finally {
      mqlSpy.mockRestore();
    }
  });

  it("repinta el canvas al cambiar los tokens resueltos tras alternar la clase dark", async () => {
    const styleSpy = vi.spyOn(window, "getComputedStyle").mockImplementation(
      () =>
        ({
          color: document.documentElement.classList.contains("dark")
            ? "rgba(56, 90, 104, 0.56)"
            : "rgba(166, 191, 202, 0.26)",
          borderTopColor: "rgba(255, 255, 255, 0.48)",
          borderRightColor: "rgba(110, 146, 162, 0.26)",
          borderBottomColor: "rgba(250, 210, 75, 0.34)",
          borderLeftColor: "rgba(23, 101, 204, 0.15)",
        }) as unknown as CSSStyleDeclaration,
    );

    try {
      render(<EatersBackground paused={true} />);
      const initialClears = mockCtx.clearRect.mock.calls.length;

      await act(async () => {
        document.documentElement.classList.add("dark");
        await Promise.resolve();
      });

      expect(mockCtx.clearRect.mock.calls.length).toBeGreaterThan(initialClears);
    } finally {
      styleSpy.mockRestore();
    }
  });

  it("cancela el timer debounced de resize al desmontar", () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    const { unmount } = render(<EatersBackground paused={true} />);
    const initialTransforms = mockCtx.setTransform.mock.calls.length;

    window.dispatchEvent(new Event("resize"));
    unmount();
    vi.advanceTimersByTime(300);

    expect(mockCtx.setTransform.mock.calls.length).toBe(initialTransforms);
  });

  it("tolera entornos sin soporte de contexto 2D sin lanzar errores", () => {
    getContextSpy.mockReturnValue(null);
    expect(() => render(<EatersBackground />)).not.toThrow();
    expect(rafSpy).not.toHaveBeenCalled();
  });
});
