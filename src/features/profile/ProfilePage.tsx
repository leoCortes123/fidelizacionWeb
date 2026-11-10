import { useEffect, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  AtSign,
  BadgeCheck,
  Banknote,
  Building2,
  CircleAlert,
  Loader2,
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

const profileTabs = [
  { value: "negocio", label: "Negocio", icon: Building2 },
  { value: "programa", label: "Programa", icon: Settings2 },
  { value: "economico", label: "Económico", icon: Banknote },
] as const;

type ProfileTab = (typeof profileTabs)[number]["value"];
const validProfileTabs = new Set<string>(profileTabs.map((item) => item.value));

const NICKNAME_PATTERN = /^[a-z0-9._-]{3,24}$/;

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
});

interface ProfileFormState {
  fullName: string;
  nickname: string;
}

/**
 * Perfil personal: nombre y alias público. El servidor es la autoridad del
 * límite de 2 cambios de alias y devuelve cuántos quedan.
 */
export function ProfilePage() {
  const profile = useMyProfile();
  const updateProfile = useUpdateProfile();
  const { user, roles } = useAuth();
  const { pathname } = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get("tab") ?? "negocio";
  const tab: ProfileTab = validProfileTabs.has(rawTab) ? (rawTab as ProfileTab) : "negocio";
  const showBusinessTabs = Boolean(roles?.includes("admin")) || pathname.startsWith("/admin");
  const insideShell = pathname.startsWith("/admin") || pathname.startsWith("/customer");

  const draft = useFormDraft<ProfileFormState>({
    key: `profile:${user?.id ?? "anon"}`,
  });

  const [form, setForm] = useState<ProfileFormState | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof ProfileFormState, string>>>({});

  useEffect(() => {
    if (!profile.data || initialized) return;
    setForm(
      draft.read() ?? {
        fullName: profile.data.full_name,
        nickname: profile.data.nickname ?? "",
      },
    );
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
      <div className="space-y-4">
        {!insideShell && <BackLink />}
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
      const result = await updateProfile.mutateAsync({
        fullName: parsed.data.fullName,
        nickname: parsed.data.nickname,
      });
      setForm({ fullName: result.full_name, nickname: result.nickname ?? "" });
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

  const personalCard = (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <UserRound className="size-4 text-primary" aria-hidden="true" />
          Datos personales
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div className="rounded-lg border border-slate-200 bg-muted/50 p-4 text-sm dark:border-slate-800">
            <p className="font-bold">{data.full_name || "Sin nombre"}</p>
            <p className="font-mono text-xs text-muted-foreground">{data.email}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {data.business_count} negocio(s) · en Loopoint desde{" "}
              {formatDateBogota(data.created_at)}
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
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id="nickname"
                className="pl-9"
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
                  <Loader2
                    className="size-4 animate-spin text-muted-foreground"
                    aria-hidden="true"
                  />
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

          <div className="flex justify-end">
            <Button type="submit" loading={updateProfile.isPending} disabled={!dirty}>
              <Save aria-hidden="true" />
              Guardar perfil
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );

  return (
    <div
      className={
        insideShell
          ? "space-y-5 animate-fade-in"
          : "mx-auto w-full max-w-4xl space-y-5 px-4 py-6 animate-fade-in"
      }
    >
      {!insideShell && <BackLink />}
      <PageHeader
        kicker={showBusinessTabs ? "PERFIL Y AJUSTES DEL NEGOCIO" : "CUENTA PERSONAL"}
        title="Mi perfil"
        description={
          showBusinessTabs
            ? "Tu cuenta personal y la configuración de Negocio, Programa y Económico."
            : "Tu nombre y tu alias público en Loopoint."
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

          <TabsContent value="negocio" className="mt-4 space-y-5">
            {personalCard}
            <BusinessGate
              title="Negocio"
              description="Elige el negocio que deseas configurar."
              icon={Building2}
              emptyDescription="Registra un negocio para configurar su ficha."
            >
              {(business) => (
                <div className="space-y-4">
                  <PageHeader
                    title="Negocio"
                    description="Ficha pública, contacto, horarios y logo."
                  />
                  <BusinessProfileForm key={business.id} business={business} />
                </div>
              )}
            </BusinessGate>
          </TabsContent>

          <TabsContent value="programa" className="mt-4">
            <ProgramPage />
          </TabsContent>

          <TabsContent value="economico" className="mt-4">
            <EconomicPage />
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
