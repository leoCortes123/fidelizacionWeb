import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { CustomerShell } from "@/components/layout/CustomerShell";

vi.mock("@/features/auth/AuthProvider", () => ({
  useAuth: () => ({
    displayName: "Carla Cliente",
    user: { id: "cust-1", email: "carla@example.com" },
    roles: ["customer"],
    signOut: vi.fn(),
  }),
}));

vi.mock("@/components/theme/ThemeProvider", () => ({
  usePortalTheme: vi.fn(),
  useTheme: () => ({ theme: "light", toggleTheme: vi.fn() }),
}));

describe("CustomerShell", () => {
  it("renders a generic pixel-art user icon in the top bar dropdown button and toggles menu", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <MemoryRouter initialEntries={["/customer"]}>
        <Routes>
          <Route path="/customer" element={<CustomerShell />}>
            <Route index element={<div>Inicio</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    const toggleBtn = container.querySelector("#btnDropdownToggle") as HTMLButtonElement | null;
    expect(toggleBtn).not.toBeNull();
    expect(toggleBtn?.querySelector('svg[data-icon="pixel-user"]')).not.toBeNull();
    expect(toggleBtn?.querySelector("svg.dropdown-gear")).toBeNull();

    expect(toggleBtn?.getAttribute("aria-expanded")).toBe("false");
    await user.click(toggleBtn!);
    expect(toggleBtn?.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByRole("menu", { name: "Menú de usuario" })).toBeTruthy();
  });
});
