import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ResetPasswordPage } from "@/features/auth/ResetPasswordPage";

const auth = vi.hoisted(() => ({
  updatePassword: vi.fn(),
  state: {
    session: null as null | { user: { id: string } },
    loading: false,
  },
}));

vi.mock("@/features/auth/AuthProvider", () => ({
  useAuth: () => ({
    ...auth.state,
    updatePassword: auth.updatePassword,
  }),
}));

describe("ResetPasswordPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.state.session = null;
    auth.state.loading = false;
  });

  it("muestra aviso de enlace expirado o inválido si no hay sesión activa", () => {
    render(
      <MemoryRouter initialEntries={["/restablecer-clave"]}>
        <ResetPasswordPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByText(/el enlace de recuperación venció o no es válido/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /volver a iniciar sesión/i })).toHaveAttribute(
      "href",
      "/login",
    );
  });

  it("valida coincidencia de contraseñas y llama a updatePassword con sesión activa", async () => {
    auth.state.session = { user: { id: "user-rec" } };
    auth.updatePassword.mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/restablecer-clave"]}>
        <Routes>
          <Route path="/restablecer-clave" element={<ResetPasswordPage />} />
          <Route path="/" element={<div>Inicio app</div>} />
        </Routes>
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText(/^nueva contraseña$/i), "NuevaClave1");
    await user.type(screen.getByLabelText(/^confirmar contraseña$/i), "OtraClave2");
    await user.click(screen.getByRole("button", { name: /guardar nueva contraseña/i }));

    expect(await screen.findByText(/las contraseñas no coinciden/i)).toBeInTheDocument();
    expect(auth.updatePassword).not.toHaveBeenCalled();

    await user.clear(screen.getByLabelText(/^confirmar contraseña$/i));
    await user.type(screen.getByLabelText(/^confirmar contraseña$/i), "NuevaClave1");
    await user.click(screen.getByRole("button", { name: /guardar nueva contraseña/i }));

    expect(auth.updatePassword).toHaveBeenCalledWith("NuevaClave1");
    expect(await screen.findByText(/contraseña actualizada/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /continuar a fideliapp/i }));
    expect(await screen.findByText("Inicio app")).toBeInTheDocument();
  });
});
