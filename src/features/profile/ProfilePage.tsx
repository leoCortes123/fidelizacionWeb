import { useEffect, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  AtSign,
  BadgeCheck,
  Banknote,
  Building2,
  Cake,
  CircleAlert,
  Loader2,
  Phone,
  Rocket,
  Save,
  Settings2,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { useAuth } from "@/features/auth/AuthProvider";
import { useMyProfile, useNicknameAvailable, useUpdateProfile } from "./hooks";
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

import { cn } from "@/lib/utils";
import { PixelHeartIcon } from "@/features/customer/PlayerCard";

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
    }, "Selecciona una fecha de cumpleaños válida (no futura)."),
});

interface ProfileFormState {
  fullName: string;
  nickname: string;
  phone: string;
  birthDate: string;
}

/**
 * Perfil personal: nombre y alias público. El servidor es la autoridad del
 * límite de 2 cambios de alias y devuelve cuántos quedan.
 */
export function ProfilePage() {
  const profile = useMyProfile();
  const updateProfile = useUpdateProfile();
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

  const personalForm = (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div
        className={cn(
          "p-3.5 text-sm sm:p-4",
          isCustomerPortal
            ? "border-2 border-[var(--line)] bg-[var(--paper)]"
            : "rounded-none border border-slate-200 bg-muted/50 dark:border-slate-800",
        )}
      >
        <p className="font-bold">{data.full_name || "Sin nombre"}</p>
        <p className="break-all font-mono text-xs text-muted-foreground">{data.email}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {data.business_count} negocio(s) · en Loopoint desde {formatDateBogota(data.created_at)}
        </p>
      </div>

      <Field
        id="full-name"
        label={showBusinessTabs ? "Nombre de administrador" : "Nombre completo"}
        hint="Así te verá el negocio en su equipo y en las listas internas."
        error={errors.fullName}
        required
      >
        <Input
          id="full-name"
          value={form?.fullName ?? ""}
          onChange={(event) => update("fullName", event.target.value)}
          autoComplete="name"
          className={isCustomerPortal ? "border-2 border-[var(--line)] bg-[var(--paper)]" : undefined}
          aria-invalid={Boolean(errors.fullName)}
        />
      </Field>

      <Field
        id="nickname"
        label={showBusinessTabs ? "Alias de administrador" : "Alias público"}
        hint={
          canChangeNickname
            ? `Te quedan ${data.nickname_changes_left} de 2 cambios. El alias no aparece en los QR ni en datos de canje.`
            : "Ya usaste tus 2 cambios de alias. El alias actual se mantiene."
        }
        help="Se usa para identificarte en las listas del negocio. Solo minúsculas, números, punto, guion y guion bajo."
        error={errors.nickname}
      >
        <div className="relative">
          <AtSign
            className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="nickname"
            className={cn(
              "pl-8",
              isCustomerPortal && "border-2 border-[var(--line)] bg-[var(--paper)]",
            )}
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
              <BadgeCheck className="size-4 text-emerald-600" aria-hidden="true" />
              <span className="text-emerald-700 dark:text-emerald-400">
                @{normalizedNickname} está disponible.
              </span>
            </>
          ) : availability.data === false ? (
            <>
              <CircleAlert className="size-4 text-destructive" aria-hidden="true" />
              <span className="text-destructive">
                @{normalizedNickname} no está disponible o está reservado.
              </span>
            </>
          ) : null}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id="phone"
          label="Número de teléfono"
          hint="Opcional. Útil para contacto o atención en tienda."
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
              className={cn(
                "pl-8",
                isCustomerPortal && "border-2 border-[var(--line)] bg-[var(--paper)]",
              )}
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
          label="Fecha de cumpleaños"
          hint="Opcional. Para beneficios especiales en tu cumpleaños."
          error={errors.birthDate}
        >
          <div className="relative">
            <Cake
              className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="birth-date"
              type="date"
              className={cn(
                "pl-8",
                isCustomerPortal && "border-2 border-[var(--line)] bg-[var(--paper)]",
              )}
              value={form?.birthDate ?? ""}
              onChange={(event) => update("birthDate", event.target.value)}
              max={todayBogota()}
              min="1900-01-01"
              aria-invalid={Boolean(errors.birthDate)}
            />
          </div>
        </Field>
      </div>

      <div className="flex justify-end pt-1">
        <Button
          type="submit"
          loading={updateProfile.isPending}
          disabled={!dirty}
          className={isCustomerPortal ? "retro-btn retro-btn-red" : undefined}
        >
          <Save aria-hidden="true" />
          Guardar perfil
        </Button>
      </div>
    </form>
  );

  const personalCard = isCustomerPortal ? (
    <section className="pixel-window" aria-label="Datos personales">
      <div className="window-bar">
        <span className="window-title">
          <span className="window-led" aria-hidden="true" />
          PLAYER PROFILE · DATOS PERSONALES
        </span>
        <span className="window-hearts" aria-hidden="true">
          <PixelHeartIcon />
          <PixelHeartIcon />
          <PixelHeartIcon />
        </span>
      </div>
      <div className="window-body">{personalForm}</div>
    </section>
  ) : (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <UserRound className="size-4 text-primary" aria-hidden="true" />
          Datos personales
        </CardTitle>
      </CardHeader>
      <CardContent>{personalForm}</CardContent>
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
      {!insideShell && (
        <div className="px-4 sm:px-0">
          <BackLink />
        </div>
      )}
      {isCustomerPortal ? (
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <span className="retro-kicker">
              <span className="text-[var(--gold)]" aria-hidden="true">
                ★
              </span>
              CUENTA PERSONAL
            </span>
            <h1 className="font-display text-3xl font-bold tracking-tight text-[var(--ink)] sm:text-4xl">
              Mi perfil
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-[var(--ink-muted)]">
              Tu nombre, alias público, teléfono y fecha de cumpleaños en Loopoint.
            </p>
          </div>
          <span className="inline-flex w-fit items-center gap-1 border-2 border-[var(--line)] bg-[var(--gold)] px-3 py-1 font-mono text-xs font-bold text-[#1e1c1a] shadow-[3px_3px_0_var(--shadow-ink)]">
            <AtSign className="size-3.5" aria-hidden="true" />@{data.nickname ?? "sin-alias"}
          </span>
        </header>
      ) : (
        <PageHeader
          kicker={showBusinessTabs ? "PERFIL Y AJUSTES DEL NEGOCIO" : "CUENTA PERSONAL"}
          title="Mi perfil"
          description={
            showBusinessTabs
              ? "Administra tu cuenta personal y configura la identidad del negocio, las reglas del programa de loopoints y tus datos económicos opcionales."
              : "Tu nombre, alias público, teléfono y cumpleaños en Loopoint."
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
      )}

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

          <TabsContent value="negocio" className="mt-4 space-y-5">
            {personalCard}
            <BusinessGate
              headingAs="h2"
              title="Negocio"
              description="Elige el negocio que deseas configurar."
              icon={Building2}
              emptyDescription="Registra un negocio para configurar su ficha."
            >
              {(business) => (
                <div className="space-y-4">
                  <PageHeader
                    as="h2"
                    title="Negocio"
                    description="Define el nombre visible para tus clientes, enlace de afiliación, horarios de operación, ubicación, contacto y logo."
                  />
                  <BusinessProfileForm key={business.id} business={business} />
                </div>
              )}
            </BusinessGate>
          </TabsContent>

          <TabsContent value="programa" className="mt-4">
            <ProgramPage headingAs="h2" />
          </TabsContent>

          <TabsContent value="economico" className="mt-4">
            <EconomicPage headingAs="h2" />
          </TabsContent>
        </Tabs>
      ) : (
        personalCard
      )}
    </div>
  );
}

function BackLink() {
  return (
    <Button asChild variant="ghost" size="sm">
      <Link to="/">
        <ArrowLeft aria-hidden="true" />
        Volver
      </Link>
    </Button>
  );
}
