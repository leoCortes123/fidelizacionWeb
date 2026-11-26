import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, act, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";

const { storageRemove, rpcMock } = vi.hoisted(() => ({
  storageRemove: vi.fn(),
  rpcMock: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    storage: {
      from: vi.fn(() => ({
        remove: storageRemove,
        upload: vi.fn(),
        getPublicUrl: vi.fn(),
      })),
    },
  },
  rpc: rpcMock,
}));

import {
  MAX_UPLOAD_BYTES,
  prepareImage,
  removeBusinessAssetPath,
  storagePathFromPublicUrl,
} from "@/lib/image";
import { useSetProfileAvatar } from "@/features/profile/hooks";
import {
  useSetBusinessLogo,
  useUpsertLoyaltyReward,
  useUpsertProduct,
} from "@/features/loyalty/hooks";

describe("image.ts — re-codificación canvas (EXIF) y limpieza en Storage", () => {
  const originalCreateImageBitmap = globalThis.createImageBitmap;
  const originalCreateElement = document.createElement.bind(document);

  let drawImageMock: ReturnType<typeof vi.fn>;
  let fillRectMock: ReturnType<typeof vi.fn>;
  let toBlobMock: ReturnType<typeof vi.fn>;
  let createdCanvases: Array<{ width: number; height: number }>;

  beforeEach(() => {
    vi.clearAllMocks();
    storageRemove.mockResolvedValue({ data: [], error: null });
    drawImageMock = vi.fn();
    fillRectMock = vi.fn();
    createdCanvases = [];

    toBlobMock = vi.fn((cb: BlobCallback, type?: string) => {
      cb(new Blob(["reencoded-pixels"], { type: type ?? "image/jpeg" }));
    });

    vi.spyOn(document, "createElement").mockImplementation(((tagName: string) => {
      if (tagName.toLowerCase() === "canvas") {
        const fakeCanvas = {
          width: 0,
          height: 0,
          getContext: vi.fn(() => ({
            drawImage: drawImageMock,
            save: vi.fn(),
            restore: vi.fn(),
            fillRect: fillRectMock,
            globalCompositeOperation: "source-over",
            fillStyle: "",
          })),
          toBlob: toBlobMock,
        };
        createdCanvases.push(fakeCanvas);
        return fakeCanvas as unknown as HTMLCanvasElement;
      }
      return originalCreateElement(tagName);
    }) as typeof document.createElement);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (originalCreateImageBitmap) {
      globalThis.createImageBitmap = originalCreateImageBitmap;
    } else {
      delete (globalThis as { createImageBitmap?: unknown }).createImageBitmap;
    }
  });

  function mockBitmap(width: number, height: number) {
    const close = vi.fn();
    globalThis.createImageBitmap = vi.fn().mockResolvedValue({
      width,
      height,
      close,
    }) as unknown as typeof createImageBitmap;
    return { close };
  }

  it("re-codifica SIEMPRE mediante canvas un JPEG pequeño (<= 2 MB y <= 1200 px) para eliminar EXIF/GPS", async () => {
    const { close } = mockBitmap(400, 300);
    const originalFile = new File(["fake-jpeg-with-exif-gps"], "selfie.jpg", {
      type: "image/jpeg",
    });

    const result = await prepareImage(originalFile);

    expect(createdCanvases).toHaveLength(1);
    expect(createdCanvases[0].width).toBe(400);
    expect(createdCanvases[0].height).toBe(300);
    expect(drawImageMock).toHaveBeenCalledTimes(1);
    expect(toBlobMock).toHaveBeenCalledWith(expect.any(Function), "image/jpeg", 0.85);
    expect(result.blob).not.toBe(originalFile);
    expect(result.extension).toBe("jpg");
    expect(result.contentType).toBe("image/jpeg");
    expect(close).toHaveBeenCalledTimes(1);
  });

  it("re-codifica un PNG pequeño mediante canvas y conserva formato PNG si cabe en 2 MB", async () => {
    mockBitmap(320, 320);
    const originalFile = new File(["fake-png-with-text-chunks"], "logo.png", {
      type: "image/png",
    });

    const result = await prepareImage(originalFile);

    expect(drawImageMock).toHaveBeenCalledTimes(1);
    expect(toBlobMock).toHaveBeenCalledWith(expect.any(Function), "image/png", undefined);
    expect(result.blob).not.toBe(originalFile);
    expect(result.extension).toBe("png");
    expect(result.contentType).toBe("image/png");
  });

  it("convierte PNG grande (> 2 MB) a JPEG con fondo blanco", async () => {
    mockBitmap(800, 600);
    toBlobMock.mockImplementation((cb: BlobCallback, type?: string) => {
      if (type === "image/png") {
        cb(new Blob([new Uint8Array(MAX_UPLOAD_BYTES + 100)], { type: "image/png" }));
        return;
      }
      cb(new Blob(["smaller-jpeg"], { type: "image/jpeg" }));
    });
    const originalFile = new File(["big-png"], "big-logo.png", { type: "image/png" });

    const result = await prepareImage(originalFile);

    expect(fillRectMock).toHaveBeenCalledTimes(1);
    expect(result.extension).toBe("jpg");
    expect(result.contentType).toBe("image/jpeg");
  });

  it("reduce proporcionalmente imágenes que superan maxSide", async () => {
    mockBitmap(2400, 1200);
    const originalFile = new File(["large-photo"], "photo.jpg", { type: "image/jpeg" });

    await prepareImage(originalFile, 1200);

    expect(createdCanvases[0].width).toBe(1200);
    expect(createdCanvases[0].height).toBe(600);
  });

  it("rechaza formatos no soportados y archivos > 10 MB", async () => {
    const svg = new File(["<svg/>"], "icon.svg", { type: "image/svg+xml" });
    await expect(prepareImage(svg)).rejects.toThrow(/Formato no permitido/i);

    const huge = new File([new Uint8Array(10 * 1024 * 1024 + 1)], "huge.jpg", {
      type: "image/jpeg",
    });
    await expect(prepareImage(huge)).rejects.toThrow(/10 MB/i);
  });

  it("extrae rutas válidas de URL pública de Storage y rechaza path traversal", () => {
    expect(
      storagePathFromPublicUrl(
        "https://demo.supabase.co/storage/v1/object/public/business-assets/avatars/u1/a.jpg",
      ),
    ).toBe("avatars/u1/a.jpg");
    expect(
      storagePathFromPublicUrl(
        "https://demo.supabase.co/storage/v1/object/public/business-assets/avatars/../other.jpg",
      ),
    ).toBeNull();
    expect(
      storagePathFromPublicUrl(
        "https://demo.supabase.co/storage/v1/object/public/business-assets/avatars/u1/a.jpg?token=1",
      ),
    ).toBeNull();
    expect(
      storagePathFromPublicUrl(
        "https://demo.supabase.co/storage/v1/object/public/business-assets/avatars/u1/a.jpg#frag",
      ),
    ).toBeNull();
    expect(
      storagePathFromPublicUrl(
        "https://demo.supabase.co/storage/v1/object/public/business-assets//avatars/u1/a.jpg",
      ),
    ).toBeNull();
    expect(storagePathFromPublicUrl("https://evil.example/image.jpg")).toBeNull();
  });

  it("removeBusinessAssetPath borra en Storage y tolera errores o rutas vacías", async () => {
    await removeBusinessAssetPath(null);
    await removeBusinessAssetPath("   ");
    expect(storageRemove).not.toHaveBeenCalled();

    await removeBusinessAssetPath("avatars/u1/old.jpg");
    expect(storageRemove).toHaveBeenCalledWith(["avatars/u1/old.jpg"]);

    storageRemove.mockRejectedValueOnce(new Error("network"));
    await expect(removeBusinessAssetPath("avatars/u1/broken.jpg")).resolves.toBeUndefined();
  });

  it("hooks de imágenes limpian previous_storage_path en Storage al actualizar/quitar", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    rpcMock.mockResolvedValueOnce({
      id: "u1",
      avatar_url: null,
      previous_storage_path: "avatars/u1/old-avatar.jpg",
    });
    const avatarHook = renderHook(() => useSetProfileAvatar(), { wrapper });
    await act(async () => {
      await avatarHook.result.current.mutateAsync({ avatarUrl: null });
    });
    await waitFor(() => {
      expect(storageRemove).toHaveBeenCalledWith(["avatars/u1/old-avatar.jpg"]);
    });

    rpcMock.mockResolvedValueOnce({
      business_id: "b1",
      logo_url: null,
      previous_storage_path: "business/b1/logo-old.png",
    });
    const logoHook = renderHook(() => useSetBusinessLogo(), { wrapper });
    await act(async () => {
      await logoHook.result.current.mutateAsync({ businessId: "b1", logoUrl: null });
    });
    await waitFor(() => {
      expect(storageRemove).toHaveBeenCalledWith(["business/b1/logo-old.png"]);
    });

    rpcMock.mockResolvedValueOnce({
      id: "p1",
      business_id: "b1",
      name: "Café",
      previous_storage_path: "business/b1/prod-old.jpg",
    });
    const productHook = renderHook(() => useUpsertProduct(), { wrapper });
    await act(async () => {
      await productHook.result.current.mutateAsync({
        businessId: "b1",
        id: "p1",
        name: "Café",
        priceCop: 5000,
        isActive: true,
        imageUrl: null,
      });
    });
    await waitFor(() => {
      expect(storageRemove).toHaveBeenCalledWith(["business/b1/prod-old.jpg"]);
    });

    rpcMock.mockResolvedValueOnce({
      id: "r1",
      business_id: "b1",
      name: "Premio",
      previous_storage_path: "business/b1/reward-old.jpg",
    });
    const rewardHook = renderHook(() => useUpsertLoyaltyReward(), { wrapper });
    await act(async () => {
      await rewardHook.result.current.mutateAsync({
        businessId: "b1",
        id: "r1",
        type: "free_product",
        name: "Premio",
        pointsRequired: 50,
        isActive: true,
        imageUrl: null,
      });
    });
    await waitFor(() => {
      expect(storageRemove).toHaveBeenCalledWith(["business/b1/reward-old.jpg"]);
    });
  });
});
