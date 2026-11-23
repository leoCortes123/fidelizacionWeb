import { beforeEach, describe, expect, it, vi } from "vitest";
import { resolvePostLoginPath } from "@/lib/postLogin";
import { isNextPathCompatibleWithRoles } from "@/lib/config";
import { businessStorageKey } from "@/features/loyalty/businessContext";

const rpcMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase", () => ({
  rpc: rpcMock,
}));

describe("resolvePostLoginPath & role-compatible next paths", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  it("redirige a /admin/dashboard y persiste el negocio cuando el usuario es admin de 1 negocio", async () => {
    rpcMock.mockResolvedValue([
      { id: "biz-client", role: "cliente" },
      { id: "biz-admin", role: "admin" },
    ]);

    const path = await resolvePostLoginPath(["customer"], "user-1");

    expect(path).toBe("/admin/dashboard");
    expect(window.localStorage.getItem(businessStorageKey("user-1"))).toBe("biz-admin");
  });

  it("redirige a /encargado y persiste el negocio cuando el usuario es encargado", async () => {
    rpcMock.mockResolvedValue([{ id: "biz-enc", role: "encargado" }]);

    const path = await resolvePostLoginPath(["customer"], "user-enc");

    expect(path).toBe("/encargado");
    expect(window.localStorage.getItem(businessStorageKey("user-enc"))).toBe("biz-enc");
  });

  it("redirige a /business/select cuando tiene múltiples negocios operativos", async () => {
    rpcMock.mockResolvedValue([
      { id: "biz-1", role: "admin" },
      { id: "biz-2", role: "encargado" },
    ]);

    const path = await resolvePostLoginPath(["admin"], "user-multi");
    expect(path).toBe("/business/select");
  });

  it("redirige a /admin/onboarding cuando tiene rol admin global sin negocios creados", async () => {
    rpcMock.mockResolvedValue([]);

    const path = await resolvePostLoginPath(["admin"], "user-new-admin");
    expect(path).toBe("/admin/onboarding");
  });

  it("redirige a /customer cuando solo tiene membresías de cliente", async () => {
    rpcMock.mockResolvedValue([{ id: "biz-1", role: "cliente" }]);

    const path = await resolvePostLoginPath(["customer"], "user-cli");
    expect(path).toBe("/customer");
  });

  it("ignora next=/customer para admin/encargado y permite rutas específicas como /claim/...", () => {
    expect(isNextPathCompatibleWithRoles("/customer", ["admin"])).toBe(false);
    expect(isNextPathCompatibleWithRoles("/customer", ["encargado"])).toBe(false);
    expect(isNextPathCompatibleWithRoles("/admin/dashboard", ["customer"])).toBe(false);
    expect(isNextPathCompatibleWithRoles("/encargado", ["customer"])).toBe(false);
    expect(isNextPathCompatibleWithRoles("/claim/tok_123", ["admin"])).toBe(true);
    expect(isNextPathCompatibleWithRoles("/join/mi-cafe", ["customer"])).toBe(true);
    expect(isNextPathCompatibleWithRoles("/admin/rewards", ["admin"])).toBe(true);
    expect(isNextPathCompatibleWithRoles("/encargado/venta", ["registrar"])).toBe(true);
  });
});
