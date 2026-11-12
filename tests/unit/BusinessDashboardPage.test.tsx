import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { BusinessDashboardPage } from "@/features/admin/BusinessDashboardPage";
import type { Business, DashboardSummary } from "@/types";

vi.mock("qrcode.react", () => ({
  QRCodeCanvas: ({ value }: { value: string }) => (
    <div data-testid="qr-canvas" data-value={value} />
  ),
}));

const spies = vi.hoisted(() => ({
  useLoyaltyProgram: vi.fn(),
  useBusinessDashboardSummary: vi.fn(),
  useBusinessRecentActivity: vi.fn(),
  setSelectedBusiness: vi.fn(),
}));

const state = vi.hoisted(() => ({
  businesses: [] as Business[],
  isLoading: false,
  selectedBusiness: null as Business | null,
  summaryData: null as DashboardSummary | null,
  summaryLoading: false,
  programData: null as null | {
    id: string;
    is_active: boolean;
    cop_per_point_unit: number;
    configured_at: string | null;
  },
}));

vi.mock("@/features/loyalty/hooks", () => ({
  useBusinesses: () => ({
    data: state.businesses,
    isLoading: state.isLoading,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  useLoyaltyProgram: (businessId: string) => {
    spies.useLoyaltyProgram(businessId);
    return { data: state.programData, isLoading: false, isError: false };
  },
}));

vi.mock("@/features/admin/hooks", () => ({
  useBusinessDashboardSummary: (businessId: string) => {
    spies.useBusinessDashboardSummary(businessId);
    return {
      data: state.summaryData,
      isLoading: state.summaryLoading,
      isError: false,
      error: null,
      refetch: vi.fn(),
    };
  },
  useBusinessRecentActivity: (businessId: string, limit?: number) => {
    spies.useBusinessRecentActivity(businessId, limit);
    return { data: [], isLoading: false, isError: false, error: null, refetch: vi.fn() };
  },
}));

vi.mock("@/features/loyalty/businessContext", () => ({
  useBusinessContext: () => ({
    businesses: state.businesses,
    selectedBusiness: state.selectedBusiness,
    selectedRole: state.selectedBusiness?.role ?? null,
    canApproveRedemptions: false,
    setSelectedBusiness: spies.setSelectedBusiness,
  }),
}));

function makeBusiness(id: string, role: Business["role"]): Business {
  return {
    id,
    name: `Negocio ${id}`,
    slug: `negocio-${id}`,
    timezone: "America/Bogota",
    operating_days: [1, 2, 3, 4, 5, 6],
    is_active: true,
    created_by: "user-1",
    created_at: "2026-01-01T12:00:00.000Z",
    updated_at: "2026-01-01T12:00:00.000Z",
    role,
    can_approve_redemptions: false,
  };
}

describe("BusinessDashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.businesses = [];
    state.isLoading = false;
    state.selectedBusiness = null;
    state.summaryData = null;
    state.summaryLoading = false;
    state.programData = null;
  });

  it("no consulta RPCs del panel cuando el usuario no tiene negocios admin (solo cliente o vacío)", () => {
    const customerOnly = makeBusiness("biz-customer", "cliente");
    state.businesses = [customerOnly];
    state.selectedBusiness = customerOnly;

    render(
      <MemoryRouter>
        <BusinessDashboardPage />
      </MemoryRouter>,
    );

    expect(spies.useLoyaltyProgram).toHaveBeenCalledWith("");
    expect(spies.useBusinessDashboardSummary).toHaveBeenCalledWith("");
    expect(spies.useBusinessRecentActivity).toHaveBeenCalledWith("", 8);
    expect(screen.getByRole("link", { name: /registrar negocio/i })).toHaveAttribute(
      "href",
      "/admin/onboarding?new=1",
    );
  });

  it("no consulta RPCs con un selectedBusiness ajeno o inexistente en la lista actual", () => {
    const staleBusiness = makeBusiness("biz-other-user", "admin");
    state.businesses = [];
    state.selectedBusiness = staleBusiness;

    render(
      <MemoryRouter>
        <BusinessDashboardPage />
      </MemoryRouter>,
    );

    expect(spies.useLoyaltyProgram).toHaveBeenCalledWith("");
    expect(spies.useBusinessDashboardSummary).toHaveBeenCalledWith("");
    expect(spies.useBusinessRecentActivity).toHaveBeenCalledWith("", 8);
  });

  it("consulta los RPCs solo cuando existe un negocio admin activo perteneciente al usuario", () => {
    const adminBusiness = makeBusiness("biz-admin", "admin");
    const customerBusiness = makeBusiness("biz-customer", "cliente");
    state.businesses = [adminBusiness, customerBusiness];
    state.selectedBusiness = null;

    render(
      <MemoryRouter>
        <BusinessDashboardPage />
      </MemoryRouter>,
    );

    expect(spies.useLoyaltyProgram).toHaveBeenCalledWith("biz-admin");
    expect(spies.useBusinessDashboardSummary).toHaveBeenCalledWith("biz-admin");
    expect(spies.useBusinessRecentActivity).toHaveBeenCalledWith("biz-admin", 8);
    expect(screen.getByRole("heading", { name: /^Inicio$/ })).toBeInTheDocument();
    expect(screen.getByText(/@negocio-biz-admin/i)).toBeInTheDocument();
  });

  it("oculta Administrador y Cambiar negocio solo en móvil y organiza los KPI principales en filas de 2 en responsive", () => {
    const biz1 = makeBusiness("biz-admin-1", "admin");
    const biz2 = makeBusiness("biz-admin-2", "admin");
    state.businesses = [biz1, biz2];
    state.selectedBusiness = biz1;
    state.programData = {
      id: "prog-1",
      is_active: false,
      cop_per_point_unit: 1000,
      configured_at: null,
    };
    state.summaryData = {
      business_id: "biz-admin-1",
      sales_today_cop: 180000,
      purchases_today: 4,
      sales_month_cop: 4500000,
      purchases_month: 95,
      pending_redemptions: 2,
      approved_pending_delivery: 1,
      frequent_customers: 12,
      active_customers: 30,
      customers_total: 40,
      points_outstanding: 2500,
      points_issued_total: 8000,
      points_redeemed_total: 5500,
      pending_qr_count: 1,
      budget_committed_percent: 45,
      last_activity_at: null,
      calculated_at: "2026-01-01T12:00:00.000Z",
    };

    const { rerender } = render(
      <MemoryRouter>
        <BusinessDashboardPage />
      </MemoryRouter>,
    );

    const completeLink = screen.getByRole("link", { name: /completar configuración/i });
    expect(completeLink).toBeInTheDocument();

    const roleBadge = screen.getByText("Administrador");
    expect(roleBadge).toHaveClass("hidden", "sm:inline-flex");

    const switchButton = screen.getByRole("button", { name: /cambiar negocio/i });
    expect(switchButton).toHaveClass("hidden", "sm:inline-flex");
    expect(switchButton.parentElement).not.toHaveClass("hidden");

    const kpiGrid = screen.getByText("Ventas de hoy").closest(".grid");
    expect(kpiGrid).toHaveClass("grid-cols-2", "sm:grid-cols-2", "lg:grid-cols-4");
    expect(screen.getByText("Ventas del mes").closest(".grid")).toBe(kpiGrid);
    expect(screen.getByText("Solicitudes pendientes").closest(".grid")).toBe(kpiGrid);
    expect(screen.getByText("Clientes frecuentes").closest(".grid")).toBe(kpiGrid);

    state.programData = { ...state.programData, is_active: true };
    state.summaryLoading = true;
    rerender(
      <MemoryRouter>
        <BusinessDashboardPage />
      </MemoryRouter>,
    );

    expect(
      screen.queryByRole("link", { name: /completar configuración/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cambiar negocio/i }).parentElement).toHaveClass(
      "hidden",
      "sm:flex",
    );

    const skeletonGrid = document.querySelector(".animate-pulse")?.closest(".grid");
    expect(skeletonGrid).toHaveClass("grid-cols-2", "sm:grid-cols-2", "lg:grid-cols-4");
  });
});
