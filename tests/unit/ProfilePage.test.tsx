import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { maxAdultBirthDateBogota, ProfilePage } from "@/features/profile/ProfilePage";
import type { MyProfile } from "@/types";

const updateProfile = vi.hoisted(() => vi.fn());
const setAvatarMock = vi.hoisted(() => vi.fn());
const uploadAvatarMock = vi.hoisted(() => vi.fn());
const removeAssetMock = vi.hoisted(() => vi.fn());
const availability = vi.hoisted(() => ({ data: true as boolean | undefined }));

const profile = vi.hoisted(() => ({
  id: "user-1",
  full_name: "Carla Cliente",
  email: "carla@example.test",
  nickname: "carlacliente",
  nickname_changes: 0,
  nickname_changes_left: 2,
  business_count: 1,
  created_at: "2026-02-11T12:00:00.000Z",
}));

vi.mock("@/features/profile/hooks", () => ({
  useMyProfile: () => ({
    data: profile as MyProfile,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  useNicknameAvailable: () => ({
    data: availability.data,
    isFetching: false,
  }),
  useUpdateProfile: () => ({ mutateAsync: updateProfile, isPending: false }),
  useSetProfileAvatar: () => ({ mutateAsync: setAvatarMock, isPending: false }),
}));

vi.mock("@/lib/image", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/image")>();
  return {
    ...actual,
    uploadUserAvatarImage: uploadAvatarMock,
    removeBusinessAssetPath: removeAssetMock,
  };
});

vi.mock("@/features/auth/AuthProvider", () => ({
  useAuth: () => ({ user: { id: "user-1" } }),
}));

vi.mock("@/features/admin/BusinessGate", () => ({
  BusinessGate: ({
    children,
  }: {
    children: (business: {
      id: string;
      name: string;
      slug: string;
      timezone: string;
      operating_days: number[];
    }) => React.ReactNode;
  }) => (
    <>
      {children({
        id: "biz-1",
        name: "Taquería El Fogón",
        slug: "taqueria-el-fogon",
        timezone: "America/Bogota",
        operating_days: [1, 2, 3, 4, 5, 6],
      })}
    </>
  ),
}));

vi.mock("@/features/loyalty/hooks", () => ({
  useBusinessProfile: () => ({
    data: {
      id: "biz-1",
      name: "Taquería El Fogón",
      slug: "taqueria-el-fogon",
      timezone: "America/Bogota",
      operating_days: [1, 2, 3, 4, 5, 6],
      is_active: true,
      description: "Tacos al carbón",
      address: "Calle 10",
      neighborhood: "Centro",
      city: "Bogotá",
      phone_whatsapp: "+573001234567",
      phone: null,
      instagram: "elfogon",
      facebook: "facebook.com/elfogon",
      tiktok: "@elfogon",
      twitter: null,
      youtube: null,
      website: null,
      logo_url: null,
      updated_at: "2026-01-01T12:00:00.000Z",
    },
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  useSetBusinessLogo: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock("@/features/admin/BusinessProfileForm", () => ({
  BusinessProfileForm: () => <div data-testid="business-profile-form" />,
}));

function renderPage(initialEntry = "/") {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <ProfilePage />
    </MemoryRouter>,
  );
}

describe("ProfilePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    availability.data = true;
    updateProfile.mockResolvedValue({
      ...profile,
      nickname: "carla-nueva",
      nickname_changes: 1,
      nickname_changes_left: 1,
    });
  });

  it("muestra el alias y los cambios disponibles", () => {
    renderPage();

    expect(screen.getByText("@carlacliente")).toBeInTheDocument();
    expect(screen.getByText(/Te quedan 2 de 2 cambios/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Nombre completo/)).toHaveValue("Carla Cliente");
    expect(screen.getByLabelText(/Alias público/)).toHaveValue("carlacliente");
  });

  it("avisa cuando el alias está disponible y guarda el perfil", async () => {
    const user = userEvent.setup();
    renderPage();

    const nickname = screen.getByLabelText(/Alias público/);
    await user.clear(nickname);
    await user.type(nickname, "carla-nueva");

    await waitFor(() => {
      expect(screen.getByTestId("nickname-availability")).toHaveTextContent("está disponible");
    });

    await user.click(screen.getByRole("button", { name: /Guardar perfil/i }));

    await waitFor(() => {
      expect(updateProfile).toHaveBeenCalledWith({
        fullName: "Carla Cliente",
        nickname: "carla-nueva",
      });
    });
  });

  it("bloquea el guardado cuando el alias está ocupado", async () => {
    availability.data = false;
    const user = userEvent.setup();
    renderPage();

    const nickname = screen.getByLabelText(/Alias público/);
    await user.clear(nickname);
    await user.type(nickname, "alias-ocupado");

    await waitFor(() => {
      expect(screen.getByTestId("nickname-availability")).toHaveTextContent("no está disponible");
    });

    await user.click(screen.getByRole("button", { name: /Guardar perfil/i }));

    expect(updateProfile).not.toHaveBeenCalled();
  });

  it("bloquea el campo cuando se agotaron los 2 cambios", () => {
    const descriptor = Object.getOwnPropertyDescriptor(profile, "nickname_changes_left");
    Object.defineProperty(profile, "nickname_changes_left", {
      value: 0,
      configurable: true,
    });
    renderPage();

    expect(screen.getByLabelText(/Alias público/)).toBeDisabled();
    expect(screen.getByText(/Ya usaste tus 2 cambios de alias/i)).toBeInTheDocument();

    if (descriptor) {
      Object.defineProperty(profile, "nickname_changes_left", descriptor);
    }
  });

  it("en vista de administrador muestra diseño estilo red social con ambas fotos y sin pestaña Mi cuenta", () => {
    renderPage("/admin/perfil");

    expect(screen.queryByRole("tab", { name: "Mi cuenta" })).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Negocio" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("heading", { name: "Taquería El Fogón" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Subir foto del negocio/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Subir foto admin/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Nombre de administrador/)).toHaveValue("Carla Cliente");
    expect(screen.getByLabelText(/Alias de administrador/)).toHaveValue("carlacliente");
    expect(screen.getByTestId("business-profile-form")).toBeInTheDocument();
  });

  it("no muestra pestañas administrativas en /customer/perfil", () => {
    renderPage("/customer/perfil");

    expect(screen.queryByRole("tab", { name: "Negocio" })).not.toBeInTheDocument();
    expect(screen.getByLabelText(/Nombre completo/)).toBeInTheDocument();
    expect(screen.getByText(/PLAYER PROFILE/i)).toBeInTheDocument();
  });

  it("permite guardar teléfono y fecha de nacimiento en /customer/perfil", async () => {
    const user = userEvent.setup();
    renderPage("/customer/perfil");

    const phone = screen.getByLabelText(/Número de teléfono/i);
    const birthDate = screen.getByLabelText(/Fecha de nacimiento/i);

    await user.type(phone, "+57 300 555 1234");
    await user.type(birthDate, "1995-08-15");

    await user.click(screen.getByRole("button", { name: /Guardar perfil/i }));

    await waitFor(() => {
      expect(updateProfile).toHaveBeenCalledWith({
        fullName: "Carla Cliente",
        nickname: "carlacliente",
        phone: "+57 300 555 1234",
        birthDate: "1995-08-15",
      });
    });
  });

  it("habilita Guardar perfil al restaurar un borrador personal desde localStorage", async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(
      "fideliapp:draft:profile:user-1",
      JSON.stringify({
        version: 1,
        savedAt: Date.now(),
        value: { fullName: "Carla Borrador", nickname: "carlacliente" },
      }),
    );

    renderPage("/perfil");

    const saveButton = screen.getByRole("button", { name: /Guardar perfil/i });
    expect(screen.getByLabelText(/Nombre completo/)).toHaveValue("Carla Borrador");
    expect(saveButton).toBeEnabled();

    await user.click(saveButton);
    await waitFor(() => {
      expect(updateProfile).toHaveBeenCalledWith({
        fullName: "Carla Borrador",
        nickname: "carlacliente",
      });
    });
  });

  it("limita la fecha de nacimiento a mayores de 18 años y bloquea menores en cliente", async () => {
    const user = userEvent.setup();
    renderPage("/customer/perfil");

    const birthDate = screen.getByLabelText(/Fecha de nacimiento/i);
    expect(birthDate).toHaveAttribute("max", maxAdultBirthDateBogota());
    expect(birthDate).toHaveAttribute("min", "1900-01-01");

    // Calcula una fecha de 15 años atrás para garantizar menor de edad sin importar el año actual.
    const maxDate = maxAdultBirthDateBogota();
    const underageYear = Number(maxDate.slice(0, 4)) + 3;
    const underageDate = `${underageYear}-06-15`;

    await user.type(birthDate, underageDate);
    await user.click(screen.getByRole("button", { name: /Guardar perfil/i }));

    expect(
      await screen.findByText(/Debes ser mayor de 18 años para registrar tu fecha de nacimiento/i),
    ).toBeInTheDocument();
    expect(updateProfile).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(birthDate);
  });

  it("maxAdultBirthDateBogota ajusta años bisiestos sin desfase de zona horaria", () => {
    expect(maxAdultBirthDateBogota(new Date("2024-02-29T18:00:00Z"))).toBe("2006-02-28");
    expect(maxAdultBirthDateBogota(new Date("2026-11-25T15:00:00Z"))).toBe("2008-11-25");
  });

  it("limpia el archivo recién subido si falla profile_avatar_set", async () => {
    const user = userEvent.setup();
    uploadAvatarMock.mockResolvedValueOnce(
      "https://demo.supabase.co/storage/v1/object/public/business-assets/avatars/user-1/avatar-new.jpg",
    );
    setAvatarMock.mockRejectedValueOnce(new Error("rpc_failed"));

    renderPage("/perfil");
    const fileInput = screen.getByLabelText(/Subir foto de perfil/i);
    const file = new File(["img"], "avatar.jpg", { type: "image/jpeg" });
    await user.upload(fileInput, file);

    await waitFor(() => {
      expect(removeAssetMock).toHaveBeenCalledWith("avatars/user-1/avatar-new.jpg");
    });
  });
});
