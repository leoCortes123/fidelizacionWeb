import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
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
    useBusinessPublic: () => ({ data: null, isLoading: false, isError: false }),
    useCustomerBusinessesClosestRewards: (businesses: CustomerBusinessSummary[]) => {
      const byBusinessId = new Map();
      const rewardsByBusinessId = new Map<string, LoyaltyRewardAvailable[]>();
      const items = businesses
        .map((biz) => {
          const list = rewardsByBusiness.current[biz.business_id] ?? [];
          rewardsByBusinessId.set(biz.business_id, list);
          const info = actual.computeClosestRewardInfo(biz, list);
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

      return { items, byBusinessId, rewardsByBusinessId, isLoading: false };
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

describe("CustomerBusinessesPage (Diseño 2 Pixel Art)", () => {
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

  it("muestra la tarjeta arcade del negocio actual y permite navegar entre negocios con las flechas", async () => {
    const user = userEvent.setup();
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

    expect(screen.getByTestId("total-points-balance")).toHaveTextContent("60");
    expect(screen.getByRole("heading", { name: "Taquería El Fogón" })).toBeInTheDocument();
    expect(screen.getByText("50")).toBeInTheDocument();
    expect(screen.getByText("FRECUENTE ACTIVO")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /MÁS RECOMPENSAS/i })).toHaveAttribute(
      "href",
      "/customer/business/biz-1",
    );

    await user.click(screen.getByRole("button", { name: "Siguiente negocio" }));
    expect(screen.getByRole("heading", { name: "Café Central" })).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /MÁS RECOMPENSAS/i })).toHaveAttribute(
      "href",
      "/customer/business/biz-2",
    );

    await user.click(screen.getByRole("button", { name: "Siguiente negocio" }));
    expect(screen.getByRole("heading", { name: "Tienda Verde" })).toBeInTheDocument();
    expect(screen.getAllByText(/PROGRAMA INACTIVO/i).length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: "Negocio anterior" }));
    expect(screen.getByRole("heading", { name: "Café Central" })).toBeInTheDocument();
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

  it("muestra hasta 3 recompensas del negocio y abre el modal de detalle al seleccionar una", async () => {
    const user = userEvent.setup();
    summary.current.data = [
      row({
        business_id: "biz-1",
        name: "La Forja Burger",
        slug: "la-forja-burger",
        balance: 950,
      }),
    ];

    rewardsByBusiness.current = {
      "biz-1": [
        rewardFixture({
          id: "rew-1",
          name: "Papas Rústicas",
          description: "Porción grande de papas en cascos",
          points_required: 600,
          balance: 950,
          remaining: 0,
          can_redeem: true,
        }),
        rewardFixture({
          id: "rew-2",
          name: "Malteada 8-Bits",
          description: "Malteada cremosa de vainilla",
          points_required: 950,
          balance: 950,
          remaining: 0,
          can_redeem: true,
        }),
        rewardFixture({
          id: "rew-3",
          name: "Combo Forjador",
          description: "Hamburguesa doble carne + papas",
          points_required: 1500,
          balance: 950,
          remaining: 550,
          can_redeem: false,
        }),
      ],
    };

    renderPage();

    expect(screen.getByText("Papas Rústicas")).toBeInTheDocument();
    expect(screen.getByText("600 PTS")).toBeInTheDocument();
    expect(screen.getByText("Malteada 8-Bits")).toBeInTheDocument();
    expect(screen.getByText("Combo Forjador")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Papas Rústicas/i }));
    const dialog = within(screen.getByRole("dialog"));
    expect(dialog.getByText("Papas Rústicas")).toBeInTheDocument();
    expect(dialog.getByRole("link", { name: /CANJEAR RECOMPENSA/i })).toHaveAttribute(
      "href",
      "/customer/business/biz-1",
    );
  });
});
