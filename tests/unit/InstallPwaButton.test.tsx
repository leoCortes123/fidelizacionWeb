import { describe, expect, it, vi, beforeEach } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InstallPwaButton, resetInstallPwaStateForTests } from "@/components/pwa/InstallPwaButton";

const toastMock = vi.hoisted(() => ({
  success: vi.fn(),
  info: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: toastMock,
}));

function mockStandalone(matches: boolean) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query === "(display-mode: standalone)" ? matches : false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  });
}

describe("InstallPwaButton", () => {
  beforeEach(() => {
    toastMock.success.mockReset();
    toastMock.info.mockReset();
    mockStandalone(false);
    resetInstallPwaStateForTests();
  });

  it("se oculta automáticamente cuando la app corre en modo standalone", () => {
    mockStandalone(true);
    resetInstallPwaStateForTests();

    render(<InstallPwaButton label="Descargar app" />);
    expect(screen.queryByRole("button", { name: /Descargar app/i })).not.toBeInTheDocument();
  });

  it("emite un único toast en appinstalled aunque haya varias instancias montadas", () => {
    render(
      <>
        <InstallPwaButton label="Descargar app" />
        <InstallPwaButton label="Descargar app" />
        <InstallPwaButton label="Descargar app" />
      </>,
    );

    expect(screen.getAllByRole("button", { name: /Descargar app/i })).toHaveLength(3);

    act(() => {
      window.dispatchEvent(new Event("appinstalled"));
    });

    expect(toastMock.success).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("button", { name: /Descargar app/i })).not.toBeInTheDocument();
  });

  it("limpia el deferredPrompt tras dismissed para no relanzar error al volver a pulsar", async () => {
    const user = userEvent.setup();
    render(
      <>
        <InstallPwaButton label="Descargar app" />
        <InstallPwaButton label="Descargar app" />
      </>,
    );

    const promptMock = vi.fn().mockResolvedValue(undefined);
    const event = new Event("beforeinstallprompt") as Event & {
      prompt: () => Promise<void>;
      userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
    };
    event.prompt = promptMock;
    event.userChoice = Promise.resolve({ outcome: "dismissed", platform: "web" });

    act(() => {
      window.dispatchEvent(event);
    });

    const buttons = screen.getAllByRole("button", { name: /Descargar app/i });
    await user.click(buttons[0]);
    expect(promptMock).toHaveBeenCalledTimes(1);

    // Al volver a pulsar (en otra instancia), no reutiliza el evento consumido; muestra ayuda manual.
    await user.click(buttons[1]);
    expect(promptMock).toHaveBeenCalledTimes(1);
    expect(toastMock.info).toHaveBeenCalledTimes(1);
  });
});
