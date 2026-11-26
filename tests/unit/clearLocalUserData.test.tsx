import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const { signOutMock, getSessionMock, onAuthStateChangeMock, rpcMock } = vi.hoisted(() => ({
  signOutMock: vi.fn(),
  getSessionMock: vi.fn(),
  onAuthStateChangeMock: vi.fn(),
  rpcMock: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      signOut: signOutMock,
      getSession: getSessionMock,
      onAuthStateChange: onAuthStateChangeMock,
    },
  },
  rpc: rpcMock,
}));

import { clearLocalUserData } from "@/lib/clearLocalUserData";
import { AuthProvider, useAuth } from "@/features/auth/AuthProvider";

function SignOutProbe() {
  const { signOut } = useAuth();
  return (
    <button type="button" onClick={() => void signOut()}>
      Cerrar sesión
    </button>
  );
}

describe("clearLocalUserData y AuthProvider.signOut", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    window.sessionStorage.clear();
    signOutMock.mockResolvedValue({ error: null });
    getSessionMock.mockResolvedValue({ data: { session: null } });
    onAuthStateChangeMock.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });
    rpcMock.mockResolvedValue([]);
  });

  it("purga borradores, negocio seleccionado, QR pendiente y sessionStorage conservando el tema", () => {
    window.localStorage.setItem("fideliapp:theme", "dark");
    window.localStorage.setItem(
      "fideliapp:draft:profile:user-1",
      JSON.stringify({ phone: "+573001234567", birthDate: "1995-01-01" }),
    );
    window.localStorage.setItem("loopoint:draft:profile:user-1", '{"phone":"3001112222"}');
    window.localStorage.setItem("fidelizacion:selected-business", "biz-0");
    window.localStorage.setItem("fidelizacion:selected-business:user-1", "biz-1");
    window.localStorage.setItem("fidelizacion:pending-claim", '{"token":"abc"}');
    window.localStorage.setItem("fidelizacion:onboarding:new", '{"name":"Mi Local"}');

    window.sessionStorage.setItem("fidelizacion:pending-account-type", "admin");
    window.sessionStorage.setItem("loyalty:token:red-1", '{"token":"secret"}');

    clearLocalUserData();

    expect(window.localStorage.getItem("fideliapp:draft:profile:user-1")).toBeNull();
    expect(window.localStorage.getItem("loopoint:draft:profile:user-1")).toBeNull();
    expect(window.localStorage.getItem("fidelizacion:selected-business")).toBeNull();
    expect(window.localStorage.getItem("fidelizacion:selected-business:user-1")).toBeNull();
    expect(window.localStorage.getItem("fidelizacion:pending-claim")).toBeNull();
    expect(window.localStorage.getItem("fidelizacion:onboarding:new")).toBeNull();
    expect(window.localStorage.getItem("fideliapp:theme")).toBe("dark");

    expect(window.sessionStorage.length).toBe(0);
  });

  it("AuthProvider.signOut purga datos locales incluso si Supabase devuelve error", async () => {
    signOutMock.mockResolvedValueOnce({ error: new Error("offline") });
    signOutMock.mockResolvedValueOnce({ error: null });

    window.localStorage.setItem("fideliapp:theme", "light");
    window.localStorage.setItem("fideliapp:draft:profile:user-1", '{"phone":"3001234567"}');
    window.localStorage.setItem("fidelizacion:selected-business:user-1", "biz-1");
    window.localStorage.setItem("fidelizacion:pending-claim", '{"token":"tok"}');
    window.sessionStorage.setItem("loyalty:token:r1", '{"token":"secret"}');

    const user = userEvent.setup();
    render(
      <AuthProvider>
        <SignOutProbe />
      </AuthProvider>,
    );

    await act(async () => {
      await user.click(screen.getByRole("button", { name: "Cerrar sesión" }));
    });

    await waitFor(() => {
      expect(window.localStorage.getItem("fideliapp:draft:profile:user-1")).toBeNull();
    });
    expect(window.localStorage.getItem("fidelizacion:selected-business:user-1")).toBeNull();
    expect(window.localStorage.getItem("fidelizacion:pending-claim")).toBeNull();
    expect(window.sessionStorage.getItem("loyalty:token:r1")).toBeNull();
    expect(window.localStorage.getItem("fideliapp:theme")).toBe("light");
  });

  it("purga datos locales si la sesión se cierra remotamente o desde otra pestaña", async () => {
    let authCallback: ((event: string, session: unknown) => void) | null = null;
    getSessionMock.mockResolvedValueOnce({
      data: { session: { user: { id: "user-1", email: "a@test.com", user_metadata: {} } } },
    });
    onAuthStateChangeMock.mockImplementationOnce(
      (cb: (event: string, session: unknown) => void) => {
        authCallback = cb;
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      },
    );

    window.localStorage.setItem("fideliapp:theme", "dark");
    window.localStorage.setItem("fideliapp:draft:profile:user-1", '{"phone":"3001234567"}');
    window.sessionStorage.setItem("loyalty:token:r2", '{"token":"secret"}');

    render(
      <AuthProvider>
        <SignOutProbe />
      </AuthProvider>,
    );

    await waitFor(() => expect(authCallback).not.toBeNull());
    // Esperar a que getSession resuelva y registre user-1 como sesión previa.
    await waitFor(() => expect(rpcMock).toHaveBeenCalled());

    act(() => {
      authCallback?.("SIGNED_OUT", null);
    });

    expect(window.localStorage.getItem("fideliapp:draft:profile:user-1")).toBeNull();
    expect(window.sessionStorage.getItem("loyalty:token:r2")).toBeNull();
    expect(window.localStorage.getItem("fideliapp:theme")).toBe("dark");
  });
});
