import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { EconomicPage } from "@/features/admin/EconomicPage";
import type { Business, BusinessEconomicDashboard, BusinessEconomicProfile } from "@/types";

const upsert = vi.hoisted(() => vi.fn());
const createSnapshot = vi.hoisted(() => vi.fn());
const profileHolder = vi.hoisted(() => ({ current: null as BusinessEconomicProfile | null }));

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
  profile: {
    id: "profile-1",
    business_id: "biz-1",
    daily_avg_sales: 200000,
    monthly_operation_days: 26,
    daily_gain: null,
    gross_margin: 30,
    avg_customers_per_day: 40,
    max_monthly_reward_budget: 100000,
    data_status: {
      daily_avg_sales: "confirmed",
      monthly_operation_days: "confirmed",
      daily_gain: "unknown",
      gross_margin: "estimated",
      avg_customers_per_day: "estimated",
      max_monthly_reward_budget: "confirmed",
    },
    updated_by: "user-admin",
    updated_at: "2026-10-24T12:00:00.000Z",
  } as BusinessEconomicProfile,
  dashboard: {
    business_id: "biz-1",
    monthly_estimated_sales_cop: 5200000,
    reference_budget_cop: 52000,
    budget_rate: 0.01,
    redeemed_rewards_cost_cop: 30000,
    pending_rewards_cost_cop: 55000,
    reserved_rewards_cost_cop: 55000,
    remaining_budget_cop: 15000,
    budget_committed_percent: 85,
    max_monthly_reward_budget_cop: 100000,
    data_status: { daily_avg_sales: "confirmed" },
    estimated: false,
    calculated_at: "2026-10-25T12:00:00.000Z",
  } as BusinessEconomicDashboard,
}));

vi.mock("@/features/loyalty/hooks", () => ({
  useBusinesses: () => ({
    data: [fixture.business],
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  useBusinessEconomicProfile: () => ({
    data: profileHolder.current,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  useBusinessEconomicDashboard: () => ({
    data: fixture.dashboard,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  useUpsertEconomicProfile: () => ({ mutateAsync: upsert, isPending: false }),
  useBudgetSnapshots: () => ({
    data: [],
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  useCreateBudgetSnapshot: () => ({ mutateAsync: createSnapshot, isPending: false }),
}));

vi.mock("@/features/loyalty/businessContext", () => ({
  useBusinessContext: () => ({
    selectedBusiness: fixture.business as Business,
    businesses: [fixture.business],
    selectedRole: "admin",
    canApproveRedemptions: false,
    setSelectedBusiness: vi.fn(),
  }),
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <EconomicPage />
    </MemoryRouter>,
  );
}

describe("EconomicPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    profileHolder.current = fixture.profile;
    upsert.mockResolvedValue({
      business_id: "biz-1",
      updated_at: "2026-10-25T13:00:00.000Z",
    });
  });

  it("muestra el panel económico y alerta al superar el 80 %", () => {
    renderPage();

    expect(screen.getAllByText(/5\.200\.000/).length).toBeGreaterThan(0);
    expect(screen.getByText("85.0 %")).toBeInTheDocument();
    expect(screen.getByText(/presupuesto cerca del límite/i)).toBeInTheDocument();
    expect(screen.getAllByText(/estimación comercial/i).length).toBeGreaterThan(0);
  });

  it("guarda los datos editados con su estado", async () => {
    const user = userEvent.setup();
    renderPage();

    const sales = screen.getByLabelText("Ventas diarias promedio");
    await user.clear(sales);
    await user.type(sales, "250000");
    await user.click(screen.getByRole("button", { name: /Guardar datos económicos/i }));

    await waitFor(() => expect(upsert).toHaveBeenCalledTimes(1));
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        businessId: "biz-1",
        dailyAvgSales: 250000,
        monthlyOperationDays: 26,
        dailyGain: null,
        grossMargin: 30,
        avgCustomersPerDay: 40,
        maxMonthlyRewardBudget: 100000,
        dataStatus: expect.objectContaining({
          daily_avg_sales: "confirmed",
          daily_gain: "unknown",
        }),
      }),
    );
  });

  it("marcar un dato como desconocido lo limpia y envía null", async () => {
    const user = userEvent.setup();
    renderPage();

    const sales = screen.getByLabelText("Ventas diarias promedio");
    await user.clear(sales);
    await user.type(sales, "250000");

    const statuses = screen.getAllByLabelText("Estado del dato");
    await user.selectOptions(statuses[0], "unknown");

    expect(screen.getByLabelText("Ventas diarias promedio")).toHaveValue("");

    await user.click(screen.getByRole("button", { name: /Guardar datos económicos/i }));

    await waitFor(() => expect(upsert).toHaveBeenCalledTimes(1));
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        dailyAvgSales: null,
        dataStatus: expect.objectContaining({ daily_avg_sales: "unknown" }),
      }),
    );
  });

  it("interpreta separadores de miles en COP sin truncar el valor", async () => {
    const user = userEvent.setup();
    renderPage();

    const sales = screen.getByLabelText("Ventas diarias promedio");
    await user.clear(sales);
    await user.type(sales, "200.000");
    await user.click(screen.getByRole("button", { name: /Guardar datos económicos/i }));

    await waitFor(() => expect(upsert).toHaveBeenCalledTimes(1));
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        dailyAvgSales: 200000,
      }),
    );
  });

  it("calcula automáticamente el margen bruto a partir de ventas y ganancia diarias", async () => {
    const user = userEvent.setup();
    renderPage();

    const marginInput = screen.getByLabelText("Margen bruto");
    await user.clear(marginInput);

    const salesInput = screen.getByLabelText("Ventas diarias promedio");
    await user.clear(salesInput);
    await user.type(salesInput, "200000");

    const gainInput = screen.getByLabelText("Ganancia diaria");
    await user.type(gainInput, "60000");

    expect(marginInput).toHaveValue("30");
    expect(screen.getByText("Calculado automáticamente")).toBeInTheDocument();
  });

  it("sugiere días de operación al mes según los días del negocio cuando el perfil económico está vacío", () => {
    profileHolder.current = null;
    renderPage();

    expect(screen.getByLabelText("Días de operación al mes")).toHaveValue("26");
    expect(screen.getByText("Calculado según tu horario")).toBeInTheDocument();
    expect(screen.getAllByText(/opcional/i).length).toBeGreaterThan(0);
  });

  it("conserva los días en blanco cuando un perfil guardado ya los marcó como Desconocido", () => {
    profileHolder.current = {
      id: "profile-unknown",
      business_id: "biz-1",
      daily_avg_sales: null,
      monthly_operation_days: null,
      daily_gain: null,
      gross_margin: null,
      avg_customers_per_day: null,
      max_monthly_reward_budget: null,
      data_status: {
        daily_avg_sales: "unknown",
        monthly_operation_days: "unknown",
        daily_gain: "unknown",
        gross_margin: "unknown",
        avg_customers_per_day: "unknown",
        max_monthly_reward_budget: "unknown",
      },
      updated_by: "user-admin",
      updated_at: "2026-10-24T12:00:00.000Z",
    };

    renderPage();

    expect(screen.getByLabelText("Días de operación al mes")).toHaveValue("");
  });

  it("calcula ganancia diaria desde el margen bruto, advierte ganancia mayor a ventas y rechaza 1000.000", async () => {
    profileHolder.current = null;
    const user = userEvent.setup();
    renderPage();

    const sales = screen.getByLabelText("Ventas diarias promedio");
    const gain = screen.getByLabelText("Ganancia diaria");
    const margin = screen.getByLabelText("Margen bruto");

    await user.type(sales, "200000");
    await user.type(margin, "25");
    expect(gain).toHaveValue("50000");

    await user.clear(gain);
    await user.type(gain, "250000");
    expect(screen.getByText(/La ganancia diaria supera las ventas diarias/i)).toBeInTheDocument();

    await user.clear(sales);
    await user.type(sales, "1000.000");
    await user.click(screen.getByRole("button", { name: /Guardar datos económicos/i }));
    expect(upsert).not.toHaveBeenCalled();
  });
});
