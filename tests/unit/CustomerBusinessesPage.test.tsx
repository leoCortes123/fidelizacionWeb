import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import {
  CustomerBusinessesPage,
  parseInvitationSlug,
} from "@/features/customer/CustomerBusinessesPage";
import type { CustomerBusinessSummary, LoyaltyRewardAvailable } from "@/types";

const summary = vi.hoisted(() => ({
  current: {
    data: [] as CustomerBusinessSummary[],
    isLoading: false,
    isError: false,
    error: null as Error | null,
    refetch: vi.fn(),
  },
}));

const rewardsByBusiness = vi.hoisted(() => ({
  current: {} as Record<string, LoyaltyRewardAvailable[]>,
}));

vi.mock("@/features/loyalty/hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/loyalty/hooks")>();
  return {
    ...actual,
    useCustomerBusinessesSummary: () => summary.current,
    useCustomerBusinessesClosestRewards: (businesses: CustomerBusinessSummary[]) => {
      const byBusinessId = new Map();
      const items = businesses
        .map((biz) => {
          const info = actual.computeClosestRewardInfo(biz, rewardsByBusiness.current[biz.business_id]);
          byBusinessId.set(biz.business_id, info);
          return info;
        })
        .sort((a, b) => {
          if (a.hasReadyReward !== b.hasReadyReward) return a.hasReadyReward ? -1 : 1;
          if (a.business.ready_rewards !== b.business.ready_rewards) {
            return b.business.ready_rewards - a.business.ready_rewards;
          }
          const aHasTarget = a.nextReward !== null;
          const bHasTarget = b.nextReward !== null;
          if (aHasTarget !== bHasTarget) return aHasTarget ? -1 : 1;
          if (b.progressPct !== a.progressPct) return b.progressPct - a.progressPct;
          if (a.remainingPoints !== b.remainingPoints) return a.remainingPoints - b.remainingPoints;
          return b.business.balance - a.business.balance;
        });

      return { items, byBusinessId, isLoading: false };
    },
  };
});

vi.mock("@/features/auth/AuthProvider", () => ({
  useAuth: () => ({ displayName: "Carla Cliente", user: { id: "cust-1" } }),
}));

function row(
  overrides: Partial<CustomerBusinessSummary> &
    Pick<CustomerBusinessSummary, "business_id" | "name" | "slug">,
): CustomerBusinessSummary {
  return {
    logo_url: null,
    role: "cliente",
    loyalty_active: true,
    balance: 0,
    ready_rewards: 0,
    pending_redemptions: 0,
    last_purchase_at: null,
    is_frequent: false,
    is_frequent_active: false,
    ...overrides,
  };
}

function renderPage(initialEntry = "/customer") {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/customer" element={<CustomerBusinessesPage />} />
        <Route path="/join/:slug" element={<p>Invitación abierta</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("CustomerBusinessesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    rewardsByBusiness.current = {};
    summary.current = {
      data: [],
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    };
  });

  it("muestra una tarjeta por negocio con su saldo y recompensas listas", () => {
    summary.current.data = [
      row({
        business_id: "biz-1",
        name: "Taquería El Fogón",
        slug: "taqueria-el-fogon",
        balance: 50,
        ready_rewards: 1,
        is_frequent: true,
        is_frequent_active: true,
        last_purchase_at: "2026-10-20T15:00:00.000Z",
      }),
      row({
        business_id: "biz-2",
        name: "Café Central",
        slug: "cafe-central",
        balance: 10,
      }),
      row({
        business_id: "biz-3",
        name: "Tienda Verde",
        slug: "tienda-verde",
        loyalty_active: false,
      }),
    ];

    renderPage();

    expect(screen.getByRole("heading", { name: /¡Hola, Carla!/ })).toBeInTheDocument();
    expect(screen.getByTestId("total-points-balance")).toHaveTextContent("60");

    const taco = screen.getByRole("link", { name: /Taquería El Fogón/ });
    expect(taco).toHaveAttribute("href", "/customer/business/biz-1");
    expect(taco).toHaveTextContent("50");
    expect(taco).toHaveTextContent("1 lista");
    expect(taco).toHaveTextContent("Frecuente activo");
    expect(taco).toHaveTextContent("Última compra registrada");

    const cafe = screen.getByRole("link", { name: /Café Central/ });
    expect(cafe).toHaveAttribute("href", "/customer/business/biz-2");
    expect(cafe).toHaveTextContent("10");

    const shop = screen.getByRole("link", { name: /Tienda Verde/ });
    expect(shop).toHaveTextContent("Programa inactivo");
    expect(shop).toHaveTextContent("Sin compras todavía");
  });

  it("muestra el estado vacío y abre una invitación por enlace o código", async () => {
    const user = userEvent.setup();
    renderPage();

    expect(screen.getByText("Aún no participas en ningún negocio")).toBeInTheDocument();

    const input = screen.getByLabelText("Enlace o código del negocio");
    await user.type(input, "no es un slug");
    await user.click(screen.getByRole("button", { name: "Abrir invitación" }));
    expect(screen.getByRole("alert")).toHaveTextContent(/Pega el enlace/i);

    await user.clear(input);
    await user.type(input, "https://loopoint.app/join/cafe-central");
    await user.click(screen.getByRole("button", { name: "Abrir invitación" }));
    expect(screen.getByText("Invitación abierta")).toBeInTheDocument();
  });

  it("interpreta enlaces y códigos de invitación", () => {
    expect(parseInvitationSlug("cafe-central")).toBe("cafe-central");
    expect(parseInvitationSlug(" https://loopoint.app/join/cafe-central ")).toBe("cafe-central");
    expect(parseInvitationSlug("https://loopoint.app/join/cafe-central?x=1")).toBe("cafe-central");
    expect(parseInvitationSlug("Cafe Central")).toBeNull();
    expect(parseInvitationSlug("")).toBeNull();
  });

  it("muestra la Player Card ordenada por recompensas más cercanas y permite cambiar de pestaña", async () => {
    const user = userEvent.setup();
    summary.current.data = [
      row({
        business_id: "biz-1",
        name: "Masa & Miel",
        slug: "masa-y-miel",
        balance: 200,
      }),
      row({
        business_id: "biz-2",
        name: "Café Aurora",
        slug: "cafe-aurora",
        balance: 90,
      }),
    ];
function rewardFixture(
  overrides: Partial<LoyaltyRewardAvailable> & Pick<LoyaltyRewardAvailable, "id" | "name">,
): LoyaltyRewardAvailable {
  return {
    type: "free_product",
    description: "",
    points_required: 100,
    min_purchase_amount: 0,
    max_discount_amount: null,
    discount_percentage: null,
    product_price_cop: null,
    product_cost_cop: null,
    balance: 0,
    remaining: 100,
    can_redeem: false,
    valid_from: null,
    valid_until: null,
    ...overrides,
  };
}

    rewardsByBusiness.current = {
      "biz-1": [
        rewardFixture({
          id: "rew-1",
          name: "Croissant",
          description: "Croissant artesanal",
          points_required: 1000,
          balance: 200,
          remaining: 800,
        }),
      ],
      "biz-2": [
        rewardFixture({
          id: "rew-2",
          name: "Café gratis",
          description: "Americano o latte",
          points_required: 100,
          balance: 90,
          remaining: 10,
        }),
      ],
    };

    renderPage();

    const region = screen.getByRole("region", {
      name: /Player Card de recompensas más cercanas/i,
    });
    expect(region).toHaveTextContent("Café Aurora");
    expect(region).toHaveTextContent("90%");
    expect(region).toHaveTextContent("Café gratis");

    const masaTab = screen.getByRole("tab", { name: "Masa & Miel" });
    await user.click(masaTab);
    expect(region).toHaveTextContent("Croissant");
    expect(region).toHaveTextContent("20%");
  });
});
