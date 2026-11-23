import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { EncargadoDashboardPage } from "@/features/loyalty/EncargadoDashboardPage";
import type { LoyaltyRedemptionWithCustomer } from "@/types";

const approve = vi.hoisted(() => vi.fn());
const deliver = vi.hoisted(() => vi.fn());

const fixture = vi.hoisted(() => ({
  business: {
    id: "biz-1",
    name: "Taquería El Fogón",
    slug: "taqueria-el-fogon",
    timezone: "America/Bogota",
    operating_days: [1, 2, 3, 4, 5, 6],
    is_active: true,
    created_by: "user-admin",
    created_at: "2026-01-01T12:00:00.000Z",
    updated_at: "2026-01-01T12:00:00.000Z",
    role: "encargado" as const,
    can_approve_redemptions: true,
  },
}));

const pendingRow: LoyaltyRedemptionWithCustomer = {
  id: "red-1",
  business_id: "biz-1",
  account_id: "acc-1",
  reward_id: "rew-1",
  reward_name: "Taco gratis",
  reward_type: "free_product",
  points_spent: 40,
  code: "TPAAAA1111",
  status: "pending",
  idempotency_key: "key-1",
  created_by: "user-customer",
  created_at: "2026-10-20T12:00:00.000Z",
  approved_by: null,
  approved_at: null,
  delivered_at: null,
  cancelled_at: null,
  cancellation_reason: null,
  origin: "manual",
  customer_id: "user-customer",
  customer_email: "carla@example.test",
  customer_nickname: "carla",
};

vi.mock("@/features/loyalty/hooks", () => ({
  useBusinesses: () => ({ data: [fixture.business], isLoading: false, isError: false }),
  useLoyaltyRedemptions: (_businessId: string, status: string) => ({
    data: status === "pending" ? [pendingRow] : [],
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  useApproveRedemption: () => ({ mutateAsync: approve, isPending: false }),
  useDeliverRedemption: () => ({ mutateAsync: deliver, isPending: false }),
}));

vi.mock("@/features/purchases/hooks", () => ({
  useBusinessPurchases: () => ({
    data: [
      {
        id: "pur-1",
        business_id: "biz-1",
        amount_cop: 25000,
        points_awarded: 25,
        status: "claimed",
        customer_name: "Juan Perez",
        created_at: "2026-10-25T14:00:00.000Z",
        items_count: 2,
      },
    ],
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
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
  useRegeneratePurchaseQr: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

vi.mock("@/features/loyalty/businessContext", () => ({
  useBusinessContext: () => ({
    selectedBusiness: fixture.business,
    businesses: [fixture.business],
    selectedRole: "encargado",
    canApproveRedemptions: true,
    setSelectedBusiness: vi.fn(),
  }),
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <EncargadoDashboardPage />
    </MemoryRouter>,
  );
}

describe("EncargadoDashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    approve.mockResolvedValue({ status: "approved" });
  });

  it("muestra el dashboard operativo con las solicitudes pendientes y últimas ventas", () => {
    renderPage();

    expect(screen.getByText("Taquería El Fogón")).toBeInTheDocument();
    expect(screen.getByText(/Terminal de caja/i)).toBeInTheDocument();
    expect(screen.getByText("Por aprobar")).toBeInTheDocument();
    expect(screen.getByText("Taco gratis")).toBeInTheDocument();
    expect(screen.getByText(/25\.000/)).toBeInTheDocument();
    expect(screen.getByText(/Juan Perez/)).toBeInTheDocument();
  });

  it("tiene enlace directo para ir a registrar venta", () => {
    renderPage();

    const registerSaleLinks = screen.getAllByRole("link", { name: /Registrar venta/i });
    expect(registerSaleLinks.length).toBeGreaterThan(0);
    expect(registerSaleLinks[0]).toHaveAttribute("href", "/encargado/venta");
  });

  it("permite aprobar una solicitud pendiente directamente desde el dashboard", async () => {
    const user = userEvent.setup();
    renderPage();

    const approveButton = screen.getByRole("button", { name: /Aprobar/i });
    await user.click(approveButton);

    await waitFor(() => expect(approve).toHaveBeenCalledTimes(1));
    expect(approve).toHaveBeenCalledWith({
      businessId: "biz-1",
      redemptionId: "red-1",
      approve: true,
    });
  });
});
