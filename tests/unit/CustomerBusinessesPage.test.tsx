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
    expect(document.getElementById("cardPointsNumber")).toHaveTextContent("50");
    expect(screen.getByText("FRECUENTE ACTIVO")).toBeInTheDocument();
    expect(screen.queryByText("1 / 3")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Recompensas y carta/i })).toHaveAttribute(
      "href",
      "/customer/business/biz-1",
    );

    await user.click(screen.getByRole("button", { name: "Siguiente negocio" }));
    expect(screen.getByRole("heading", { name: "Café Central" })).toBeInTheDocument();
    expect(document.getElementById("cardPointsNumber")).toHaveTextContent("10");
    expect(screen.queryByText("2 / 3")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Recompensas y carta/i })).toHaveAttribute(
      "href",
      "/customer/business/biz-2",
    );

    await user.click(screen.getByRole("button", { name: "Siguiente negocio" }));
    expect(screen.getByRole("heading", { name: "Tienda Verde" })).toBeInTheDocument();
    expect(screen.getAllByText(/PROGRAMA INACTIVO/i).length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: "Negocio anterior" }));
    expect(screen.getByRole("heading", { name: "Café Central" })).toBeInTheDocument();

    // Preserva el foco en el botón de flecha tras cambiar de negocio y soporta teclado/puntos
    const nextBtn = screen.getByRole("button", { name: "Siguiente negocio" });
    nextBtn.focus();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("heading", { name: "Tienda Verde" })).toBeInTheDocument();
    expect(nextBtn).toHaveFocus();

    await user.click(screen.getByRole("button", { name: "Ver Café Central" }));
    expect(screen.getByRole("heading", { name: "Café Central" })).toBeInTheDocument();

    await user.keyboard("{ArrowLeft}");
    expect(screen.getByRole("heading", { name: "Taquería El Fogón" })).toBeInTheDocument();
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

  it("muestra las monedas del cliente, la próxima recompensa y la información del negocio en la tarjeta 32x32", () => {
    summary.current.data = [
      row({
        business_id: "biz-1",
        name: "La Forja Burger",
        slug: "la-forja-burger",
        balance: 950,
        ready_rewards: 2,
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

    expect(document.getElementById("cardPointsNumber")).toHaveTextContent("950");
    expect(screen.queryByText("Tus monedas aquí")).not.toBeInTheDocument();
    expect(screen.queryByText("2 listas")).not.toBeInTheDocument();
    expect(screen.getByText("Papas Rústicas")).toBeInTheDocument();
    expect(screen.getByText("Combo Forjador")).toBeInTheDocument();
    expect(screen.getByText("¡Lista para canjear!")).toBeInTheDocument();
    expect(screen.getByText("Te faltan 550 monedas")).toBeInTheDocument();
    expect(screen.getAllByRole("progressbar")).toHaveLength(2);
    expect(screen.getByRole("link", { name: /Recompensas y carta/i })).toHaveAttribute(
      "href",
      "/customer/business/biz-1",
    );
  });

  it("muestra la imagen del negocio ocupando el fondo de cardHeroStage cuando tiene logo", () => {
    summary.current.data = [
      row({
        business_id: "biz-1",
        name: "La Forja Burger",
        slug: "la-forja-burger",
        logo_url: "https://cdn.example.com/forja.png",
        balance: 200,
      }),
    ];

    renderPage();

    const heroStage = document.getElementById("cardHeroStage");
    expect(heroStage).toBeInTheDocument();
    const logoImg = within(heroStage!).getByRole("img", { name: "Logo de La Forja Burger" });
    expect(logoImg).toHaveClass("card-hero-bg-img");
  });

  it("ajusta --title-fit-scale al espacio disponible cuando el nombre del negocio es largo", async () => {
    const user = userEvent.setup();
    summary.current.data = [
      row({
        business_id: "biz-long",
        name: "Restaurante Gastronómico La Gran Fogata del Norte",
        slug: "gran-fogata",
        balance: 50,
      }),
      row({
        business_id: "biz-short",
        name: "Café",
        slug: "cafe",
        balance: 10,
      }),
    ];

    const clientWidthSpy = vi
      .spyOn(HTMLElement.prototype, "clientWidth", "get")
      .mockImplementation(function (this: HTMLElement) {
        return this.id === "cardBizTitle" ? 200 : 0;
      });
    const scrollWidthSpy = vi
      .spyOn(HTMLElement.prototype, "scrollWidth", "get")
      .mockImplementation(function (this: HTMLElement) {
        if (this.id !== "cardBizTitle") return 0;
        return this.textContent === "Café" ? 80 : 400;
      });

    try {
      renderPage();

      const title = document.getElementById("cardBizTitle")!;
      expect(title.style.getPropertyValue("--title-fit-scale")).toBe("0.5000");

      await user.click(screen.getByRole("button", { name: "Siguiente negocio" }));
      expect(title).toHaveTextContent("Café");
      expect(title.style.getPropertyValue("--title-fit-scale")).toBe("1.0000");
    } finally {
      clientWidthSpy.mockRestore();
      scrollWidthSpy.mockRestore();
    }
  });
});
