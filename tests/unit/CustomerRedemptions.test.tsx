import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { RedemptionsPage } from "@/features/customer/RedemptionsPage";
import type { MyLoyaltyRedemption } from "@/types";

const rows = vi.hoisted(() => ({ current: [] as MyLoyaltyRedemption[] }));

vi.mock("@/features/loyalty/hooks", () => ({
  useMyLoyaltyRedemptions: () => ({
    data: rows.current,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

const businesses = vi.hoisted(() => ({ current: [] as Array<{ id: string; name: string }> }));

vi.mock("@/features/loyalty/businessContext", () => ({
  useBusinessContext: () => ({ businesses: businesses.current }),
}));

const pending: MyLoyaltyRedemption = {
  id: "red-1",
  business_id: "biz-1",
  business_name: "Taquería El Fogón",
  reward_name: "Taco gratis",
  reward_type: "free_product",
  points_spent: 40,
  code: "TPAAAA1111",
  status: "pending",
  created_at: "2026-10-20T12:00:00.000Z",
  approved_at: null,
  delivered_at: null,
  cancelled_at: null,
};

function renderPage() {
  return render(
    <MemoryRouter>
      <RedemptionsPage />
    </MemoryRouter>,
  );
}

describe("RedemptionsPage del cliente", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    rows.current = [pending];
    businesses.current = [{ id: "biz-1", name: "Taquería El Fogón" }];
  });

  it("muestra el estado de cada solicitud, el negocio y no ofrece botones de QR", () => {
    renderPage();

    expect(screen.getByText("Taco gratis")).toBeInTheDocument();
    expect(screen.getByText("Pendiente de validar")).toBeInTheDocument();
    expect(screen.getByText("Taquería El Fogón")).toBeInTheDocument();
    expect(screen.getByText(/40 loopoints/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /QR/i })).not.toBeInTheDocument();
  });

  it("muestra el estado aprobado para recoger en caja", () => {
    rows.current = [
      {
        ...pending,
        status: "approved",
        approved_at: "2026-10-21T12:00:00.000Z",
      },
    ];
    renderPage();

    expect(screen.getByText("Aprobado")).toBeInTheDocument();
    expect(screen.getByText(/aprobó tu canje/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /QR/i })).not.toBeInTheDocument();
  });

  it("muestra el estado vacío con acceso a los negocios", () => {
    rows.current = [];
    renderPage();

    expect(screen.getByText("Aún no has solicitado recompensas")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver mis negocios" })).toBeInTheDocument();
  });

  it("filtra los canjes por negocio y muestra el detalle", async () => {
    const user = userEvent.setup();
    businesses.current = [
      { id: "biz-1", name: "Taquería El Fogón" },
      { id: "biz-2", name: "Café Central" },
    ];
    rows.current = [
      pending,
      {
        ...pending,
        id: "red-2",
        business_id: "biz-2",
        business_name: "Café Central",
        reward_name: "Café gratis",
        business_slug: "cafe-central",
        status: "delivered",
        delivered_at: "2026-10-22T15:00:00.000Z",
      },
    ];
    renderPage();

    await user.click(screen.getByRole("combobox", { name: "Filtrar canjes por negocio" }));
    await user.click(await screen.findByRole("option", { name: "Café Central" }));

    expect(screen.queryByText("Taco gratis")).not.toBeInTheDocument();
    expect(screen.getByText("Café gratis")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Ver detalle" }));
    const dialog = within(screen.getByRole("dialog"));
    expect(dialog.getByText(/Café Central/)).toBeInTheDocument();
    expect(dialog.getByText(/@cafe-central/)).toBeInTheDocument();
    expect(dialog.getAllByText("Entregado").length).toBeGreaterThan(0);
  });
});
