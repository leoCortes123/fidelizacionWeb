import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  AtSign,
  BadgeCheck,
  Banknote,
  Building2,
  Calendar,
  CalendarDays,
  Camera,
  CircleAlert,
  Globe,
  Loader2,
  MapPin,
  Phone,
  Rocket,
  Save,
  Settings2,
  Share2,
  Trash2,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { useAuth } from "@/features/auth/AuthProvider";
import { useMyProfile, useNicknameAvailable, useSetProfileAvatar, useUpdateProfile } from "./hooks";
import { useBusinessProfile, useSetBusinessLogo } from "@/features/loyalty/hooks";
import { isSupportedImage, uploadBusinessAssetImage, uploadUserAvatarImage } from "@/lib/image";
import { BusinessGate } from "@/features/admin/BusinessGate";
import { BusinessProfileForm } from "@/features/admin/BusinessProfileForm";
import { ProgramPage } from "@/features/admin/ProgramPage";
import { EconomicPage } from "@/features/admin/EconomicPage";
import { errorMessage } from "@/lib/errors";
import { formatDateBogota } from "@/lib/format";
import { useFormDraft } from "@/lib/useFormDraft";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Field } from "@/components/shared/Field";
import { PageHeader } from "@/components/shared/PageHeader";
import { ErrorState, LoadingScreen } from "@/components/shared/States";
import { ProfileAvatarSvg } from "@/features/customer/pixelSprites";
import type { Business, MyProfile } from "@/types";

const profileTabs = [
  { value: "negocio", label: "Negocio", icon: Building2 },
  { value: "programa", label: "Programa", icon: Settings2 },
  { value: "economico", label: "Económico", icon: Banknote },
] as const;

type ProfileTab = (typeof profileTabs)[number]["value"];
const validProfileTabs = new Set<string>(profileTabs.map((item) => item.value));

const NICKNAME_PATTERN = /^[a-z0-9._-]{3,24}$/;
const PHONE_PATTERN = /^[0-9+\-\s()]{7,25}$/;

function todayBogota(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date());
}

const profileSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Escribe tu nombre (mínimo 2 caracteres).")
    .max(120, "El nombre no puede superar 120 caracteres."),
  nickname: z
    .string()
    .trim()
    .toLowerCase()
    .regex(
      NICKNAME_PATTERN,
      "El alias debe tener 3 a 24 caracteres: minúsculas, números, punto, guion o guion bajo.",
    ),
  phone: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || PHONE_PATTERN.test(value),
      "Escribe un número de teléfono válido (7 a 25 dígitos o caracteres + - ( )).",
    ),
  birthDate: z
    .string()
    .trim()
    .refine((value) => {
      if (value === "") return true;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
      const today = todayBogota();
      return value >= "1900-01-01" && value <= today;
    }, "Selecciona una fecha de nacimiento válida (no futura)."),
});

interface ProfileFormState {
  fullName: string;
  nickname: string;
  phone: string;
  birthDate: string;
}

/**
 * Perfil personal y configuración del negocio estilo red social (Facebook).
 */
export function ProfilePage() {
  const profile = useMyProfile();
  const updateProfile = useUpdateProfile();
  const setAvatar = useSetProfileAvatar();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const { user } = useAuth();
  const { pathname } = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get("tab") ?? "negocio";
  const tab: ProfileTab = validProfileTabs.has(rawTab) ? (rawTab as ProfileTab) : "negocio";
  // Solo el portal /admin expone pestañas de administración; /customer/perfil y /perfil son cuenta personal.
  const showBusinessTabs = pathname.startsWith("/admin");
  const isCustomerPortal = pathname.startsWith("/customer");
  const insideShell = pathname.startsWith("/admin") || isCustomerPortal;

  const draft = useFormDraft<ProfileFormState>({
    key: `profile:${user?.id ?? "anon"}`,
  });

  const [form, setForm] = useState<ProfileFormState | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof ProfileFormState, string>>>({});

  useEffect(() => {
    if (!profile.data || initialized) return;
    const saved = draft.read();
    setForm({
      fullName: profile.data.full_name,
      nickname: profile.data.nickname ?? "",
      phone: profile.data.phone ?? "",
      birthDate: profile.data.birth_date ?? "",
      ...(saved ?? {}),
    });
    if (saved) setDirty(true);
    setInitialized(true);
  }, [draft.read, initialized, profile.data]);

  useEffect(() => {
    if (dirty && form) draft.save(form);
  }, [dirty, draft.save, form]);

  const currentNickname = profile.data?.nickname ?? "";
  const normalizedNickname = (form?.nickname ?? "").trim().toLowerCase();
  const nicknameChanged = normalizedNickname !== currentNickname;
  const canChangeNickname =
    Boolean(profile.data) &&
    (profile.data?.nickname == null || (profile.data?.nickname_changes_left ?? 0) > 0);

  const availability = useNicknameAvailable(
    canChangeNickname && nicknameChanged ? normalizedNickname : "",
  );

  if (profile.isLoading) return <LoadingScreen label="Cargando tu perfil…" />;

  if (profile.isError || !profile.data) {
    return (
      <div
        className={
          insideShell ? "space-y-4" : "mx-auto w-full max-w-4xl space-y-4 px-0 py-4 sm:px-6 sm:py-6"
        }
      >
        {!insideShell && (
          <div className="px-4 sm:px-0">
            <BackLink />
          </div>
        )}
        <ErrorState
          error={profile.error ?? new Error("No encontramos tu perfil.")}
          onRetry={() => void profile.refetch()}
        />
      </div>
    );
  }

  const data = profile.data;
  const currentAvatarUrl = data.avatar_url ?? null;

  async function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !user) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Usa una imagen JPEG, PNG o WebP.");
      return;
    }
    setUploadingAvatar(true);
    try {
      const publicUrl = await uploadUserAvatarImage(user.id, file);
      await setAvatar.mutateAsync({ avatarUrl: publicUrl });
      toast.success("Foto de perfil actualizada.");
    } catch (error) {
      toast.error(errorMessage(error) || "No pudimos subir tu foto de perfil.");
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleAvatarRemove() {
    setUploadingAvatar(true);
    try {
      await setAvatar.mutateAsync({ avatarUrl: null });
      toast.success("Foto de perfil eliminada.");
    } catch (error) {
      toast.error(errorMessage(error) || "No pudimos quitar tu foto de perfil.");
    } finally {
      setUploadingAvatar(false);
    }
  }

  function changeTab(value: string) {
    const next = new URLSearchParams(searchParams);
    if (value === "negocio") {
      next.delete("tab");
    } else {
      next.set("tab", value);
    }
    setSearchParams(next, { replace: true });
  }

  function update<K extends keyof ProfileFormState>(key: K, value: string) {
    setDirty(true);
    setForm((current) => (current ? { ...current, [key]: value } : current));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form) return;

    const parsed = profileSchema.safeParse(form);
    if (!parsed.success) {
      const nextErrors: Partial<Record<keyof ProfileFormState, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof ProfileFormState | undefined;
        if (key && !nextErrors[key]) nextErrors[key] = issue.message;
      }
      setErrors(nextErrors);
      toast.error(parsed.error.issues[0]?.message ?? "Revisa tus datos.");
      return;
    }

    if (nicknameChanged && availability.data === false) {
      toast.error("Ese alias no está disponible. Elige otro.");
      return;
    }

    try {
      const nextPhone = parsed.data.phone;
      const nextBirthDate = parsed.data.birthDate;
      const phoneChanged = nextPhone !== (data.phone ?? "");
      const birthDateChanged = nextBirthDate !== (data.birth_date ?? "");

      const result = await updateProfile.mutateAsync({
        fullName: parsed.data.fullName,
        nickname: parsed.data.nickname,
        ...(phoneChanged ? { phone: nextPhone } : {}),
        ...(birthDateChanged
          ? nextBirthDate === ""
            ? { clearBirthDate: true }
            : { birthDate: nextBirthDate }
          : {}),
      });
      setForm({
        fullName: result.full_name,
        nickname: result.nickname ?? "",
        phone: result.phone ?? nextPhone,
        birthDate: result.birth_date ?? nextBirthDate,
      });
      setDirty(false);
      draft.clear();
      toast.success(
        result.nickname_changes_left > 0
          ? `Perfil guardado. Te quedan ${result.nickname_changes_left} cambio(s) de alias.`
          : "Perfil guardado. Ya usaste tus 2 cambios de alias.",
      );
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  const avatarFileInput = (
    <input
      ref={avatarInputRef}
      type="file"
      accept="image/jpeg,image/png,image/webp"
      className="sr-only"
      aria-label="Subir foto de perfil"
      onChange={(event) => void handleAvatarChange(event)}
    />
  );

  function renderPersonalForm(includeAvatarBanner: boolean) {
    return (
      <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
        {includeAvatarBanner && (
          <div className="lp-subpanel flex flex-wrap items-center justify-between gap-3 text-sm shadow-[var(--lp-shadow-md)]">
            <div className="flex min-w-0 items-center gap-3">
              {currentAvatarUrl ? (
                <img
                  src={currentAvatarUrl}
                  alt={data.full_name || data.email}
                  className="size-12 shrink-0 rounded-none border-2 border-[var(--lp-ink)] object-cover shadow-[var(--lp-shadow-sm)]"
                />
              ) : (
                <div className="grid size-12 shrink-0 place-items-center rounded-none border-2 border-[var(--lp-ink)] bg-card text-foreground shadow-[var(--lp-shadow-sm)]">
                  <UserRound className="size-5" aria-hidden="true" />
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate font-bold">{data.full_name || "Sin nombre"}</p>
                <p className="break-all font-mono text-xs text-muted-foreground">{data.email}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {data.business_count} negocio(s) · en Fideliapp desde{" "}
                  {formatDateBogota(data.created_at)}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploadingAvatar}
                onClick={() => avatarInputRef.current?.click()}
              >
                {uploadingAvatar ? (
                  <Loader2 className="animate-spin" aria-hidden="true" />
                ) : (
                  <Camera aria-hidden="true" />
                )}
                {currentAvatarUrl ? "Cambiar foto" : "Subir foto"}
              </Button>
              {currentAvatarUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={uploadingAvatar}
                  onClick={() => void handleAvatarRemove()}
                >
                  <Trash2 aria-hidden="true" />
                  Quitar
                </Button>
              )}
            </div>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            id="full-name"
            label={showBusinessTabs ? "Nombre de administrador" : "Nombre completo"}
            help="Así te verá el negocio en su equipo y en las listas internas."
            error={errors.fullName}
            required
          >
            <Input
              id="full-name"
              value={form?.fullName ?? ""}
              onChange={(event) => update("fullName", event.target.value)}
              autoComplete="name"
              aria-invalid={Boolean(errors.fullName)}
            />
          </Field>

          <Field
            id="nickname"
            label={showBusinessTabs ? "Alias de administrador" : "Alias público"}
            hint={
              canChangeNickname
                ? `Te quedan ${data.nickname_changes_left} de 2 cambios.`
                : "Ya usaste tus 2 cambios de alias. El alias actual se mantiene."
            }
            help="Se usa para identificarte en las listas del negocio. Solo minúsculas, números, punto, guion y guion bajo. El alias no aparece en los QR ni en datos de canje."
            error={errors.nickname}
          >
            <div className="relative">
              <AtSign
                className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id="nickname"
                className="pl-8"
                value={form?.nickname ?? ""}
                onChange={(event) => update("nickname", event.target.value.toLowerCase())}
                disabled={!canChangeNickname}
                maxLength={24}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                aria-invalid={Boolean(errors.nickname)}
              />
            </div>
          </Field>
        </div>

        {canChangeNickname && nicknameChanged && normalizedNickname.length >= 3 && (
          <div
            className="flex items-center gap-2 text-xs"
            aria-live="polite"
            data-testid="nickname-availability"
          >
            {availability.isFetching ? (
              <>
                <Loader2 className="size-4 animate-spin text-muted-foreground" aria-hidden="true" />
                <span className="text-muted-foreground">Comprobando disponibilidad…</span>
              </>
            ) : availability.data ? (
              <>
                <BadgeCheck className="size-4 text-[var(--lp-green-text)]" aria-hidden="true" />
                <span className="font-semibold text-[var(--lp-green-text)]">
                  @{normalizedNickname} está disponible.
                </span>
              </>
            ) : availability.data === false ? (
              <>
                <CircleAlert className="size-4 text-[var(--lp-red-text)]" aria-hidden="true" />
                <span className="font-semibold text-[var(--lp-red-text)]">
                  @{normalizedNickname} no está disponible o está reservado.
                </span>
              </>
            ) : null}
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            id="phone"
            label="Número de teléfono"
            help="Opcional. Útil para contacto o atención en tienda."
            error={errors.phone}
          >
            <div className="relative">
              <Phone
                className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id="phone"
                type="tel"
                className="pl-8"
                value={form?.phone ?? ""}
                onChange={(event) => update("phone", event.target.value)}
                placeholder="+57 300 123 4567"
                autoComplete="tel"
                maxLength={25}
                aria-invalid={Boolean(errors.phone)}
              />
            </div>
          </Field>

          <Field
            id="birth-date"
            label="Fecha de nacimiento"
            help="Opcional. Para beneficios especiales y recordatorios."
            error={errors.birthDate}
          >
            <div className="relative">
              <Calendar
                className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id="birth-date"
                type="date"
                className="pl-8"
                value={form?.birthDate ?? ""}
                onChange={(event) => update("birthDate", event.target.value)}
                max={todayBogota()}
                min="1900-01-01"
                aria-invalid={Boolean(errors.birthDate)}
              />
            </div>
          </Field>
        </div>

        <div className="flex justify-end pt-0.5">
          <Button
            type="submit"
            variant={isCustomerPortal ? "success" : "default"}
            loading={updateProfile.isPending}
            disabled={!dirty}
          >
            <Save aria-hidden="true" />
            Guardar perfil
          </Button>
        </div>
      </form>
    );
  }

  if (isCustomerPortal) {
    return (
      <section className="view-section active" id="viewUserProfile" aria-label="Perfil del usuario">
        {avatarFileInput}
        <div className="store-topbar-nav profile-topbar-nav">
          <Link to="/customer" className="pixel-btn pixel-btn-secondary" id="btnBackFromProfile">
            <span>◀ VOLVER</span>
          </Link>
          <span className="item-badge-highlight">@{data.nickname ?? "sin-alias"}</span>
        </div>

        <div className="pixel-box profile-view-card">
          <div className="pixel-box-dark profile-header-box">
            <div className="profile-header-left">
              <div className="brand-logo-box overflow-hidden" style={{ width: 48, height: 48 }}>
                {currentAvatarUrl ? (
                  <img
                    src={currentAvatarUrl}
                    alt={data.full_name || "Mi foto de perfil"}
                    className="size-full object-cover"
                  />
                ) : (
                  <ProfileAvatarSvg size={30} />
                )}
              </div>
              <div>
                <span className="pixel-title block text-[10px] text-[var(--gold-ink)]">
                  PLAYER PROFILE · DATOS BÁSICOS
                </span>
                <h1 className="font-display text-xl font-bold text-[var(--ink)]">Mi perfil</h1>
                <p className="text-xs text-[var(--text-muted)]">
                  Actualiza tu información de cliente
                </p>
              </div>
            </div>
            <span className="item-badge-highlight">CLIENTE ACTIVO</span>
          </div>

          {renderPersonalForm(true)}
        </div>
      </section>
    );
  }

  const personalCard = (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <UserRound className="size-4 text-primary" aria-hidden="true" />
          {showBusinessTabs ? "Cuenta del administrador" : "Datos personales"}
        </CardTitle>
      </CardHeader>
      <CardContent>{renderPersonalForm(!showBusinessTabs)}</CardContent>
    </Card>
  );

  return (
    <div
      className={
        insideShell
          ? "space-y-4 sm:space-y-5 animate-fade-in"
          : "mx-auto w-full max-w-4xl space-y-4 px-0 py-4 sm:space-y-5 sm:px-6 sm:py-6 animate-fade-in"
      }
    >
      {avatarFileInput}
      {!insideShell && (
        <div className="px-4 sm:px-0">
          <BackLink />
        </div>
      )}
      <PageHeader
        kicker={showBusinessTabs ? "PERFIL Y AJUSTES DEL NEGOCIO" : "CUENTA PERSONAL"}
        title="Mi perfil"
        description={
          showBusinessTabs
            ? "Administra tu cuenta de administrador, la portada y redes de tu negocio, el programa de monedas y los datos económicos."
            : "Tu nombre, alias público, teléfono y fecha de nacimiento en Fideliapp."
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">
              <AtSign aria-hidden="true" />@{data.nickname ?? "sin-alias"}
            </Badge>
            {showBusinessTabs && (
              <Button variant="outline" size="sm" asChild>
                <Link to="/admin/onboarding">
                  <Rocket aria-hidden="true" />
                  Asistente
                </Link>
              </Button>
            )}
          </div>
        }
      />

      {showBusinessTabs ? (
        <Tabs value={tab} onValueChange={changeTab}>
          <TabsList aria-label="Secciones de perfil y negocio">
            {profileTabs.map((item) => {
              const Icon = item.icon;
              return (
                <TabsTrigger key={item.value} value={item.value}>
                  <Icon className="mr-1.5 size-4" aria-hidden="true" />
                  {item.label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value="negocio" className="mt-3 space-y-4">
            <BusinessGate
              headingAs="h2"
              title="Negocio"
              description="Elige el negocio que deseas configurar."
              icon={Building2}
              emptyDescription="Registra un negocio para configurar su ficha."
            >
              {(business) => (
                <SocialBusinessProfileLayout
                  key={business.id}
                  business={business}
                  adminProfile={data}
                  uploadingAvatar={uploadingAvatar}
                  onUploadAvatarClick={() => avatarInputRef.current?.click()}
                  onRemoveAvatar={() => void handleAvatarRemove()}
                  adminPersonalCard={personalCard}
                />
              )}
            </BusinessGate>
          </TabsContent>

          <TabsContent value="programa" className="mt-3">
            <ProgramPage headingAs="h2" embedded />
          </TabsContent>

          <TabsContent value="economico" className="mt-3">
            <EconomicPage headingAs="h2" embedded />
          </TabsContent>
        </Tabs>
      ) : (
        personalCard
      )}
    </div>
  );
}

function SocialBusinessProfileLayout({
  business,
  adminProfile,
  uploadingAvatar,
  onUploadAvatarClick,
  onRemoveAvatar,
  adminPersonalCard,
}: {
  business: Business;
  adminProfile: MyProfile;
  uploadingAvatar: boolean;
  onUploadAvatarClick: () => void;
  onRemoveAvatar: () => void;
  adminPersonalCard: React.ReactNode;
}) {
  const businessProfileQuery = useBusinessProfile(business.id);
  const setLogo = useSetBusinessLogo();
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);

  const bizProfile = businessProfileQuery.data;
  const coverUrl = bizProfile?.logo_url ?? null;
  const businessName = bizProfile?.name ?? business.name;
  const businessSlug = bizProfile?.slug ?? business.slug;

  async function handleCoverUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!isSupportedImage(file)) {
      toast.error("Usa una imagen JPEG, PNG o WebP.");
      return;
    }
    setUploadingCover(true);
    try {
      const publicUrl = await uploadBusinessAssetImage({
        businessId: business.id,
        folder: "logo",
        file,
      });
      await setLogo.mutateAsync({ businessId: business.id, logoUrl: publicUrl });
      toast.success("Foto del negocio actualizada.");
    } catch (error) {
      toast.error(
        errorMessage(error) || "No pudimos subir la foto del negocio. Intenta nuevamente.",
      );
    } finally {
      setUploadingCover(false);
    }
  }

  async function handleRemoveCover() {
    setUploadingCover(true);
    try {
      await setLogo.mutateAsync({ businessId: business.id, logoUrl: null });
      toast.success("Foto del negocio eliminada.");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setUploadingCover(false);
    }
  }

  const locationSummary = [bizProfile?.address, bizProfile?.neighborhood, bizProfile?.city]
    .filter(Boolean)
    .join(", ");

  const activeSocials = [
    bizProfile?.instagram ? { label: "Instagram", value: bizProfile.instagram } : null,
    bizProfile?.facebook ? { label: "Facebook", value: bizProfile.facebook } : null,
    bizProfile?.tiktok ? { label: "TikTok", value: bizProfile.tiktok } : null,
    bizProfile?.twitter ? { label: "X", value: bizProfile.twitter } : null,
    bizProfile?.youtube ? { label: "YouTube", value: bizProfile.youtube } : null,
    bizProfile?.phone_whatsapp ? { label: "WhatsApp", value: bizProfile.phone_whatsapp } : null,
    bizProfile?.website ? { label: "Web", value: bizProfile.website } : null,
  ].filter((item): item is { label: string; value: string } => item !== null);

  return (
    <div className="space-y-4">
      {/* Cabecera estilo red social (Facebook): portada del negocio + foto de perfil del administrador superpuesta */}
      <Card className="overflow-hidden border-[3px] border-[var(--lp-ink)] shadow-[5px_5px_0_var(--lp-ink)]">
        <div className="relative h-44 w-full border-b-[3px] border-[var(--lp-ink)] bg-[var(--lp-surface-elevated-deep)] sm:h-56">
          {coverUrl ? (
            <>
              <img
                src={coverUrl}
                alt={`Foto o portada de ${businessName}`}
                className="size-full object-cover"
              />
              <div
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent"
                aria-hidden="true"
              />
              <div className="absolute left-4 top-4 hidden size-16 overflow-hidden border-2 border-[var(--lp-ink)] bg-card shadow-[3px_3px_0_var(--lp-ink)] sm:block">
                <img
                  src={coverUrl}
                  alt={`Miniatura de ${businessName}`}
                  className="size-full object-cover"
                />
              </div>
            </>
          ) : (
            <div className="flex size-full flex-col items-center justify-center gap-2 px-4 text-center text-[var(--lp-surface-elevated-soft)]">
              <div className="grid size-12 place-items-center border-2 border-[var(--lp-ink)] bg-[var(--lp-gold)] text-[#16262e] shadow-[3px_3px_0_var(--lp-ink)]">
                <Building2 className="size-6" aria-hidden="true" />
              </div>
              <p className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--lp-gold)]">
                Portada / foto del negocio
              </p>
              <p className="max-w-sm text-xs text-[var(--lp-surface-elevated-soft)]">
                Sube el logo o la foto principal de {businessName} para mostrarla a tus clientes.
              </p>
            </div>
          )}

          {/* Controles de portada del negocio */}
          <div className="absolute bottom-3 right-3 z-10 flex flex-wrap items-center gap-2">
            <input
              ref={coverInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              tabIndex={-1}
              aria-label="Subir foto del negocio"
              data-testid="logo-input"
              onChange={(event) => void handleCoverUpload(event)}
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              loading={uploadingCover}
              onClick={() => coverInputRef.current?.click()}
            >
              <Camera aria-hidden="true" />
              {coverUrl ? "Cambiar foto del negocio" : "Subir foto del negocio"}
            </Button>
            {coverUrl && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="bg-card/95"
                disabled={uploadingCover}
                onClick={() => void handleRemoveCover()}
              >
                <Trash2 aria-hidden="true" />
                Quitar
              </Button>
            )}
          </div>
        </div>

        {/* Franja inferior con foto del administrador superpuesta e identidad */}
        <div className="bg-card px-4 pb-4 pt-3 sm:px-6 sm:pb-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
              <div className="relative -mt-14 w-fit shrink-0 sm:-mt-16">
                <div className="grid size-24 place-items-center overflow-hidden border-[3px] border-[var(--lp-ink)] bg-card shadow-[4px_4px_0_var(--lp-ink)] sm:size-28">
                  {adminProfile.avatar_url ? (
                    <img
                      src={adminProfile.avatar_url}
                      alt={adminProfile.full_name || adminProfile.email}
                      className="size-full object-cover"
                    />
                  ) : (
                    <UserRound className="size-10 text-muted-foreground" aria-hidden="true" />
                  )}
                </div>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="secondary"
                  disabled={uploadingAvatar}
                  onClick={onUploadAvatarClick}
                  aria-label={
                    adminProfile.avatar_url ? "Cambiar foto de perfil" : "Subir foto de perfil"
                  }
                  title={
                    adminProfile.avatar_url ? "Cambiar foto de perfil" : "Subir foto de perfil"
                  }
                  className="absolute -bottom-1.5 -right-1.5 size-8 border-2 border-[var(--lp-ink)] shadow-[2px_2px_0_var(--lp-ink)]"
                >
                  {uploadingAvatar ? (
                    <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                  ) : (
                    <Camera className="size-3.5" aria-hidden="true" />
                  )}
                </Button>
              </div>

              <div className="min-w-0 space-y-1 pb-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-2xl font-black tracking-tight sm:text-3xl">
                    {businessName}
                  </h2>
                  <Badge variant="outline" className="font-mono text-xs">
                    @{businessSlug}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Administrador:{" "}
                  <strong className="text-foreground">
                    {adminProfile.full_name || "Sin nombre"}
                  </strong>{" "}
                  · <span className="font-mono text-xs">{adminProfile.email}</span>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploadingAvatar}
                onClick={onUploadAvatarClick}
              >
                <Camera aria-hidden="true" />
                {adminProfile.avatar_url ? "Cambiar foto admin" : "Subir foto admin"}
              </Button>
              {adminProfile.avatar_url && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={uploadingAvatar}
                  onClick={onRemoveAvatar}
                >
                  <Trash2 aria-hidden="true" />
                  Quitar foto
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Cuerpo de 2 columnas estilo configuración de red social */}
      <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)] lg:items-start">
        <aside className="space-y-4 lg:sticky lg:top-4" aria-label="Resumen del perfil">
          <Card>
            <CardHeader className="pb-2.5">
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="size-4 text-[var(--lp-accent-link)]" aria-hidden="true" />
                Información
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="text-xs leading-relaxed text-muted-foreground">
                {bizProfile?.description?.trim()
                  ? bizProfile.description
                  : "Agrega una descripción breve de tu negocio para tus clientes."}
              </p>

              <div className="space-y-2 border-t-2 border-[var(--lp-paper-deep)] pt-2.5 text-xs">
                <div className="flex items-start gap-2 text-muted-foreground">
                  <MapPin className="mt-0.5 size-3.5 shrink-0 text-foreground" aria-hidden="true" />
                  <span>{locationSummary || "Ubicación sin completar"}</span>
                </div>
                <div className="flex items-start gap-2 text-muted-foreground">
                  <CalendarDays
                    className="mt-0.5 size-3.5 shrink-0 text-foreground"
                    aria-hidden="true"
                  />
                  <span>
                    {(bizProfile?.operating_days ?? business.operating_days ?? []).length} día(s) de
                    operación · {bizProfile?.timezone ?? business.timezone}
                  </span>
                </div>
                <div className="flex items-start gap-2 text-muted-foreground">
                  <Globe className="mt-0.5 size-3.5 shrink-0 text-foreground" aria-hidden="true" />
                  <span className="break-all font-mono">/join/{businessSlug}</span>
                </div>
              </div>

              <div className="space-y-2 border-t-2 border-[var(--lp-paper-deep)] pt-2.5">
                <p className="flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  <Share2 className="size-3" aria-hidden="true" />
                  Redes conectadas
                </p>
                {activeSocials.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Aún no has vinculado redes sociales. Agrégalas en el panel derecho.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {activeSocials.map((social) => (
                      <Badge key={social.label} variant="secondary" className="max-w-full truncate">
                        {social.label}: {social.value}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t-2 border-[var(--lp-paper-deep)] pt-2.5 text-xs text-muted-foreground">
                {adminProfile.business_count} negocio(s) · en Fideliapp desde{" "}
                {formatDateBogota(adminProfile.created_at)}
              </div>
            </CardContent>
          </Card>
        </aside>

        <div className="min-w-0 space-y-4">
          {adminPersonalCard}
          <BusinessProfileForm business={business} embeddedSocialLayout />
        </div>
      </div>
    </div>
  );
}

function BackLink() {
  const { roles = [] } = useAuth();
  const target = roles.includes("registrar")
    ? "/encargado"
    : roles.includes("admin")
      ? "/admin/dashboard"
      : "/";
  return (
    <Button asChild variant="ghost" size="sm">
      <Link to={target}>
        <ArrowLeft aria-hidden="true" />
        Volver
      </Link>
    </Button>
  );
}
