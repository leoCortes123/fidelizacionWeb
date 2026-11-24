import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { SignOutButton } from "@/components/shared/SignOutButton";

const signOutMock = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));

vi.mock("@/features/auth/AuthProvider", () => ({
  useAuth: () => ({ signOut: signOutMock }),
}));

describe("SignOutButton", () => {
  it("cierra sesión y navega directamente a /login", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/admin/dashboard"]}>
        <Routes>
          <Route path="/admin/dashboard" element={<SignOutButton />} />
          <Route path="/login" element={<div>Pantalla login</div>} />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: /Cerrar sesión/i }));

    await waitFor(() => {
      expect(signOutMock).toHaveBeenCalledTimes(1);
      expect(screen.getByText("Pantalla login")).toBeInTheDocument();
    });
  });
});
