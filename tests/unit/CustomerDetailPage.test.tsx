import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { CustomerDetailPage } from "@/features/admin/CustomerDetailPage";
import type { Business, CustomerDetail, LoyaltyRedemptionWithCustomer } from "@/types";

const business: Business = {
  id: "biz-1",
  name: "Café Loopoint",
  slug: "cafe-loopoint",
  timezone: "America/Bogota",
  operating_days: [1, 2, 3, 4, 5, 6],
  is_active: true,
  created_by: "user-admin",
  created_at: "2026-01-01T12:00:00.000Z",
  updated_at: "2026-01-01T12:00:00.000Z",
  role: "admin",
  can_approve_redemptions: false,
};

const detail: CustomerDetail = {
  profile: {
    id: "cust-1",
    full_name: "Carla Cliente",
    nickname: "carlac",
    email: "carla@example.test",
    created_at: "2026-01-10T12:00:00.000Z",
  },
  points_balance: 120,
  purchase_count: 2,
  total_spent: 50000,
  is_frequent: true,
  is_frequent_active: true,
  last_purchase_at: "2026-10-20T15:00:00.000Z",
  purchases: [
    {
      id: "pur-1",
      amount_cop: 30000,
      points_awarded: 30,
      claimed_at: "2026-10-20T15:00:00.000Z",
      status: "claimed",
      items_count: 2,
    },
  ],
  movements: [
    {
      id: "mov-1",
      movement_type: "purchase_credit",
      points: 30,
      reason: null,
      created_at: "2026-10-20T15:00:00.000Z",
    },
  ],
  redemptions: [
    {
      id: "red-1",
      reward_name: "Capuchino gratis",
      reward_type: "free_product",
      points_spent: 40,
      code: "TP123456",
      origin: "manual",
      request_status: "pending",
      status: "pending_delivery",
      created_at: "2026-10-21T16:00:00.000Z",
      delivered_at: null,
      cancelled_at: null,
    },
  ],
};

const liveRedemptions: LoyaltyRedemptionWithCustomer[] = [
  {
    id: "red-1",
    business_id: "biz-1",
    account_id: "acc-1",
    customer_id: "cust-1",
    customer_email: "carla@example.test",
    customer_nickname: "carlac",
    customer_avatar_url: null,
    reward_id: "rew-1",
    reward_name: "Capuchino gratis",
    reward_type: "free_product",
    reward_image_url: null,
    points_spent: 40,
    code: "TP123456",
    status: "pending",
    origin: "manual",
    idempotency_key: "key-1",
    created_by: "cust-1",
    created_at: "2026-10-21T16:00:00.000Z",
    approved_by: null,
    approved_at: null,
    delivered_at: null,
    cancelled_at: null,
    cancellation_reason: null,
  },
];

vi.mock("@/features/admin/hooks", () => ({
  useAdminCustomer: () => ({
    data: detail,
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

vi.mock("@/features/loyalty/hooks", () => ({
  useLoyaltyRedemptions: () => ({
    data: liveRedemptions,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  useApproveRedemption: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeliverRedemption: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useCancelRedemption: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock("@/features/purchases/hooks", () => ({
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
  useRegeneratePurchaseQr: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/admin/customers/cust-1"]}>
      <Routes>
        <Route path="/admin/customers/:id" element={<CustomerDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("CustomerDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("agrupa Compras, Movimientos de monedas y Canjes en pestañas y muestra tabla estilo solicitudes sin botón a Solicitudes", async () => {
    const user = userEvent.setup();
    renderPage();

    const purchasesTab = screen.getByRole("tab", { name: /Compras/i });
    const movementsTab = screen.getByRole("tab", { name: /Movimientos de monedas/i });
    const redemptionsTab = screen.getByRole("tab", { name: /Canjes/i });

    expect(purchasesTab).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText(/30\.000/)).toBeInTheDocument();

    await user.click(movementsTab);
    expect(screen.getByText("Compra acreditada")).toBeInTheDocument();
    expect(screen.getByText("+30")).toBeInTheDocument();

    await user.click(redemptionsTab);
    expect(screen.queryByRole("link", { name: /Ver en Solicitudes/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Registrar venta/i })).not.toBeInTheDocument();

    const table = within(screen.getByRole("table"));
    expect(table.getByText("Capuchino gratis")).toBeInTheDocument();
    expect(table.getByText("Pendiente de validar")).toBeInTheDocument();
    expect(table.getByRole("button", { name: /Aprobar/i })).toBeInTheDocument();
  });
});
