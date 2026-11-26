import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { PurchasesPage } from "@/features/admin/PurchasesPage";
import type { Business, BusinessPurchasePageRow } from "@/types";

const regenerateQr = vi.hoisted(() => vi.fn());
const purchasesHolder = vi.hoisted(() => ({ rows: [] as BusinessPurchasePageRow[] }));

const business: Business = {
  id: "biz-1",
  name: "Café Fideliapp",
  slug: "cafe-fideliapp",
  timezone: "America/Bogota",
  operating_days: [1, 2, 3, 4, 5, 6],
  is_active: true,
  created_by: "user-admin",
  created_at: "2026-01-01T12:00:00.000Z",
  updated_at: "2026-01-01T12:00:00.000Z",
  role: "admin",
  can_approve_redemptions: false,
};

vi.mock("qrcode.react", () => ({
  QRCodeCanvas: ({ value }: { value: string }) => (
    <div data-testid="qr-canvas" data-value={value} />
  ),
}));

vi.mock("@/features/loyalty/hooks", () => ({
  useBusinesses: () => ({
    data: [business],
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

vi.mock("@/features/loyalty/businessContext", () => ({
  useBusinessContext: () => ({
    selectedBusiness: business,
    businesses: [business],
    selectedRole: "admin",
    canApproveRedemptions: false,
    setSelectedBusiness: vi.fn(),
  }),
}));

vi.mock("@/features/purchases/hooks", () => ({
  useBusinessPurchases: () => ({
    data: purchasesHolder.rows,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  useRegeneratePurchaseQr: () => ({
    mutateAsync: regenerateQr,
    isPending: false,
  }),
  useBusinessPurchaseDetail: () => ({
    data: null,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  useMyPurchaseDetail: () => ({
    data: null,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <PurchasesPage />
    </MemoryRouter>,
  );
}

describe("PurchasesPage (Ventas)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const now = Date.now();
    const yesterday = now - 24 * 3600 * 1000;
    const older = new Date("2026-05-10T15:30:00.000Z").getTime();

    purchasesHolder.rows = [
      {
        id: "pur-pending",
        amount_cop: 30000,
        status: "pending_claim",
        points_awarded: 0,
        created_at: new Date(now - 5 * 60 * 1000).toISOString(),
        expires_at: new Date(now + 4 * 3600 * 1000).toISOString(),
        claimed_at: null,
        customer_name: null,
        customer_nickname: null,
        customer_email: null,
        registrar_name: "Ana Admin",
        items_count: 1,
        total_count: 3,
      },
      {
        id: "pur-expired-by-time",
        amount_cop: 18000,
        status: "pending_claim",
        points_awarded: 0,
        created_at: new Date(yesterday).toISOString(),
        expires_at: new Date(now - 60 * 1000).toISOString(),
        claimed_at: null,
        customer_name: null,
        customer_nickname: null,
        customer_email: null,
        registrar_name: "Ana Admin",
        items_count: 0,
        total_count: 3,
      },
      {
        id: "pur-claimed",
        amount_cop: 45000,
        status: "claimed",
        points_awarded: 45,
        created_at: new Date(older).toISOString(),
        expires_at: new Date(older + 24 * 3600 * 1000).toISOString(),
        claimed_at: new Date(older + 120 * 1000).toISOString(),
        customer_name: "Carla Cliente",
        customer_nickname: "carlac",
        customer_email: "carla@example.test",
        registrar_name: "Ana Admin",
        items_count: 2,
        total_count: 3,
      },
    ];

    regenerateQr.mockResolvedValue({
      purchase_id: "pur-pending",
      token: "tok_regenerated_1234567890123456",
      business_id: "biz-1",
      business_name: "Café Fideliapp",
      amount_cop: 30000,
      points_preview: 30,
      expires_at: new Date(now + 4 * 3600 * 1000).toISOString(),
      status: "pending_claim",
      items: [],
    });
  });

  it("muestra columna Estado puntos, fechas Hoy/Ayer, oculta Cancelar y solo permite Regenerar QR en pendientes vigentes", async () => {
    const user = userEvent.setup();
    renderPage();

    const table = within(screen.getByRole("table"));
    expect(table.getByRole("columnheader", { name: /Estado puntos/i })).toBeInTheDocument();
    expect(table.queryByRole("button", { name: /Cancelar/i })).not.toBeInTheDocument();

    // Fechas legibles Hoy / Ayer
    expect(table.getAllByText("Hoy").length).toBeGreaterThan(0);
    expect(table.getAllByText("Ayer").length).toBeGreaterThan(0);

    // Solo la venta pendiente y vigente muestra Regenerar QR (no la expirada por tiempo ni la reclamada)
    const regenButtons = table.getAllByRole("button", { name: /Regenerar QR/i });
    expect(regenButtons).toHaveLength(1);
    expect(table.getByText("Pendientes")).toBeInTheDocument();
    expect(table.getByText("Expirados")).toBeInTheDocument();
    expect(table.getByText("Reclamados")).toBeInTheDocument();

    await user.click(regenButtons[0]);
    await waitFor(() => expect(regenerateQr).toHaveBeenCalledWith("pur-pending"));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText(/QR de venta regenerado/i)).toBeInTheDocument();
    expect(within(dialog).getByTestId("claim-url").textContent).toContain(
      "/claim/tok_regenerated_1234567890123456",
    );
  });

  it("permite ordenar las filas por la columna Fecha", async () => {
    const user = userEvent.setup();
    renderPage();

    const table = within(screen.getByRole("table"));
    const rowsBefore = table.getAllByRole("row").slice(1);
    expect(rowsBefore[0]).toHaveTextContent("30.000");
    expect(rowsBefore[2]).toHaveTextContent("45.000");

    await user.click(table.getByRole("button", { name: /Fecha/i }));

    const rowsAfter = table.getAllByRole("row").slice(1);
    expect(rowsAfter[0]).toHaveTextContent("45.000");
    expect(rowsAfter[2]).toHaveTextContent("30.000");
  });
});
