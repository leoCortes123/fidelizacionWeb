import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { LoginPage } from "@/features/auth/LoginPage";
import { clearPendingClaim, pendingClaimPath, rememberPendingClaim } from "@/lib/pendingClaim";

const auth = vi.hoisted(() => ({
  signInWithGoogle: vi.fn(),
  signInWithPassword: vi.fn(),
  signUpWithPassword: vi.fn(),
  state: {
    session: null as null | { user: { id: string } },
    user: null as null | { id: string },
    roles: [] as string[],
    loading: false,
    rolesLoading: false,
    rolesLoaded: true,
    displayName: "",
  },
}));

vi.mock("@/features/auth/AuthProvider", () => ({
  useAuth: () => ({
    ...auth.state,
    signInWithGoogle: auth.signInWithGoogle,
    signInWithPassword: auth.signInWithPassword,
    signUpWithPassword: auth.signUpWithPassword,
  }),
}));

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearPendingClaim();
    auth.state.session = null;
    auth.state.user = null;
    auth.state.roles = [];
    auth.state.loading = false;
    auth.state.rolesLoading = false;
    auth.state.rolesLoaded = true;
  });

  it("inicia OAuth conservando el destino interno", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/login?next=/claim/token-123"]}>
        <LoginPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Entra a tus loopoints/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /continuar con google/i }));

    expect(auth.signInWithGoogle).toHaveBeenCalledWith("/claim/token-123");
  });

  it("permite entrar con correo y contraseña", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/login"]}>
        <LoginPage />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText(/^correo$/i), "carla@example.test");
    await user.type(screen.getByLabelText(/^contraseña$/i), "secreto123");
    await user.click(screen.getByRole("button", { name: /entrar con correo/i }));

    expect(auth.signInWithPassword).toHaveBeenCalledWith("carla@example.test", "secreto123");
  });

  it("permite crear una cuenta simple sin verificación", async () => {
    auth.signUpWithPassword.mockResolvedValue({ needsConfirmation: false });
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/login"]}>
        <LoginPage />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: /regístrate/i }));
    await user.type(screen.getByLabelText(/^nombre$/i), "Carla Cliente");
    await user.type(screen.getByLabelText(/^correo$/i), "carla@example.test");
    await user.type(screen.getByLabelText(/^contraseña$/i), "secreto123");
    await user.click(screen.getByRole("button", { name: /crear cuenta/i }));

    expect(auth.signUpWithPassword).toHaveBeenCalledWith({
      email: "carla@example.test",
      password: "secreto123",
      fullName: "Carla Cliente",
      accountType: "customer",
      nextPath: "/customer",
    });
  });

  it("ignora destinos externos y usa el portal por defecto", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/login?next=https://evil.example"]}>
        <LoginPage />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: /continuar con google/i }));

    expect(auth.signInWithGoogle).toHaveBeenCalledWith("/customer");
  });

  it("redirige al cliente a la página de inicio (/customer) y no a un QR previo cuando entra desde el portal web", async () => {
    const token = "tok_123456789012345678901234567890";
    rememberPendingClaim(token);
    auth.state.session = { user: { id: "customer-1" } };
    auth.state.user = { id: "customer-1" };
    auth.state.roles = ["customer"];

    render(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/customer" element={<div>Inicio cliente</div>} />
          <Route path="/claim/:token" element={<div>Pantalla QR</div>} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Inicio cliente")).toBeInTheDocument();
    });
    expect(screen.queryByText("Pantalla QR")).not.toBeInTheDocument();
    expect(pendingClaimPath()).toBeNull();
  });

  it("redirige a la pantalla de QR solo cuando el usuario viene por un código QR (next=/claim/:token)", async () => {
    const token = "tok_123456789012345678901234567890";
    auth.state.session = { user: { id: "customer-1" } };
    auth.state.user = { id: "customer-1" };
    auth.state.roles = ["customer"];

    render(
      <MemoryRouter initialEntries={[`/login?next=${encodeURIComponent(`/claim/${token}`)}`]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/customer" element={<div>Inicio cliente</div>} />
          <Route path="/claim/:token" element={<div>Pantalla QR</div>} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Pantalla QR")).toBeInTheDocument();
    });
  });

  it("permite seleccionar el tipo de cuenta (Cliente o Administrador) al crear una cuenta", async () => {
    auth.signUpWithPassword.mockResolvedValue({ needsConfirmation: false });
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/login?mode=register"]}>
        <LoginPage />
      </MemoryRouter>,
    );

    const customerRadio = screen.getByRole("radio", { name: /cliente/i });
    const adminRadio = screen.getByRole("radio", { name: /administrador/i });

    expect(customerRadio).toHaveAttribute("aria-checked", "true");
    expect(adminRadio).toHaveAttribute("aria-checked", "false");

    await user.click(adminRadio);
    expect(adminRadio).toHaveAttribute("aria-checked", "true");
    expect(customerRadio).toHaveAttribute("aria-checked", "false");

    await user.type(screen.getByLabelText(/^nombre$/i), "Ana Admin");
    await user.type(screen.getByLabelText(/^correo$/i), "ana@negocio.test");
    await user.type(screen.getByLabelText(/^contraseña$/i), "secreto123");
    await user.click(screen.getByRole("button", { name: /crear cuenta de administrador/i }));

    expect(auth.signUpWithPassword).toHaveBeenCalledWith({
      email: "ana@negocio.test",
      password: "secreto123",
      fullName: "Ana Admin",
      accountType: "admin",
      nextPath: "/business/register",
    });
  });

  it("crea cuenta de administrador incluso si la URL traía ?next=/customer", async () => {
    auth.signUpWithPassword.mockResolvedValue({ needsConfirmation: false });
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/login?next=%2Fcustomer"]}>
        <LoginPage />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: /regístrate/i }));
    await user.click(screen.getByRole("radio", { name: /administrador/i }));
    await user.type(screen.getByLabelText(/^nombre$/i), "Carlos Admin");
    await user.type(screen.getByLabelText(/^correo$/i), "carlos@negocio.test");
    await user.type(screen.getByLabelText(/^contraseña$/i), "secreto123");
    await user.click(screen.getByRole("button", { name: /crear cuenta de administrador/i }));

    expect(auth.signUpWithPassword).toHaveBeenCalledWith({
      email: "carlos@negocio.test",
      password: "secreto123",
      fullName: "Carlos Admin",
      accountType: "admin",
      nextPath: "/business/register",
    });
  });
});
