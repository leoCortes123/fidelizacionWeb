import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { MembersPage } from "@/features/admin/MembersPage";
import type { BusinessMembershipWithProfile } from "@/types";

const createInvite = vi.hoisted(() => vi.fn());
const update = vi.hoisted(() => vi.fn());

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
    role: "admin" as const,
    can_approve_redemptions: false,
  },
  members: [
    {
      id: "mem-1",
      business_id: "biz-1",
      user_id: "user-ana",
      full_name: "Ana Encargada",
      email: "ana@example.test",
      role: "encargado",
      can_approve_redemptions: true,
      created_by: "user-admin",
      created_at: "2026-01-02T12:00:00.000Z",
      updated_at: "2026-01-02T12:00:00.000Z",
    },
  ] as BusinessMembershipWithProfile[],
}));

vi.mock("@/features/loyalty/hooks", () => ({
  useBusinesses: () => ({ data: [fixture.business], isLoading: false, isError: false }),
  useBusinessMemberships: () => ({
    data: fixture.members,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  useCreateMemberInvite: () => ({ mutateAsync: createInvite, isPending: false }),
  useUpdateBusinessMembership: () => ({ mutateAsync: update, isPending: false }),
}));

vi.mock("@/features/loyalty/businessContext", () => ({
  useBusinessContext: () => ({
    selectedBusiness: fixture.business,
    businesses: [fixture.business],
    selectedRole: "admin",
    canApproveRedemptions: false,
    setSelectedBusiness: vi.fn(),
  }),
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <MembersPage />
    </MemoryRouter>,
  );
}

describe("MembersPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    update.mockResolvedValue({});
    createInvite.mockResolvedValue({
      invite_id: "inv-1",
      token: "inv_token_12345678901234567890",
      business_id: "biz-1",
      business_name: "Taquería El Fogón",
      business_slug: "taqueria-el-fogon",
      role: "encargado",
      can_approve_redemptions: true,
      expires_at: "2026-11-13T12:00:00.000Z",
    });
  });

  it("lista los miembros y alterna el permiso de aprobación", async () => {
    const user = userEvent.setup();
    renderPage();

    expect(screen.getByText("Ana Encargada")).toBeInTheDocument();
    const checkbox = screen.getByRole("checkbox", {
      name: /Puede aprobar redenciones/i,
    });
    expect(checkbox).toBeChecked();

    await user.click(checkbox);
    await waitFor(() =>
      expect(update).toHaveBeenCalledWith({
        businessId: "biz-1",
        userId: "user-ana",
        canApproveRedemptions: false,
      }),
    );
  });

  it("genera un código QR de invitación para encargado con permiso de aprobación", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: /Añadir miembro/i }));
    const dialog = within(screen.getByRole("dialog"));

    expect(dialog.queryByLabelText("Buscar persona")).not.toBeInTheDocument();

    await user.click(dialog.getByRole("checkbox", { name: /Puede aprobar redenciones/i }));
    await user.click(dialog.getByRole("button", { name: /Generar QR/i }));

    await waitFor(() => expect(createInvite).toHaveBeenCalledTimes(1));
    expect(createInvite).toHaveBeenCalledWith({
      businessId: "biz-1",
      role: "encargado",
      canApproveRedemptions: true,
    });

    expect(
      await dialog.findByLabelText("Código QR de invitación para miembro"),
    ).toBeInTheDocument();
    expect(dialog.getByLabelText("Enlace de invitación de miembro")).toHaveValue(
      "https://fidelizacion01.vercel.app/login?mode=register&invite=inv_token_12345678901234567890",
    );
  });

  it("genera un QR para cliente sin permiso de aprobación y permite generar otro", async () => {
    createInvite.mockResolvedValueOnce({
      invite_id: "inv-2",
      token: "inv_cliente_12345678901234567890",
      business_id: "biz-1",
      business_name: "Taquería El Fogón",
      business_slug: "taqueria-el-fogon",
      role: "cliente",
      can_approve_redemptions: false,
      expires_at: "2026-11-13T12:00:00.000Z",
    });

    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: /Añadir miembro/i }));
    const dialog = within(screen.getByRole("dialog"));

    await user.click(dialog.getByRole("combobox", { name: /Rol en el negocio/i }));
    await user.click(await screen.findByRole("option", { name: "Cliente" }));

    expect(
      dialog.queryByRole("checkbox", { name: /Puede aprobar redenciones/i }),
    ).not.toBeInTheDocument();

    await user.click(dialog.getByRole("button", { name: /Generar QR/i }));

    await waitFor(() => expect(createInvite).toHaveBeenCalledTimes(1));
    expect(createInvite).toHaveBeenCalledWith({
      businessId: "biz-1",
      role: "cliente",
      canApproveRedemptions: false,
    });

    expect(await dialog.findByText(/Rol: Cliente/i)).toBeInTheDocument();

    await user.click(dialog.getByRole("button", { name: /Generar otro QR/i }));
    expect(dialog.getByRole("button", { name: /Generar QR/i })).toBeInTheDocument();
  });
});
