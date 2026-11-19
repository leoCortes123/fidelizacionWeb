import { describe, expect, it, vi, beforeEach } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { LandingPage } from "@/features/auth/LandingPage";
import { clearPendingClaim, rememberPendingClaim } from "@/lib/pendingClaim";
import { faqs, manualSteps } from "@/features/landing/landingContent";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

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

  it("muestra el hero para negocios, el registro y el botón de descargar app", () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { level: 1, name: /Programa de puntos para tu negocio/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Crear mi programa de puntos/i })).toHaveAttribute(
      "href",
      "/admin/onboarding?new=1",
    );
    expect(screen.getByRole("link", { name: /Soy cliente: crear cuenta/i })).toHaveAttribute(
      "href",
      "/login?mode=register",
    );
    expect(screen.getAllByRole("button", { name: /Descargar app/i }).length).toBeGreaterThan(0);
  });

  it("navega por los pasos del manual de uso", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    );

    const firstTab = screen.getByRole("tab", { name: /Venta/i });
    expect(firstTab).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("heading", { level: 3, name: manualSteps[0].title })).toBeVisible();

    await user.click(screen.getByRole("tab", { name: /Canje/i }));
    expect(screen.getByRole("tab", { name: /Canje/i })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("heading", { level: 3, name: manualSteps[3].title })).toBeVisible();

    await user.click(screen.getByRole("button", { name: /Siguiente/i }));
    expect(screen.getByRole("heading", { level: 3, name: manualSteps[4].title })).toBeVisible();
    expect(screen.getByRole("button", { name: /Siguiente/i })).toBeDisabled();
  });

  it("sincroniza la pestaña activa cuando beforematch revela un paso oculto", () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    );

    const thirdPanel = document.getElementById("paso-panel-3");
    expect(thirdPanel).toHaveAttribute("hidden", "until-found");

    act(() => {
      thirdPanel?.dispatchEvent(new Event("beforematch", { bubbles: true }));
    });

    expect(screen.getByRole("tab", { name: /Progreso/i })).toHaveAttribute("aria-selected", "true");
    expect(thirdPanel).not.toHaveAttribute("hidden");
  });

  it("permite navegar las pestañas con teclado y pausar las animaciones", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    );

    const firstTab = screen.getByRole("tab", { name: /Venta/i });
    firstTab.focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: /Escaneo/i })).toHaveAttribute("aria-selected", "true");
    await user.keyboard("{End}");
    expect(screen.getByRole("tab", { name: /Fidelización/i })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await user.keyboard("{Home}");
    expect(firstTab).toHaveAttribute("aria-selected", "true");

    const pauseBtn = screen.getByRole("button", { name: /Pausar animación/i });
    const playBtn = screen.getByRole("button", { name: /Reproducir animación/i });
    expect(pauseBtn).toHaveAttribute("aria-pressed", "false");
    expect(playBtn).toHaveAttribute("aria-pressed", "true");
    await user.click(pauseBtn);
    expect(pauseBtn).toHaveAttribute("aria-pressed", "true");
    expect(playBtn).toHaveAttribute("aria-pressed", "false");
    await user.click(playBtn);
    expect(pauseBtn).toHaveAttribute("aria-pressed", "false");
    expect(playBtn).toHaveAttribute("aria-pressed", "true");
  });

  it("mantiene el JSON-LD FAQPage de index.html sincronizado con las preguntas visibles", () => {
    const html = readFileSync(resolve(__dirname, "../../index.html"), "utf8");
    const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    expect(match).not.toBeNull();
    const data = JSON.parse(match![1]) as {
      "@graph": Array<{
        "@type": string;
        mainEntity?: Array<{ name: string; acceptedAnswer: { text: string } }>;
      }>;
    };
    const faqPage = data["@graph"].find((node) => node["@type"] === "FAQPage");
    expect(faqPage?.mainEntity?.map((q) => [q.name, q.acceptedAnswer.text])).toEqual(
      faqs.map((f) => [f.question, f.answer]),
    );
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
