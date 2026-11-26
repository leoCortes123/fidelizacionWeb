import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { CustomerBusinessHomePage } from "@/features/customer/CustomerBusinessHomePage";
import type {
  Business,
  CustomerBusinessSummary,
  LoyaltyRewardAvailable,
  MyPurchasePageRow,
  Product,
} from "@/types";

const state = vi.hoisted(() => ({
  businesses: [] as Business[],
  summary: {
    data: [] as CustomerBusinessSummary[],
    isLoading: false,
    isError: false,
    error: null as Error | null,
    refetch: vi.fn(),
  },
  rewards: {
    data: [] as LoyaltyRewardAvailable[],
    isLoading: false,
    isError: false,
    error: null as Error | null,
    refetch: vi.fn(),
  },
  products: {
    data: [] as Product[],
    isLoading: false,
    isError: false,
    error: null as Error | null,
    refetch: vi.fn(),
  },
}));

vi.mock("@/features/auth/AuthProvider", () => ({
  useAuth: () => ({ displayName: "Carla Cliente", user: { id: "cust-1" } }),
}));

vi.mock("@/features/loyalty/businessContext", () => ({
  useBusinessContext: () => ({
    businesses: state.businesses,
    selectedBusiness: state.businesses[0] ?? null,
    selectedRole: "cliente",
    canApproveRedemptions: false,
    setSelectedBusiness: vi.fn(),
  }),
}));

vi.mock("@/features/loyalty/hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/loyalty/hooks")>();
  return {
    ...actual,
    useCustomerBusinessesSummary: () => state.summary,
    useBusinessPublic: () => ({ data: null, isLoading: false, isError: false }),
    useLoyaltyPointAccount: () => ({
      data: { balance: 250, lifetime_earned: 500, lifetime_spent: 250 },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    }),
    useLoyaltyPointTransactions: () => ({
      data: [],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    }),
    useCustomerPointsExpirySummary: () => ({
      data: null,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    }),
    useLoyaltyRewardsAvailable: () => state.rewards,
    useProducts: () => state.products,
    useLoyaltyProgram: () => ({
      data: null,
      isLoading: false,
      isError: false,
    }),
    useRequestRedemption: () => ({
      isPending: false,
      mutateAsync: vi.fn(),
    }),
  };
});

vi.mock("@/features/purchases/hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/purchases/hooks")>();
  return {
    ...actual,
    useMyPurchasesPage: () => ({
      data: [] as MyPurchasePageRow[],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    }),
    useBusinessPurchaseDetail: () => ({ data: null, isLoading: false, isError: false }),
    useMyPurchaseDetail: () => ({ data: null, isLoading: false, isError: false }),
  };
});

function businessRow(overrides: Partial<Business> = {}): Business {
  return {
    id: "biz-1",
    name: "Café Dorado",
    slug: "cafe-dorado",
    logo_url: "https://example.com/cafe-hero.jpg",
    timezone: "America/Bogota",
    operating_days: [1, 2, 3, 4, 5, 6, 7],
    is_active: true,
    created_by: null,
    created_at: "2026-11-01T10:00:00Z",
    updated_at: "2026-11-01T10:00:00Z",
    role: "cliente",
    can_approve_redemptions: false,
    ...overrides,
  };
}

function summaryRow(overrides: Partial<CustomerBusinessSummary> = {}): CustomerBusinessSummary {
  return {
    business_id: "biz-1",
    name: "Café Dorado",
    slug: "cafe-dorado",
    logo_url: "https://example.com/cafe-hero.jpg",
    role: "cliente",
    loyalty_active: true,
    balance: 250,
    ready_rewards: 1,
    pending_redemptions: 0,
    last_purchase_at: null,
    is_frequent: false,
    is_frequent_active: false,
    ...overrides,
  };
}

function rewardRow(overrides: Partial<LoyaltyRewardAvailable> = {}): LoyaltyRewardAvailable {
  return {
    id: "rew-1",
    name: "Café gratis",
    type: "free_product",
    description: "Espresso o americano",
    image_url: "https://example.com/reward.jpg",
    points_required: 100,
    min_purchase_amount: 0,
    max_discount_amount: null,
    discount_percentage: null,
    product_price_cop: null,
    product_cost_cop: null,
    balance: 250,
    remaining: 0,
    can_redeem: true,
    valid_from: null,
    valid_until: null,
    ...overrides,
  };
}

function productRow(overrides: Partial<Product> = {}): Product {
  return {
    id: "prod-1",
    business_id: "biz-1",
    name: "Latte frío",
    description: "Con leche de almendras",
    price_cop: 12000,
    cost_cop: 5000,
    is_active: true,
    kind: "simple",
    combo_items: [],
    image_url: "https://example.com/product.jpg",
    created_at: "2026-11-01T10:00:00Z",
    updated_at: "2026-11-01T10:00:00Z",
    ...overrides,
  };
}

function renderPage(businessId = "biz-1") {
  return render(
    <MemoryRouter initialEntries={[`/customer/business/${businessId}`]}>
      <Routes>
        <Route path="/customer/business/:businessId" element={<CustomerBusinessHomePage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("CustomerBusinessHomePage", () => {
  beforeEach(() => {
    state.businesses = [businessRow()];
    state.summary.data = [summaryRow()];
    state.rewards.data = [rewardRow()];
    state.products.data = [productRow()];
  });

  it("renders business logo filling #profileHeroStage when logo_url is present", () => {
    const { container } = renderPage();
    const heroStage = container.querySelector("#profileHeroStage");
    expect(heroStage).not.toBeNull();

    const heroBgImg = heroStage?.querySelector("img.card-hero-bg-img") as HTMLImageElement | null;
    expect(heroBgImg).not.toBeNull();
    expect(heroBgImg?.src).toBe("https://example.com/cafe-hero.jpg");
    expect(container.querySelector("#profileSpriteBox")).toBeNull();
  });

  it("renders fallback pixel sprite in #profileHeroStage when logo_url is null", () => {
    state.summary.data = [summaryRow({ logo_url: null })];
    const { container } = renderPage();
    const heroStage = container.querySelector("#profileHeroStage");
    expect(heroStage?.querySelector("img.card-hero-bg-img")).toBeNull();
    expect(container.querySelector("#profileSpriteBox")).not.toBeNull();
  });

  it("renders reward image in card and in detail modal (.modal-hero-img)", async () => {
    const user = userEvent.setup();
    const { container } = renderPage();

    const cardImg = screen.getByAltText("Café gratis") as HTMLImageElement;
    expect(cardImg.src).toBe("https://example.com/reward.jpg");

    await user.click(cardImg);

    const modalHeroImg = container.querySelector(
      ".modal-hero-img img.card-hero-bg-img",
    ) as HTMLImageElement | null;
    expect(modalHeroImg).not.toBeNull();
    expect(modalHeroImg?.src).toBe("https://example.com/reward.jpg");
  });

  it("renders product image in CARTA tab and in product detail modal (.modal-hero-img)", async () => {
    const user = userEvent.setup();
    const { container } = renderPage();

    await user.click(screen.getByRole("tab", { name: "CARTA" }));

    const productImg = screen.getByAltText("Latte frío") as HTMLImageElement;
    expect(productImg.src).toBe("https://example.com/product.jpg");

    await user.click(productImg);

    const modalHeroImg = container.querySelector(
      ".modal-hero-img img.card-hero-bg-img",
    ) as HTMLImageElement | null;
    expect(modalHeroImg).not.toBeNull();
    expect(modalHeroImg?.src).toBe("https://example.com/product.jpg");
  });

  it("oculta el texto de saldo debajo de la imagen y abre el modal de datos del negocio", async () => {
    const user = userEvent.setup();
    renderPage();

    expect(screen.queryByText(/Saldo, recompensas, carta y compras/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Ver datos del negocio" }));
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveTextContent("@cafe-dorado");

    await user.click(screen.getByRole("button", { name: "CERRAR" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("ajusta --title-fit-scale en #profileStoreName cuando el nombre del negocio es largo", () => {
    const clientWidthSpy = vi
      .spyOn(HTMLElement.prototype, "clientWidth", "get")
      .mockImplementation(function (this: HTMLElement) {
        return this.id === "profileStoreName" ? 180 : 0;
      });
    const scrollWidthSpy = vi
      .spyOn(HTMLElement.prototype, "scrollWidth", "get")
      .mockImplementation(function (this: HTMLElement) {
        return this.id === "profileStoreName" ? 360 : 0;
      });

    try {
      renderPage();

      const title = document.getElementById("profileStoreName")!;
      expect(title.style.getPropertyValue("--title-fit-scale")).toBe("0.5000");
    } finally {
      clientWidthSpy.mockRestore();
      scrollWidthSpy.mockRestore();
    }
  });
});
