import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { queryClient } from "@/app/queryClient";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { AcceptTermsPage } from "@/features/legal/AcceptTermsPage";
import { ConsentGate } from "@/features/legal/ConsentGate";
import { LegalFooterLinks } from "@/features/legal/LegalFooterLinks";
import { clearPendingClaim, rememberPendingClaim } from "@/lib/pendingClaim";

const rpcMock = vi.hoisted(() => vi.fn());
const resolvePostLoginPathMock = vi.hoisted(() => vi.fn());

const auth = vi.hoisted(() => ({
  signOut: vi.fn(),
  state: {
    session: { user: { id: "user-1" } } as null | { user: { id: string } },
    user: { id: "user-1" } as null | { id: string },
    roles: ["customer"] as string[],
    loading: false,
    rolesLoading: false,
    rolesLoaded: true,
  },
}));

vi.mock("@/features/auth/AuthProvider", () => ({
  useAuth: () => ({
    ...auth.state,
    signOut: auth.signOut,
  }),
}));

vi.mock("@/lib/supabase", () => ({
  rpc: rpcMock,
  supabase: {},
}));

vi.mock("@/lib/postLogin", () => ({
  resolvePostLoginPath: resolvePostLoginPathMock,
}));

describe("LegalConsent (ConsentGate + AcceptTermsPage + LegalFooterLinks)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
    clearPendingClaim();
    auth.state.session = { user: { id: "user-1" } };
    auth.state.user = { id: "user-1" };
    auth.state.roles = ["customer"];
    auth.state.loading = false;
    auth.state.rolesLoading = false;
    auth.state.rolesLoaded = true;
    resolvePostLoginPathMock.mockResolvedValue("/customer");
  });

  it("ConsentGate redirige a /aceptar-terminos conservando next cuando has_pending es true", async () => {
    rpcMock.mockResolvedValue({
      has_pending: true,
      is_business_admin: false,
      required_documents: ["terms_customer", "privacy_policy"],
      accepted_documents: [],
      pending_documents: ["terms_customer", "privacy_policy"],
      current_versions: { terms_customer: "2026-11-25", privacy_policy: "2026-11-25" },
    });

    render(
      <ThemeProvider>
        <MemoryRouter initialEntries={["/customer/purchases?tab=all"]}>
          <Routes>
            <Route
              path="/customer/purchases"
              element={
                <ConsentGate>
                  <div>Portal cliente</div>
                </ConsentGate>
              }
            />
            <Route path="/aceptar-terminos" element={<div>Pantalla aceptar términos</div>} />
          </Routes>
        </MemoryRouter>
      </ThemeProvider>,
    );

    expect(await screen.findByText("Pantalla aceptar términos")).toBeInTheDocument();
    expect(screen.queryByText("Portal cliente")).not.toBeInTheDocument();
  });

  it("ConsentGate renderiza el portal cuando has_pending es false", async () => {
    rpcMock.mockResolvedValue({
      has_pending: false,
      is_business_admin: false,
      required_documents: ["terms_customer", "privacy_policy"],
      accepted_documents: ["terms_customer", "privacy_policy"],
      pending_documents: [],
      current_versions: { terms_customer: "2026-11-25", privacy_policy: "2026-11-25" },
    });

    render(
      <ThemeProvider>
        <MemoryRouter initialEntries={["/customer"]}>
          <ConsentGate>
            <div>Portal cliente</div>
          </ConsentGate>
        </MemoryRouter>
      </ThemeProvider>,
    );

    expect(await screen.findByText("Portal cliente")).toBeInTheDocument();
  });

  it("AcceptTermsPage exige marcar los checkboxes, registra consentimiento y respeta pending-claim", async () => {
    rememberPendingClaim("token_de_compra_qr_valido_12345");
    rpcMock
      .mockResolvedValueOnce({
        has_pending: true,
        is_business_admin: false,
        required_documents: ["terms_customer", "privacy_policy"],
        accepted_documents: [],
        pending_documents: ["terms_customer", "privacy_policy"],
        current_versions: { terms_customer: "2026-11-25", privacy_policy: "2026-11-25" },
      })
      .mockResolvedValueOnce({
        recorded: [],
        versions: { terms_customer: "2026-11-25", privacy_policy: "2026-11-25" },
      });

    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <MemoryRouter initialEntries={["/aceptar-terminos"]}>
          <Routes>
            <Route path="/aceptar-terminos" element={<AcceptTermsPage />} />
            <Route
              path="/claim/token_de_compra_qr_valido_12345"
              element={<div>Reclamo QR pendiente</div>}
            />
          </Routes>
        </MemoryRouter>
      </ThemeProvider>,
    );

    const submitButton = await screen.findByRole("button", { name: /Aceptar y continuar/i });
    await user.click(submitButton);
    expect(
      screen.getByText(/Debes aceptar los Términos de uso y la Política de Tratamiento de Datos/i),
    ).toBeInTheDocument();
    expect(rpcMock).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("checkbox", { name: /Acepto los/i }));
    await user.click(submitButton);

    await waitFor(() => {
      expect(rpcMock).toHaveBeenCalledWith(
        "legal_consent_record",
        expect.objectContaining({
          p_documents: ["terms_customer", "privacy_policy"],
          p_business_id: null,
          p_source_route: "/aceptar-terminos",
        }),
      );
    });
    expect(await screen.findByText("Reclamo QR pendiente")).toBeInTheDocument();
  });

  it("LegalFooterLinks muestra enlaces B2B solo en variante business", () => {
    const { rerender } = render(<LegalFooterLinks />);
    expect(screen.getByRole("link", { name: "Términos" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Privacidad" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "DPA" })).not.toBeInTheDocument();

    rerender(<LegalFooterLinks variant="business" />);
    expect(screen.getByRole("link", { name: "Términos negocios" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "DPA" })).toBeInTheDocument();
  });
});
