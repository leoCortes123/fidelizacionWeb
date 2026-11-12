import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { LandingPage } from "@/features/auth/LandingPage";
import { clearPendingClaim, rememberPendingClaim } from "@/lib/pendingClaim";

const resolvePostLoginPathMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/postLogin", () => ({
  resolvePostLoginPath: resolvePostLoginPathMock,
}));

const navigateMock = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

const auth = vi.hoisted(() => ({
  state: {
    session: null as null | { user: { id: string } },
    roles: [] as string[],
    rolesLoading: false,
    rolesLoaded: true,
  },
}));

vi.mock("@/features/auth/AuthProvider", () => ({
  useAuth: () => auth.state,
}));

describe("LandingPage", () => {
  beforeEach(() => {
    navigateMock.mockReset();
    resolvePostLoginPathMock.mockReset();
    clearPendingClaim();
    auth.state.session = null;
    auth.state.roles = [];
    auth.state.rolesLoading = false;
    auth.state.rolesLoaded = true;
  });

  it("muestra las secciones principales y enlaces de registro e inicio de sesión", () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Cada compra cuenta/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Quiero registrarme/i })).toHaveAttribute(
      "href",
      "/login?mode=register",
    );
    expect(screen.getByRole("link", { name: /Registrar mi negocio/i })).toHaveAttribute(
      "href",
      "/admin/onboarding?new=1",
    );
  });

  it("permite alternar negocios de ejemplo en la tarjeta interactiva", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("1.250 PTS")).toBeInTheDocument();
    expect(screen.getByText("Café gratis")).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Taquería El Fogón" }));

    expect(screen.getByText("840 PTS")).toBeInTheDocument();
    expect(screen.getByText("Tacos al pastor ×3")).toBeInTheDocument();
  });

  it("no redirige al QR pendiente cuando el cliente entra al portal web", () => {
    const token = "tok_123456789012345678901234567890";
    rememberPendingClaim(token);
    auth.state.session = { user: { id: "user-1" } };
    auth.state.roles = ["customer"];

    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    );

    expect(navigateMock).not.toHaveBeenCalled();
  });

  it("redirige al onboarding desde 'Ir a mi cuenta' cuando el administrador aún no tiene negocio", async () => {
    resolvePostLoginPathMock.mockResolvedValue("/admin/onboarding");
    auth.state.session = { user: { id: "admin-1" } };
    auth.state.roles = ["admin", "customer"];
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: /ir a mi cuenta/i }));

    expect(resolvePostLoginPathMock).toHaveBeenCalledWith(["admin", "customer"]);
    expect(navigateMock).toHaveBeenCalledWith("/admin/onboarding");
  });

  it("deshabilita 'Ir a mi cuenta' mientras los roles están cargando", () => {
    auth.state.session = { user: { id: "admin-1" } };
    auth.state.roles = ["customer"];
    auth.state.rolesLoading = true;
    auth.state.rolesLoaded = false;

    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("button", { name: /ir a mi cuenta/i })).toBeDisabled();
    expect(resolvePostLoginPathMock).not.toHaveBeenCalled();
  });
});
