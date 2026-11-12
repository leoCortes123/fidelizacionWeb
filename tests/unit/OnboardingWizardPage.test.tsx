import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { OnboardingWizardPage } from "@/features/loyalty/OnboardingWizardPage";
import type { Business, BusinessEconomicProfile, LoyaltyProgram, Product } from "@/types";

const registerBusiness = vi.hoisted(() => vi.fn());
const saveBusiness = vi.hoisted(() => vi.fn());
const saveReward = vi.hoisted(() => vi.fn());
const configure = vi.hoisted(() => vi.fn());
const upsertEconomic = vi.hoisted(() => vi.fn());
const refreshRoles = vi.hoisted(() => vi.fn());
const setSelectedBusiness = vi.hoisted(() => vi.fn());
const state = vi.hoisted(() => ({
  profile: null as BusinessEconomicProfile | null,
  program: null as LoyaltyProgram | null,
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
  program: {
    id: "prog-1",
    business_id: "biz-1",
    cop_per_point_unit: 1000,
    points_per_cop_unit: 100,
    points_expiry_days: 365,
    budget_rate: 0.01,
    first_purchase_bonus_points: 0,
    recurrence_bonus_points: 0,
    referral_bonus_points: 0,
    qr_expiry_hours: 24,
    is_active: false,
    configured_by: "user-admin",
    configured_at: "2026-01-01T12:00:00.000Z",
    created_at: "2026-01-01T12:00:00.000Z",
    updated_at: "2026-01-01T12:00:00.000Z",
  } as LoyaltyProgram,
  products: [
    {
      id: "prod-taco",
      business_id: "biz-1",
      name: "Taco de guisado",
      description: null,
      price_cop: 2500,
      cost_cop: 800,
      is_active: true,
      created_at: "2026-01-01T12:00:00.000Z",
      updated_at: "2026-01-01T12:00:00.000Z",
    },
    {
      id: "prod-agua",
      business_id: "biz-1",
      name: "Agua fresca",
      description: null,
      price_cop: 1200,
      cost_cop: null,
      is_active: true,
      created_at: "2026-01-01T12:00:00.000Z",
      updated_at: "2026-01-01T12:00:00.000Z",
    },
  ] as Product[],
  profile: {
    id: "profile-1",
    business_id: "biz-1",
    daily_avg_sales: 200000,
    monthly_operation_days: 26,
    daily_gain: null,
    gross_margin: null,
    avg_customers_per_day: null,
    max_monthly_reward_budget: 100000,
    data_status: {
      daily_avg_sales: "confirmed",
      monthly_operation_days: "confirmed",
      daily_gain: "unknown",
      gross_margin: "unknown",
      avg_customers_per_day: "unknown",
      max_monthly_reward_budget: "confirmed",
    },
    updated_by: "user-admin",
    updated_at: "2026-10-25T12:00:00.000Z",
  } as BusinessEconomicProfile,
}));

vi.mock("@/features/auth/AuthProvider", () => ({
  useAuth: () => ({
    user: { id: "user-admin" },
    refreshRoles,
  }),
}));

vi.mock("@/features/loyalty/hooks", () => ({
  useBusinesses: () => ({
    data: [fixture.business],
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  useLoyaltyProgram: () => ({
    data: state.program,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  useProducts: () => ({
    data: fixture.products,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  useBusinessEconomicProfile: () => ({
    data: state.profile,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  useLoyaltyRewards: () => ({
    data: [],
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  useRegisterBusiness: () => ({ mutateAsync: registerBusiness, isPending: false }),
  useUpdateBusiness: () => ({ mutateAsync: saveBusiness, isPending: false }),
  useUpsertLoyaltyReward: () => ({ mutateAsync: saveReward, isPending: false }),
  useConfigureLoyaltyProgram: () => ({ mutateAsync: configure, isPending: false }),
  useUpsertEconomicProfile: () => ({ mutateAsync: upsertEconomic, isPending: false }),
}));

vi.mock("@/features/loyalty/businessContext", () => ({
  persistBusinessSelection: vi.fn(),
  useBusinessContext: () => ({
    selectedBusiness: fixture.business as Business,
    businesses: [fixture.business],
    selectedRole: "admin",
    canApproveRedemptions: false,
    setSelectedBusiness,
  }),
}));

function renderPage(props: { newBusinessMode?: boolean; initialEntry?: string } = {}) {
  return render(
    <MemoryRouter initialEntries={[props.initialEntry ?? "/admin/onboarding"]}>
      <OnboardingWizardPage newBusinessMode={props.newBusinessMode} />
    </MemoryRouter>,
  );
}

function setDraft(partial: Record<string, unknown>, key = "fidelizacion:onboarding:biz-1") {
  window.localStorage.setItem(
    key,
    JSON.stringify({
      version: 3,
      step: 0,
      name: "Taquería El Fogón",
      slug: "taqueria-el-fogon",
      slugEditedManually: false,
      timezone: "America/Bogota",
      operatingDays: [1, 2, 3, 4, 5, 6],
      copPerPointUnit: "1000",
      budgetRatePercent: "1",
      budgetRateEdited: false,
      pointsExpiryDays: "365",
      qrExpiryHours: "24",
      rewardPoints: {},
      includedRewards: {},
      savedAt: "2026-10-25T12:00:00.000Z",
      ...partial,
    }),
  );
}

describe("OnboardingWizardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    state.profile = fixture.profile;
    state.program = fixture.program;
    registerBusiness.mockResolvedValue({
      business_id: "biz-new",
      membership_id: "mem-new",
      role: "admin",
      created_at: "2026-11-11T12:00:00.000Z",
    });
    saveBusiness.mockResolvedValue({});
    saveReward.mockResolvedValue({});
    configure.mockResolvedValue({});
    refreshRoles.mockResolvedValue(undefined);
    upsertEconomic.mockResolvedValue({
      business_id: "biz-1",
      updated_at: "2026-10-25T13:00:00.000Z",
    });
  });

  it("omite Carta y costos, guarda los datos del negocio y avanza al paso 2 (Datos económicos)", async () => {
    const user = userEvent.setup();
    renderPage();

    expect(screen.queryByText(/Carta y costos/i)).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Paso 1 · Datos del negocio/i }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Guardar y continuar/i }));

    await waitFor(() => expect(saveBusiness).toHaveBeenCalledTimes(1));
    expect(saveBusiness).toHaveBeenCalledWith(
      expect.objectContaining({
        businessId: "biz-1",
        name: "Taquería El Fogón",
        timezone: "America/Bogota",
        operatingDays: [1, 2, 3, 4, 5, 6],
      }),
    );
    expect(
      await screen.findByRole("heading", { name: /Paso 2 · Datos económicos/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Todos estos datos son opcionales/i)).toBeInTheDocument();
    expect(screen.getByText(/análisis financiero/i)).toBeInTheDocument();
  });

  it("registra un nuevo negocio directamente desde el paso 1 del onboarding", async () => {
    const user = userEvent.setup();
    renderPage({ newBusinessMode: true });

    await user.type(screen.getByLabelText("Nombre del negocio"), "Café Aurora");
    expect(screen.getByLabelText("Slug (identificador en URL)")).toHaveValue("cafe-aurora");

    await user.click(screen.getByRole("button", { name: "Lun–Vie" }));
    await user.click(screen.getByRole("button", { name: /Guardar y continuar/i }));

    await waitFor(() => expect(registerBusiness).toHaveBeenCalledTimes(1));
    expect(registerBusiness).toHaveBeenCalledWith({
      name: "Café Aurora",
      slug: "cafe-aurora",
      timezone: "America/Bogota",
    });
    expect(saveBusiness).toHaveBeenCalledWith(
      expect.objectContaining({
        businessId: "biz-new",
        operatingDays: [1, 2, 3, 4, 5],
      }),
    );
    expect(refreshRoles).toHaveBeenCalledTimes(1);
    expect(
      await screen.findByRole("heading", { name: /Paso 2 · Datos económicos/i }),
    ).toBeInTheDocument();
  });

  it("recupera el borrador guardado en localStorage sin mostrar el letrero de borrador recuperado", () => {
    setDraft({ step: 1, name: "Nombre guardado" });
    renderPage();

    expect(screen.queryByText(/Borrador recuperado/i)).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Paso 2 · Datos económicos/i })).toBeInTheDocument();
    expect(screen.getByText("Nombre guardado")).toBeInTheDocument();
  });

  it("calcula la propuesta y activa el programa con recompensas", async () => {
    const user = userEvent.setup();
    setDraft({ step: 2 });
    renderPage();

    expect(screen.getByLabelText("COP por loopoint ganado")).toHaveValue("1000");
    expect(screen.getByLabelText("Tasa de presupuesto (%)")).toHaveValue("1");
    expect(screen.getByLabelText("Loopoints para Taco de guisado")).toHaveValue("80");
    expect(screen.getAllByText(/52\.000/).length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: /Activar programa/i }));

    await waitFor(() => expect(saveReward).toHaveBeenCalledTimes(1));
    expect(saveReward).toHaveBeenCalledWith(
      expect.objectContaining({
        businessId: "biz-1",
        type: "free_product",
        productId: "prod-taco",
        name: "Taco de guisado gratis",
        pointsRequired: 80,
        isActive: true,
      }),
    );
    expect(configure).toHaveBeenCalledWith(
      expect.objectContaining({
        businessId: "biz-1",
        copPerPointUnit: 1000,
        pointsPerCopUnit: 100,
        budgetRate: 0.01,
        isActive: true,
      }),
    );
    expect(window.localStorage.getItem("fidelizacion:onboarding:biz-1")).toBeNull();
  });

  it("calcula automáticamente impacto en utilidad, margen y tasa de presupuesto cuando hay datos económicos", () => {
    state.program = {
      ...fixture.program,
      configured_at: null,
    };
    state.profile = {
      ...fixture.profile,
      daily_avg_sales: 200000,
      monthly_operation_days: 26,
      daily_gain: 60000,
      gross_margin: 30,
      avg_customers_per_day: 40,
      max_monthly_reward_budget: 104000,
      data_status: {
        daily_avg_sales: "confirmed",
        monthly_operation_days: "confirmed",
        daily_gain: "confirmed",
        gross_margin: "confirmed",
        avg_customers_per_day: "confirmed",
        max_monthly_reward_budget: "confirmed",
      },
    };
    setDraft({ step: 2 });
    renderPage();

    expect(screen.getByLabelText("Tasa de presupuesto (%)")).toHaveValue("2");
    expect(screen.getByText(/1\.560\.000/)).toBeInTheDocument();
    expect(screen.getAllByText(/6\.7 %/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/28\.0 %/i)).toBeInTheDocument();
    expect(screen.getByText(/5 loopoint\(s\)/i)).toBeInTheDocument();
  });

  it("explica qué indicadores faltan cuando no hay datos económicos", () => {
    state.profile = null;
    setDraft({ step: 2 });
    renderPage();

    expect(screen.getByText(/No se pueden calcular las ventas mensuales/i)).toBeInTheDocument();
    expect(screen.getByText(/no se puede estimar cuánto absorbe el programa/i)).toBeInTheDocument();
  });

  it("acepta coma decimal en tasa de presupuesto, interpreta miles con punto y rechaza tasa vacía", async () => {
    const user = userEvent.setup();
    setDraft({ step: 2 });
    renderPage();

    const rateInput = screen.getByLabelText("Tasa de presupuesto (%)");
    const expiryInput = screen.getByLabelText("Vencimiento de loopoints (días)");

    await user.clear(rateInput);
    await user.click(screen.getByRole("button", { name: /Activar programa/i }));
    expect(configure).not.toHaveBeenCalled();
    expect(screen.getByText(/tasa de presupuesto debe ser un número/i)).toBeInTheDocument();

    await user.type(rateInput, "2,5");
    await user.clear(expiryInput);
    await user.type(expiryInput, "1.000");

    await user.click(screen.getByRole("button", { name: /Activar programa/i }));

    await waitFor(() => expect(configure).toHaveBeenCalledTimes(1));
    expect(configure).toHaveBeenCalledWith(
      expect.objectContaining({
        budgetRate: 0.025,
        pointsExpiryDays: 1000,
      }),
    );
  });

  it("aplica presets de días de operación y muestra resumen en vivo", async () => {
    const user = userEvent.setup();
    renderPage();

    expect(screen.getByText(/Resumen del programa/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Lun–Vie" }));

    expect(screen.getByRole("button", { name: "Sáb" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText(/5 días de operación/i)).toBeInTheDocument();
    expect(screen.getByText(/~21 días de operación al mes/i)).toBeInTheDocument();
  });

  it("no guarda borrador en localStorage hasta que el usuario edita y limpia al reiniciar", async () => {
    const user = userEvent.setup();
    renderPage();

    expect(window.localStorage.getItem("fidelizacion:onboarding:biz-1")).toBeNull();

    await user.click(screen.getByRole("button", { name: "Lun–Vie" }));
    expect(window.localStorage.getItem("fidelizacion:onboarding:biz-1")).not.toBeNull();

    await user.click(screen.getByRole("button", { name: /Reiniciar borrador/i }));
    expect(window.localStorage.getItem("fidelizacion:onboarding:biz-1")).toBeNull();
  });

  it("en el paso 2 sugiere días desde el horario, calcula el margen bruto automáticamente y deriva desconocido para 0/vacío", async () => {
    const user = userEvent.setup();
    state.profile = null;
    setDraft({ step: 1 });
    renderPage();

    expect(screen.queryByLabelText("Estado del dato")).not.toBeInTheDocument();
    const daysInput = screen.getByLabelText("Días de operación al mes");
    expect(daysInput).toHaveValue("26");
    expect(screen.getByText("Calculado según tu horario")).toBeInTheDocument();
    expect(screen.getAllByText("Desconocido")).toHaveLength(5);

    const salesInput = screen.getByLabelText("Ventas diarias promedio");
    const gainInput = screen.getByLabelText("Ganancia diaria");
    await user.type(salesInput, "200000");
    await user.type(gainInput, "60000");

    expect(screen.getByLabelText("Margen bruto")).toHaveValue("30");
    expect(screen.getByText("Calculado automáticamente")).toBeInTheDocument();

    await user.clear(daysInput);
    await user.type(daysInput, "0");

    expect(screen.getAllByText("Confirmado")).toHaveLength(3);
    expect(screen.getAllByText("Desconocido")).toHaveLength(3);

    await user.click(screen.getByRole("button", { name: /Guardar y continuar/i }));

    await waitFor(() => expect(upsertEconomic).toHaveBeenCalledTimes(1));
    expect(upsertEconomic).toHaveBeenCalledWith(
      expect.objectContaining({
        businessId: "biz-1",
        dailyAvgSales: 200000,
        monthlyOperationDays: null,
        dailyGain: 60000,
        grossMargin: 30,
        avgCustomersPerDay: null,
        maxMonthlyRewardBudget: null,
        dataStatus: {
          daily_avg_sales: "confirmed",
          monthly_operation_days: "unknown",
          daily_gain: "confirmed",
          gross_margin: "confirmed",
          avg_customers_per_day: "unknown",
          max_monthly_reward_budget: "unknown",
        },
      }),
    );
    expect(
      await screen.findByRole("heading", { name: /Paso 3 · Programa y activación/i }),
    ).toBeInTheDocument();
  });

  it("en el paso 2 trata valores guardados en 0 como desconocidos, limpia al vaciar y bloquea inválidos", async () => {
    const user = userEvent.setup();
    state.profile = {
      ...fixture.profile,
      daily_avg_sales: 0,
      monthly_operation_days: 26,
      daily_gain: null,
      gross_margin: 30,
      avg_customers_per_day: 0,
      max_monthly_reward_budget: null,
      data_status: {
        daily_avg_sales: "confirmed",
        monthly_operation_days: "estimated",
        daily_gain: "unknown",
        gross_margin: "estimated",
        avg_customers_per_day: "estimated",
        max_monthly_reward_budget: "unknown",
      },
    };
    setDraft({ step: 1 });
    renderPage();

    expect(screen.getByLabelText("Ventas diarias promedio")).toHaveValue("");
    const daysInput = screen.getByLabelText("Días de operación al mes");
    expect(daysInput).toHaveValue("26");
    expect(screen.getAllByText("Confirmado")).toHaveLength(2);
    expect(screen.getAllByText("Desconocido")).toHaveLength(4);

    await user.clear(daysInput);
    await user.type(daysInput, "40");
    expect(screen.getByText("Por revisar")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Guardar y continuar/i }));
    expect(upsertEconomic).not.toHaveBeenCalled();
    expect(screen.getByText(/Debe estar entre 1 y 31/i)).toBeInTheDocument();

    await user.clear(daysInput);
    await user.click(screen.getByRole("button", { name: /Guardar y continuar/i }));

    await waitFor(() => expect(upsertEconomic).toHaveBeenCalledTimes(1));
    expect(upsertEconomic).toHaveBeenCalledWith(
      expect.objectContaining({
        dailyAvgSales: null,
        monthlyOperationDays: null,
        grossMargin: 30,
        dataStatus: {
          daily_avg_sales: "unknown",
          monthly_operation_days: "unknown",
          daily_gain: "unknown",
          gross_margin: "confirmed",
          avg_customers_per_day: "unknown",
          max_monthly_reward_budget: "unknown",
        },
      }),
    );
  });
});
