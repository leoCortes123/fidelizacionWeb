import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { RootRedirect } from "@/features/auth/RootRedirect";

const authState = vi.hoisted(() => ({
  session: null as { user: { id: string } } | null,
  roles: [] as string[],
  loading: false,
  rolesLoading: false,
  rolesLoaded: true,
}));

const resolvePostLoginPathMock = vi.hoisted(() => vi.fn());

vi.mock("@/features/auth/AuthProvider", () => ({
  useAuth: () => authState,
}));

vi.mock("@/lib/postLogin", () => ({
  resolvePostLoginPath: resolvePostLoginPathMock,
}));

function LocationEcho({ label }: { label: string }) {
  const location = useLocation();
  return (
    <div>
      {label}:{location.pathname}
      {location.search}
    </div>
  );
}

describe("RootRedirect", () => {
  beforeEach(() => {
    authState.session = null;
    authState.roles = [];
    authState.loading = false;
    authState.rolesLoading = false;
    authState.rolesLoaded = true;
    resolvePostLoginPathMock.mockReset();
  });

  it("redirige a /login cuando no hay sesión", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<LocationEcho label="LOGIN" />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("LOGIN:/login")).toBeInTheDocument();
  });

  it("conserva ?install=1 al redirigir a /login sin sesión", () => {
    render(
      <MemoryRouter initialEntries={["/?install=1"]}>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<LocationEcho label="LOGIN" />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("LOGIN:/login?install=1")).toBeInTheDocument();
  });

  it("muestra estado de carga mientras la sesión inicializa", () => {
    authState.loading = true;
    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText(/Cargando tu cuenta/i)).toBeInTheDocument();
  });

  it("redirige a /customer cuando el usuario autenticado es cliente", async () => {
    authState.session = { user: { id: "user-customer" } };
    authState.roles = ["customer"];
    resolvePostLoginPathMock.mockResolvedValue("/customer");

    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/customer" element={<LocationEcho label="CUSTOMER" />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("CUSTOMER:/customer")).toBeInTheDocument();
    });
    expect(resolvePostLoginPathMock).toHaveBeenCalledWith(["customer"], "user-customer");
  });

  it("redirige a /admin/dashboard cuando el usuario autenticado es administrador", async () => {
    authState.session = { user: { id: "user-admin" } };
    authState.roles = ["admin"];
    resolvePostLoginPathMock.mockResolvedValue("/admin/dashboard");

    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/admin/dashboard" element={<LocationEcho label="ADMIN" />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("ADMIN:/admin/dashboard")).toBeInTheDocument();
    });
    expect(resolvePostLoginPathMock).toHaveBeenCalledWith(["admin"], "user-admin");
  });
});
