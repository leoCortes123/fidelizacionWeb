import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { EncargadoPage } from "@/features/loyalty/EncargadoPage";
import type { CustomerDetail, LoyaltyRedemptionWithCustomer, StaffCustomer } from "@/types";

const approve = vi.hoisted(() => vi.fn());
const deliver = vi.hoisted(() => vi.fn());
const signOut = vi.hoisted(() => vi.fn());
const ctx = vi.hoisted(() => ({
  role: "admin" as "admin" | "encargado" | "cliente",
  canApprove: false,
}));

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
    role: "admin" as const,
    can_approve_redemptions: false,
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

const approvedRow: LoyaltyRedemptionWithCustomer = {
  id: "red-approved",
  business_id: "biz-1",
  account_id: "acc-2",
  reward_id: "rew-2",
  reward_name: "Bebida gratis",
  reward_type: "free_product",
  points_spent: 25,
  code: "TPBBBB2222",
  status: "approved",
  idempotency_key: "key-2",
  created_by: "user-customer-2",
  created_at: "2026-10-20T11:00:00.000Z",
  approved_by: "user-admin",
  approved_at: "2026-10-20T11:30:00.000Z",
  delivered_at: null,
  cancelled_at: null,
  cancellation_reason: null,
  origin: "manual",
  customer_id: "user-customer-2",
  customer_email: "luis@example.test",
  customer_nickname: "luis",
};

const customerMock: StaffCustomer = {
  id: "user-cust-1",
  full_name: "Carlos Mendoza",
  nickname: "carlosm",
  email: "carlos@example.com",
  points_balance: 150,
  purchase_count: 5,
  total_spent: 120000,
  created_at: "2026-02-01T10:00:00.000Z",
  total_count: 1,
  is_frequent: true,
  is_frequent_active: true,
  last_purchase_at: "2026-10-25T14:00:00.000Z",
};

const customerDetailMock: CustomerDetail = {
  profile: {
    id: "user-cust-1",
    full_name: "Carlos Mendoza",
    nickname: "carlosm",
    email: "carlos@example.com",
    created_at: "2026-02-01T10:00:00.000Z",
  },
  points_balance: 150,
  purchase_count: 5,
  total_spent: 120000,
  is_frequent: true,
  is_frequent_active: true,
  last_purchase_at: "2026-10-25T14:00:00.000Z",
  purchases: [
    {
      id: "pur-1",
      amount_cop: 25000,
      points_awarded: 25,
      claimed_at: "2026-10-25T14:00:00.000Z",
      status: "claimed",
      items_count: 2,
    },
  ],
  redemptions: [
    {
      id: "red-1",
      reward_name: "Taco gratis",
      points_spent: 40,
      code: "TPAAAA1111",
      status: "redeemed",
      created_at: "2026-10-20T12:00:00.000Z",
      delivered_at: "2026-10-20T12:30:00.000Z",
      cancelled_at: null,
    },
  ],
  movements: [],
};

vi.mock("@/features/loyalty/hooks", () => ({
  useBusinesses: () => ({ data: [fixture.business], isLoading: false, isError: false }),
  useLoyaltyRedemptions: (_businessId: string, status: string) => ({
    data: status === "pending" ? [pendingRow] : status === "approved" ? [approvedRow] : [],
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  useApproveRedemption: () => ({ mutateAsync: approve, isPending: false }),
  useDeliverRedemption: () => ({ mutateAsync: deliver, isPending: false }),
}));

vi.mock("@/features/admin/hooks", () => ({
  useAdminCustomers: () => ({
    data: [customerMock],
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  useAdminCustomer: () => ({
    data: customerDetailMock,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

vi.mock("@/features/auth/AuthProvider", () => ({
  useAuth: () => ({
    signOut,
  }),
}));

vi.mock("@/features/loyalty/businessContext", () => ({
  useBusinessContext: () => ({
    selectedBusiness: fixture.business,
    businesses: [fixture.business],
    selectedRole: ctx.role,
    canApproveRedemptions: ctx.canApprove,
    setSelectedBusiness: vi.fn(),
  }),
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <EncargadoPage />
    </MemoryRouter>,
  );
}

describe("EncargadoRedemptionsPage / EncargadoPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ctx.role = "admin";
    ctx.canApprove = false;
    signOut.mockResolvedValue(undefined);
    approve.mockResolvedValue({ status: "approved" });
    deliver.mockResolvedValue({ status: "delivered" });
  });

  it("muestra las solicitudes pendientes y permite aprobarlas directamente sin QR", async () => {
    const user = userEvent.setup();
    renderPage();

    expect(screen.getByText("Solicitudes de recompensa")).toBeInTheDocument();
    expect(screen.getByText("Taco gratis")).toBeInTheDocument();
    expect(screen.getByText(/@carla/)).toBeInTheDocument();

    const approveButton = screen.getByRole("button", { name: /Aprobar/i });
    await user.click(approveButton);

    await waitFor(() => expect(approve).toHaveBeenCalledTimes(1));
    expect(approve).toHaveBeenCalledWith({
      businessId: "biz-1",
      redemptionId: "red-1",
      approve: true,
    });
  });

  it("permite rechazar una solicitud pendiente directamente", async () => {
    const user = userEvent.setup();
    renderPage();

    const rejectButton = screen.getByRole("button", { name: /Rechazar/i });
    await user.click(rejectButton);

    await waitFor(() => expect(approve).toHaveBeenCalledTimes(1));
    expect(approve).toHaveBeenCalledWith({
      businessId: "biz-1",
      redemptionId: "red-1",
      approve: false,
    });
  });

  it("permite confirmar la entrega de solicitudes aprobadas en mostrador", async () => {
    const user = userEvent.setup();
    renderPage();

    expect(screen.getByText("Bebida gratis")).toBeInTheDocument();
    const deliverButton = screen.getByRole("button", { name: /Confirmar entrega/i });
    await user.click(deliverButton);

    await waitFor(() => expect(deliver).toHaveBeenCalledTimes(1));
    expect(deliver).toHaveBeenCalledWith({
      businessId: "biz-1",
      redemptionId: "red-approved",
    });
  });

  it("muestra la pestaña de clientes en tarjetas y abre el detalle del cliente al hacer clic", async () => {
    const user = userEvent.setup();
    renderPage();

    const clientesTab = screen.getByRole("tab", { name: /^Clientes$/i });
    await user.click(clientesTab);

    expect(await screen.findByText("Carlos Mendoza")).toBeInTheDocument();
    expect(screen.getByText("@carlosm")).toBeInTheDocument();
    expect(screen.getByText(/150/)).toBeInTheDocument();
    expect(screen.getAllByText("Frecuente activo").length).toBeGreaterThanOrEqual(1);

    // Clic en la tarjeta de cliente para abrir el detalle
    await user.click(screen.getByText("Carlos Mendoza"));
    expect(await screen.findByText("Detalle del cliente")).toBeInTheDocument();
    expect(screen.getByText("Historial de compras")).toBeInTheDocument();
    expect(screen.getByText("Historial de recompensas reclamadas")).toBeInTheDocument();
    expect(screen.getByText(/25\.000/)).toBeInTheDocument();

    // Cerrar el modal
    const closeButtons = screen.getAllByRole("button", { name: /Cerrar/i });
    await user.click(closeButtons[0]);
    await waitFor(() => {
      expect(screen.queryByText("Detalle del cliente")).not.toBeInTheDocument();
    });
  });

  it("muestra un aviso si el encargado no tiene permiso de aprobación", () => {
    ctx.role = "encargado";
    ctx.canApprove = false;
    renderPage();

    expect(screen.getByText("Sin permiso de aprobación")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Aprobar/i })).not.toBeInTheDocument();
  });
});
