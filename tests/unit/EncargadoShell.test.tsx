import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { EncargadoShell } from "@/components/layout/EncargadoShell";
import { ThemeProvider } from "@/components/theme/ThemeProvider";

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
    role: "encargado" as const,
    can_approve_redemptions: true,
  },
}));

vi.mock("@/features/auth/AuthProvider", () => ({
  useAuth: () => ({
    roles: ["encargado"],
    signOut: vi.fn(),
  }),
}));

vi.mock("@/features/profile/hooks", () => ({
  useMyProfile: () => ({
    data: { id: "user-1", email: "test@example.com", full_name: "Test User" },
    isLoading: false,
  }),
}));

vi.mock("@/features/loyalty/businessContext", () => {
  const context = {
    selectedBusiness: fixture.business,
    businesses: [fixture.business],
    selectedRole: "encargado",
    canApproveRedemptions: true,
    setSelectedBusiness: vi.fn(),
  };
  return {
    useOptionalBusinessContext: () => context,
    useBusinessContext: () => context,
  };
});

function renderShell(initialEntry = "/encargado") {
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={[initialEntry]}>
        <EncargadoShell />
      </MemoryRouter>
    </ThemeProvider>,
  );
}

describe("EncargadoShell", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza el panel superior (header) con el nombre del negocio y badge de encargado", () => {
    renderShell();

    const header = screen.getByTestId("app-header");
    expect(header).toBeInTheDocument();
    expect(header).toHaveTextContent("Taquería El Fogón");
    expect(header).toHaveTextContent("ENCARGADO · NEGOCIO");
  });

  it("renderiza el menú inferior móvil con Inicio, Generar venta y Solicitudes", () => {
    renderShell();

    const bottomNav = screen.getByRole("navigation", { name: "Navegación inferior" });
    expect(bottomNav).toBeInTheDocument();

    const inicioLink = screen.getAllByRole("link", { name: /^Inicio$/i });
    expect(inicioLink.some((l) => l.getAttribute("href") === "/encargado")).toBe(true);

    const ventaLink = screen.getAllByRole("link", { name: /^Generar venta$/i });
    expect(ventaLink.some((l) => l.getAttribute("href") === "/encargado/venta")).toBe(true);

    const solicitudesLink = screen.getAllByRole("link", { name: /Solicitudes/i });
    expect(solicitudesLink.some((l) => l.getAttribute("href") === "/encargado/solicitudes")).toBe(true);
  });

  it("muestra el botón flotante FAB para registrar venta en el dashboard", () => {
    renderShell("/encargado");

    const fab = screen.getByLabelText(/Registrar (venta|compra)/);
    expect(fab).toBeInTheDocument();
    expect(fab).toHaveAttribute("href", "/encargado/venta");
  });
});
