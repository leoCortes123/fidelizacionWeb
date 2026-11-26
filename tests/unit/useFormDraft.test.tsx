import { act, renderHook } from "@testing-library/react";
import { useFormDraft } from "@/lib/useFormDraft";

interface Draft {
  amount: string;
  note: string;
}

describe("useFormDraft", () => {
  it("guarda y recupera un borrador", () => {
    const { result } = renderHook(() => useFormDraft<Draft>({ key: "test-form", version: 1 }));

    act(() => result.current.save({ amount: "15000", note: "hola" }));

    expect(result.current.hasDraft).toBe(true);

    const { result: restored } = renderHook(() =>
      useFormDraft<Draft>({ key: "test-form", version: 1 }),
    );

    expect(restored.current.read()).toEqual({ amount: "15000", note: "hola" });
  });

  it("descarta borradores de otra versión", () => {
    const { result } = renderHook(() => useFormDraft<Draft>({ key: "versioned", version: 1 }));
    act(() => result.current.save({ amount: "1", note: "" }));

    const { result: nextVersion } = renderHook(() =>
      useFormDraft<Draft>({ key: "versioned", version: 2 }),
    );

    expect(nextVersion.current.read()).toBeNull();
    expect(localStorage.getItem("fideliapp:draft:versioned")).toBeNull();
  });

  it("limpia el borrador al guardar el formulario", () => {
    const { result } = renderHook(() => useFormDraft<Draft>({ key: "clear-me" }));
    act(() => result.current.save({ amount: "10", note: "" }));
    act(() => result.current.clear());

    expect(result.current.hasDraft).toBe(false);
    expect(result.current.read()).toBeNull();
  });

  it("puede usar sessionStorage para datos de caja", () => {
    const { result } = renderHook(() =>
      useFormDraft<Draft>({ key: "session-form", storage: "session" }),
    );
    act(() => result.current.save({ amount: "20", note: "" }));

    expect(sessionStorage.getItem("fideliapp:draft:session-form")).toContain("20");
    expect(localStorage.getItem("fideliapp:draft:session-form")).toBeNull();
  });

  it("migra una sola vez un borrador heredado a fideliapp:draft:* y borra la clave vieja", () => {
    localStorage.setItem(
      "loopoint:draft:migrated",
      JSON.stringify({ version: 1, savedAt: Date.now(), value: { amount: "50", note: "legacy" } }),
    );

    const { result } = renderHook(() => useFormDraft<Draft>({ key: "migrated", version: 1 }));

    expect(result.current.hasDraft).toBe(true);
    expect(result.current.read()).toEqual({ amount: "50", note: "legacy" });
    expect(localStorage.getItem("fideliapp:draft:migrated")).toContain("legacy");
    expect(localStorage.getItem("loopoint:draft:migrated")).toBeNull();
  });

  it("conserva el borrador heredado si setItem falla al migrar (ej. QuotaExceededError)", () => {
    const payload = JSON.stringify({
      version: 1,
      savedAt: Date.now(),
      value: { amount: "75", note: "safe" },
    });
    localStorage.setItem("loopoint:draft:quota", payload);
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("QuotaExceededError", "QuotaExceededError");
    });

    try {
      const { result } = renderHook(() => useFormDraft<Draft>({ key: "quota", version: 1 }));
      expect(result.current.read()).toEqual({ amount: "75", note: "safe" });
      expect(localStorage.getItem("loopoint:draft:quota")).toBe(payload);
    } finally {
      setItemSpy.mockRestore();
    }
  });
});
