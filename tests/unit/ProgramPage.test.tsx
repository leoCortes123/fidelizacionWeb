import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { ProgramPage } from "@/features/admin/ProgramPage";
import type { Business, BusinessEconomicProfile, LoyaltyProgram } from "@/types";

const configure = vi.hoisted(() => vi.fn());
const expirePoints = vi.hoisted(() => vi.fn());
const programData = vi.hoisted(() => ({ current: null as LoyaltyProgram | null }));
const economicData = vi.hoisted(() => ({ current: null as BusinessEconomicProfile | null }));
const economicErrorState = vi.hoisted(() => ({ isError: false }));

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

const business: Business = fixture.business;

function unconfiguredProgram(): LoyaltyProgram {
  return {
    id: "00000000-0000-0000-0000-000000000000",
    business_id: business.id,
    cop_per_point_unit: 1000,
    points_per_cop_unit: 100,
    points_expiry_days: 365,
    budget_rate: 0.01,
    first_purchase_bonus_points: 0,
    recurrence_bonus_points: 0,
    referral_bonus_points: 0,
    qr_expiry_hours: 24,
    frequent_min_purchases: 3,
    frequent_period_days: 90,
    frequent_min_spend_cop: 0,
    frequent_active_days: 30,
    recovery_inactive_days: 60,
    is_active: false,
    configured_by: null,
    configured_at: null,
    created_at: "",
    updated_at: "",
  };
}

vi.mock("@/features/loyalty/hooks", () => ({
  useBusinesses: () => ({ data: [fixture.business], isLoading: false, isError: false }),
  useLoyaltyProgram: () => ({
    data: programData.current,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  useBusinessEconomicProfile: () => ({
    data: economicData.current,
    isLoading: false,
    isError: economicErrorState.isError,
    error: economicErrorState.isError ? new Error("Fallo económico") : null,
    refetch: vi.fn(),
  }),
  useConfigureLoyaltyProgram: () => ({ mutateAsync: configure, isPending: false }),
  useExpirePointsDue: () => ({ mutateAsync: expirePoints, isPending: false }),
  useUpdateFrequentCriteria: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

vi.mock("@/features/loyalty/businessContext", () => ({
  useBusinessContext: () => ({
    selectedBusiness: fixture.business,
    businesses: [fixture.business],
    selectedRole: "admin",
    canApproveRedemptions: false,
    setSelectedBusiness: vi.fn(),
  }),
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <ProgramPage />
    </MemoryRouter>,
  );
}

describe("ProgramPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    programData.current = unconfiguredProgram();
    economicData.current = null;
    economicErrorState.isError = false;
    configure.mockResolvedValue(unconfiguredProgram());
  });

  it("carga valores sugeridos con campos de equivalencia bloqueados", () => {
    renderPage();

    expect(screen.getByText("El programa aún no está configurado")).toBeInTheDocument();
    expect(screen.getByLabelText("COP por moneda ganada")).toHaveValue("1000");
    expect(screen.getByLabelText("COP por moneda ganada")).toBeDisabled();
    expect(screen.getByLabelText("Monedas que equivalen a $1.000")).toHaveValue("100");
    expect(screen.getByLabelText("Monedas que equivalen a $1.000")).toBeDisabled();
    expect(screen.getByLabelText("Vencimiento de monedas (días)")).toHaveValue("365");
    expect(screen.getByLabelText("Vigencia del QR (horas)")).toHaveValue("24");
    expect(screen.getAllByText(/1 moneda = \$/).length).toBeGreaterThan(0);
  });

  it("recalcula COP por moneda ganada automáticamente al cambiar la tasa y guarda activo", async () => {
    const user = userEvent.setup();
    renderPage();

    const budget = screen.getByLabelText("Tasa de presupuesto (%)");
    await user.clear(budget);
    await user.type(budget, "2.5");

    expect(screen.getByLabelText("COP por moneda ganada")).toHaveValue("400");
    expect(screen.getByLabelText("Monedas que equivalen a $1.000")).toHaveValue("100");

    await user.click(screen.getByLabelText(/programa activo/i));
    await user.click(screen.getByRole("button", { name: "Guardar y activar" }));

    await waitFor(() => expect(configure).toHaveBeenCalledTimes(1));
    expect(configure).toHaveBeenCalledWith(
      expect.objectContaining({
        businessId: "biz-1",
        copPerPointUnit: 400,
        pointsPerCopUnit: 100,
        pointsExpiryDays: 365,
        budgetRate: 0.025,
        qrExpiryHours: 24,
        isActive: true,
      }),
    );
  });

  it("bloquea el guardado con un vencimiento inválido", async () => {
    const user = userEvent.setup();
    renderPage();

    const expiry = screen.getByLabelText("Vencimiento de monedas (días)");
    await user.clear(expiry);
    await user.type(expiry, "0");
    await user.click(screen.getByRole("button", { name: "Guardar programa" }));

    expect(await screen.findByText(/el mínimo es 1/i)).toBeInTheDocument();
    expect(configure).not.toHaveBeenCalled();
  });

  it("interpreta coma decimal en tasa de presupuesto y permite simular compras interactivas", async () => {
    const user = userEvent.setup();
    renderPage();

    const budget = screen.getByLabelText("Tasa de presupuesto (%)");
    await user.clear(budget);
    await user.type(budget, "2,5");

    expect(screen.getByLabelText("COP por moneda ganada")).toHaveValue("400");
    expect(screen.getByTestId("simulator-coins")).toHaveTextContent("+125");

    const simInput = screen.getByLabelText(/Valor de compra simulada/i);
    await user.clear(simInput);
    await user.type(simInput, "20000");
    expect(screen.getByTestId("simulator-coins")).toHaveTextContent("+50");
    expect(screen.getByTestId("simulator-reward-value")).toHaveTextContent("500");

    await user.click(screen.getByRole("button", { name: "Guardar programa" }));

    await waitFor(() => expect(configure).toHaveBeenCalledTimes(1));
    expect(configure).toHaveBeenCalledWith(
      expect.objectContaining({
        copPerPointUnit: 400,
        pointsPerCopUnit: 100,
        budgetRate: 0.025,
      }),
    );
  });

  it("integra datos económicos en la tasa sugerida, simulador e impacto financiero", () => {
    economicData.current = {
      id: "eco-1",
      business_id: "biz-1",
      daily_avg_sales: 200000,
      monthly_operation_days: 26,
      daily_gain: 60000,
      gross_margin: 30,
      avg_customers_per_day: 20,
      max_monthly_reward_budget: 104000,
      data_status: {
        daily_avg_sales: "confirmed",
        monthly_operation_days: "confirmed",
        daily_gain: "confirmed",
        gross_margin: "confirmed",
        avg_customers_per_day: "confirmed",
        max_monthly_reward_budget: "confirmed",
      },
      updated_by: "user-admin",
      updated_at: "2026-10-24T12:00:00.000Z",
    };

    renderPage();

    expect(screen.getByLabelText("Tasa de presupuesto (%)")).toHaveValue("2");
    expect(screen.getByLabelText("COP por moneda ganada")).toHaveValue("500");
    expect(screen.getByText(/Simulador de compra/i)).toBeInTheDocument();
    expect(screen.getByText(/En tu ticket promedio \(\$ 10\.000\)/)).toBeInTheDocument();
    expect(screen.getByText(/5\.200\.000/)).toBeInTheDocument();
    expect(screen.getAllByText(/6\.7 %/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/28\.0 %/).length).toBeGreaterThan(0);
  });

  it("muestra alerta cuando falla el perfil económico y con tasa 0 %", async () => {
    const user = userEvent.setup();
    economicErrorState.isError = true;
    renderPage();

    expect(screen.getByText(/No pudimos cargar tus datos económicos/i)).toBeInTheDocument();

    const budgetInput = screen.getByLabelText("Tasa de presupuesto (%)");
    await user.clear(budgetInput);
    await user.type(budgetInput, "0");

    expect(
      screen.getByText(
        /El costo estimado de canje \(1\.0 %\) supera el presupuesto declarado \(0\.0 %\)/i,
      ),
    ).toBeInTheDocument();
  });
});
