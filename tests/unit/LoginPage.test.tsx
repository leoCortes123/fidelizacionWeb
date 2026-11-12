import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Link, MemoryRouter, Route, Routes } from "react-router-dom";
import { LoginPage } from "@/features/auth/LoginPage";
import { clearPendingClaim, pendingClaimPath, rememberPendingClaim } from "@/lib/pendingClaim";

const rpcMock = vi.hoisted(() => vi.fn());

const auth = vi.hoisted(() => ({
  signInWithGoogle: vi.fn(),
  signInWithPassword: vi.fn(),
  signUpWithPassword: vi.fn(),
  refreshRoles: vi.fn(),
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
    refreshRoles: auth.refreshRoles,
  }),
}));

vi.mock("@/lib/supabase", () => ({
  rpc: rpcMock,
  supabase: {},
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
      nextPath: "/admin/onboarding",
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
      nextPath: "/admin/onboarding",
    });
  });

  it("permite alternar visibilidad de la contraseña y valida campos inline", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/login"]}>
        <LoginPage />
      </MemoryRouter>,
    );

    const passwordInput = screen.getByLabelText(/^contraseña$/i);
    expect(passwordInput).toHaveAttribute("type", "password");

    const toggleButton = screen.getByRole("button", { name: /mostrar contraseña/i });
    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute("type", "text");
    expect(screen.getByRole("button", { name: /ocultar contraseña/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await user.type(screen.getByLabelText(/^correo$/i), "correo-invalido");
    await user.click(screen.getByRole("button", { name: /entrar con correo/i }));

    expect(screen.getByRole("alert")).toHaveTextContent(/escribe un correo válido/i);
    expect(auth.signInWithPassword).not.toHaveBeenCalled();
  });

  it("envía a /admin/onboarding al crear cuenta de administrador aunque el destino fuera ?next=/admin/dashboard", async () => {
    auth.signUpWithPassword.mockResolvedValue({ needsConfirmation: false });
    const user = userEvent.setup();
    const previousState = { ...auth.state };

    try {
      const renderUi = () => (
        <MemoryRouter initialEntries={["/login?next=%2Fadmin%2Fdashboard&mode=register"]}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/admin/onboarding" element={<div>Onboarding admin</div>} />
            <Route path="/admin/dashboard" element={<div>Dashboard admin</div>} />
          </Routes>
        </MemoryRouter>
      );
      const { rerender } = render(renderUi());

      await user.click(screen.getByRole("radio", { name: /administrador/i }));
      await user.type(screen.getByLabelText(/^nombre$/i), "Laura Admin");
      await user.type(screen.getByLabelText(/^correo$/i), "laura@negocio.test");
      await user.type(screen.getByLabelText(/^contraseña$/i), "secreto123");
      await user.click(screen.getByRole("button", { name: /crear cuenta de administrador/i }));

      expect(auth.signUpWithPassword).toHaveBeenCalledWith({
        email: "laura@negocio.test",
        password: "secreto123",
        fullName: "Laura Admin",
        accountType: "admin",
        nextPath: "/admin/onboarding",
      });

      auth.state.session = {
        user: { id: "user-laura", email: "laura@negocio.test" },
      } as never;
      auth.state.roles = ["admin"];
      auth.state.loading = false;
      auth.state.rolesLoading = false;
      auth.state.rolesLoaded = true;
      rerender(renderUi());

      expect(await screen.findByText("Onboarding admin")).toBeInTheDocument();
      expect(screen.queryByText("Dashboard admin")).not.toBeInTheDocument();
    } finally {
      Object.assign(auth.state, previousState);
    }
  });

  it("sincroniza el modo de registro cuando cambian los parámetros de /login sin desmontar", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route
            path="/login"
            element={
              <>
                <Link to="/login?mode=register&role=admin">Cambiar a registro admin</Link>
                <LoginPage />
              </>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.queryByLabelText(/^nombre$/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: "Cambiar a registro admin" }));

    expect(screen.getByLabelText(/^nombre$/i)).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /administrador/i })).toBeChecked();
  });

  it("oculta las opciones de cliente y administrador en registro con ?invite= y aplica el rol automáticamente", async () => {
    const inviteToken = "inv_token_12345678901234567890";
    rpcMock.mockImplementation((fn: string) => {
      if (fn === "business_member_invite_preview") {
        return Promise.resolve({
          invite_id: "inv-1",
          business_id: "biz-1",
          business_name: "Taquería El Fogón",
          business_slug: "taqueria-el-fogon",
          role: "encargado",
          can_approve_redemptions: true,
          status: "pending",
          expires_at: "2026-11-13T12:00:00.000Z",
        });
      }
      if (fn === "business_member_invite_accept") {
        return Promise.resolve({
          invite_id: "inv-1",
          business_id: "biz-1",
          business_name: "Taquería El Fogón",
          business_slug: "taqueria-el-fogon",
          membership_id: "mem-new",
          role: "encargado",
          can_approve_redemptions: true,
          previous_role: null,
          role_changed: false,
          already_accepted: false,
        });
      }
      return Promise.resolve([]);
    });
    auth.signUpWithPassword.mockResolvedValue({ needsConfirmation: false });
    auth.refreshRoles.mockResolvedValue(undefined);
    const user = userEvent.setup();
    const previousState = { ...auth.state };

    try {
      const renderUi = () => (
        <MemoryRouter initialEntries={[`/login?mode=register&invite=${inviteToken}`]}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/encargado" element={<div>Portal encargado</div>} />
          </Routes>
        </MemoryRouter>
      );
      const { rerender } = render(renderUi());

      expect(await screen.findByText("Taquería El Fogón")).toBeInTheDocument();
      expect(screen.getByText(/Rol: Encargado/i)).toBeInTheDocument();
      expect(screen.queryByRole("radiogroup", { name: /tipo de cuenta/i })).not.toBeInTheDocument();
      expect(screen.queryByRole("radio", { name: /cliente/i })).not.toBeInTheDocument();
      expect(screen.queryByRole("radio", { name: /administrador/i })).not.toBeInTheDocument();

      await user.type(screen.getByLabelText(/^nombre$/i), "Mateo Encargado");
      await user.type(screen.getByLabelText(/^correo$/i), "mateo@example.test");
      await user.type(screen.getByLabelText(/^contraseña$/i), "secreto123");
      await user.click(screen.getByRole("button", { name: /crear cuenta/i }));

      expect(auth.signUpWithPassword).toHaveBeenCalledWith({
        email: "mateo@example.test",
        password: "secreto123",
        fullName: "Mateo Encargado",
        accountType: "customer",
        nextPath: `/login?invite=${inviteToken}`,
      });

      auth.state.session = { user: { id: "user-mateo" } };
      auth.state.user = { id: "user-mateo" };
      auth.state.roles = ["customer"];
      rerender(renderUi());

      expect(await screen.findByText("Portal encargado")).toBeInTheDocument();
      expect(rpcMock).toHaveBeenCalledWith("business_member_invite_accept", {
        p_token: inviteToken,
      });
      expect(auth.refreshRoles).toHaveBeenCalled();
    } finally {
      Object.assign(auth.state, previousState);
    }
  });

  it("cambia el rol automáticamente cuando un usuario ya registrado como cliente abre el QR", async () => {
    const inviteToken = "inv_upgrade_12345678901234567890";
    rpcMock.mockImplementation((fn: string) => {
      if (fn === "business_member_invite_accept") {
        return Promise.resolve({
          invite_id: "inv-2",
          business_id: "biz-1",
          business_name: "Taquería El Fogón",
          business_slug: "taqueria-el-fogon",
          membership_id: "mem-up",
          role: "encargado",
          can_approve_redemptions: false,
          previous_role: "cliente",
          role_changed: true,
          already_accepted: false,
        });
      }
      return Promise.resolve([]);
    });
    auth.refreshRoles.mockResolvedValue(undefined);
    const previousState = { ...auth.state };

    try {
      auth.state.session = { user: { id: "user-cliente" } };
      auth.state.user = { id: "user-cliente" };
      auth.state.roles = ["customer"];

      render(
        <MemoryRouter initialEntries={[`/login?mode=register&invite=${inviteToken}`]}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/encargado" element={<div>Portal encargado</div>} />
          </Routes>
        </MemoryRouter>,
      );

      expect(await screen.findByText("Portal encargado")).toBeInTheDocument();
      expect(rpcMock).toHaveBeenCalledWith("business_member_invite_accept", {
        p_token: inviteToken,
      });
    } finally {
      Object.assign(auth.state, previousState);
    }
  });

  it("bloquea el registro si la invitación QR ya expiró o fue usada", async () => {
    const inviteToken = "inv_expired_12345678901234567890";
    rpcMock.mockResolvedValue({
      invite_id: "inv-3",
      business_id: "biz-1",
      business_name: "Taquería El Fogón",
      business_slug: "taqueria-el-fogon",
      role: "encargado",
      can_approve_redemptions: false,
      status: "expired",
      expires_at: "2026-11-10T12:00:00.000Z",
    });

    render(
      <MemoryRouter initialEntries={[`/login?mode=register&invite=${inviteToken}`]}>
        <LoginPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText(/invitación no disponible/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /crear cuenta/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /continuar con google/i })).toBeDisabled();
  });

  it("abre en modo registro por defecto cuando el usuario viene desde /join/:slug", async () => {
    const user = userEvent.setup();
    auth.signUpWithPassword.mockResolvedValue({ needsConfirmation: false });

    render(
      <MemoryRouter initialEntries={["/login?next=%2Fjoin%2Fempanadas"]}>
        <LoginPage />
      </MemoryRouter>,
    );

    expect(screen.getByLabelText("Nombre")).toBeInTheDocument();
    await user.type(screen.getByLabelText("Nombre"), "Sofía Cliente");
    await user.type(screen.getByLabelText("Correo"), "sofia@example.com");
    await user.type(screen.getByLabelText(/^Contraseña$/), "secreto123");
    await user.click(screen.getByRole("button", { name: "Crear cuenta" }));

    await waitFor(() => {
      expect(auth.signUpWithPassword).toHaveBeenCalledWith({
        email: "sofia@example.com",
        password: "secreto123",
        fullName: "Sofía Cliente",
        accountType: "customer",
        nextPath: "/join/empanadas",
      });
    });
    expect(auth.signInWithPassword).not.toHaveBeenCalled();
  });

  it("mantiene el modo inicio de sesión si se especifica mode=login viniendo desde /join/:slug", async () => {
    const user = userEvent.setup();
    auth.signInWithPassword.mockResolvedValue(undefined);

    render(
      <MemoryRouter initialEntries={["/login?next=%2Fjoin%2Fempanadas&mode=login"]}>
        <LoginPage />
      </MemoryRouter>,
    );

    expect(screen.queryByLabelText("Nombre")).not.toBeInTheDocument();
    await user.type(screen.getByLabelText("Correo"), "cliente@example.com");
    await user.type(screen.getByLabelText(/^Contraseña$/), "clave123");
    await user.click(screen.getByRole("button", { name: "Entrar con correo" }));

    await waitFor(() => {
      expect(auth.signInWithPassword).toHaveBeenCalledWith("cliente@example.com", "clave123");
    });
    expect(auth.signUpWithPassword).not.toHaveBeenCalled();
  });
});
