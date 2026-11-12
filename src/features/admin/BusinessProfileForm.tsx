import { useEffect, useRef, useState } from "react";
import {
  Building2,
  CalendarDays,
  Camera,
  CheckCircle2,
  ImageOff,
  Loader2,
  MapPin,
  Phone,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import {
  useBusinessProfile,
  useSetBusinessLogo,
  useUpdateBusiness,
  useUpdateBusinessProfile,
} from "@/features/loyalty/hooks";
import {
  COMMON_TIMEZONES,
  DAY_LABELS,
  DAY_PRESETS,
  TIMEZONES,
} from "@/features/loyalty/programEconomics";
import { errorMessage } from "@/lib/errors";
import { useFormDraft } from "@/lib/useFormDraft";
import { isSupportedImage, uploadBusinessAssetImage } from "@/lib/image";
import { cn } from "@/lib/utils";
import type { Business, BusinessProfile } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Field } from "@/components/shared/Field";
import { ErrorState, LoadingScreen } from "@/components/shared/States";

const phonePattern = /^\+?[0-9\s().-]{7,20}$/;
const instagramPattern = /^@?[A-Za-z0-9._]{1,30}$/;
const websitePattern = /^(https?:\/\/)?[^\s]+\.[^\s]{2,}$/;

export const businessProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres.")
    .max(120, "El nombre no puede superar 120 caracteres."),
  description: z.string().trim().max(500, "La descripción no puede superar 500 caracteres."),
  address: z.string().trim().max(160, "La dirección supera 160 caracteres."),
  neighborhood: z.string().trim().max(160, "El barrio supera 160 caracteres."),
  city: z.string().trim().max(160, "La ciudad supera 160 caracteres."),
  phoneWhatsapp: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || phonePattern.test(value),
      "Escribe un WhatsApp válido (7 a 15 dígitos).",
    ),
  phone: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || phonePattern.test(value),
      "Escribe un teléfono válido (7 a 15 dígitos).",
    ),
  instagram: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || instagramPattern.test(value),
      "Escribe un usuario de Instagram válido.",
    ),
  website: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || websitePattern.test(value),
      "Escribe una dirección web válida.",
    ),
  timezone: z.string().trim().min(1, "Elige una zona horaria."),
  operatingDays: z
    .array(z.number().int().min(1).max(7))
    .min(1, "Selecciona al menos un día de operación."),
});

export type BusinessProfileFormState = z.infer<typeof businessProfileSchema>;

function normalizeOperatingDays(days: number[] | null | undefined, fallback: number[]): number[] {
  const source = days && days.length > 0 ? days : fallback;
  return [...new Set(source)].filter((day) => day >= 1 && day <= 7).sort((a, b) => a - b);
}

function sameDays(left: number[], right: number[]): boolean {
  if (left.length !== right.length) return false;
  return left.every((day, index) => day === right[index]);
}

function fromProfile(
  profile: BusinessProfile,
  fallbackBusiness?: Business,
): BusinessProfileFormState {
  return {
    name: profile.name,
    description: profile.description ?? "",
    address: profile.address ?? "",
    neighborhood: profile.neighborhood ?? "",
    city: profile.city ?? "",
    phoneWhatsapp: profile.phone_whatsapp ?? "",
    phone: profile.phone ?? "",
    instagram: profile.instagram ?? "",
    website: profile.website ?? "",
    timezone: profile.timezone || fallbackBusiness?.timezone || "America/Bogota",
    operatingDays: normalizeOperatingDays(
      profile.operating_days,
      fallbackBusiness?.operating_days ?? [1, 2, 3, 4, 5, 6],
    ),
  };
}

/**
 * Ficha del negocio: datos públicos, contacto, redes y logo. El logo se
 * comprime en el navegador y se sube al bucket `business-assets`; la base de
 * datos valida que la URL pertenece al negocio.
 */
export function BusinessProfileForm({ business }: { business: Business }) {
  const profile = useBusinessProfile(business.id);

  if (profile.isLoading) return <LoadingScreen label="Cargando el perfil del negocio…" />;
  if (profile.isError || !profile.data) {
    return (
      <ErrorState
        error={profile.error ?? new Error("No encontramos el negocio.")}
        onRetry={() => void profile.refetch()}
      />
    );
  }

  return <BusinessProfileFields business={business} profile={profile.data} />;
}

function BusinessProfileFields({
  business,
  profile,
}: {
  business: Business;
  profile: BusinessProfile;
}) {
  const updateProfile = useUpdateBusinessProfile();
  const updateBusiness = useUpdateBusiness();
  const setLogo = useSetBusinessLogo();
  const draft = useFormDraft<BusinessProfileFormState>({
    key: `admin:business-profile:${business.id}`,
  });
  const fileInput = useRef<HTMLInputElement | null>(null);
  const baseProfile = fromProfile(profile, business);
  const [restoredDraft] = useState(() => draft.read());
  const [form, setForm] = useState<BusinessProfileFormState>(() =>
    restoredDraft ? { ...baseProfile, ...restoredDraft } : baseProfile,
  );
  const [errors, setErrors] = useState<Partial<Record<keyof BusinessProfileFormState, string>>>({});
  const [dirty, setDirty] = useState(() => Boolean(restoredDraft));
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (dirty) draft.save(form);
  }, [dirty, draft.save, form]);

  function update<K extends keyof BusinessProfileFormState>(
    key: K,
    value: BusinessProfileFormState[K],
  ) {
    setDirty(true);
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  function toggleDay(day: number) {
    const next = form.operatingDays.includes(day)
      ? form.operatingDays.filter((item) => item !== day)
      : [...form.operatingDays, day].sort((a, b) => a - b);
    update("operatingDays", next);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = businessProfileSchema.safeParse(form);
    if (!parsed.success) {
      const nextErrors: Partial<Record<keyof BusinessProfileFormState, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof BusinessProfileFormState | undefined;
        if (key && !nextErrors[key]) nextErrors[key] = issue.message;
      }
      setErrors(nextErrors);
      toast.error(parsed.error.issues[0]?.message ?? "Revisa los datos del negocio.");
      return;
    }

    const sortedDays = normalizeOperatingDays(parsed.data.operatingDays, [1, 2, 3, 4, 5, 6]);
    const scheduleChanged =
      parsed.data.timezone !== baseProfile.timezone ||
      !sameDays(sortedDays, baseProfile.operatingDays);

    try {
      let updatedSchedule: { timezone: string; operating_days: number[] } | null = null;
      if (scheduleChanged) {
        updatedSchedule = await updateBusiness.mutateAsync({
          businessId: business.id,
          name: parsed.data.name,
          timezone: parsed.data.timezone,
          operatingDays: sortedDays,
        });
      }
      const result = await updateProfile.mutateAsync({
        businessId: business.id,
        name: parsed.data.name,
        description: parsed.data.description,
        address: parsed.data.address,
        neighborhood: parsed.data.neighborhood,
        city: parsed.data.city,
        phoneWhatsapp: parsed.data.phoneWhatsapp,
        phone: parsed.data.phone,
        instagram: parsed.data.instagram,
        website: parsed.data.website,
      });
      setForm({
        ...fromProfile(result, business),
        timezone: updatedSchedule?.timezone ?? result.timezone ?? parsed.data.timezone,
        operatingDays: updatedSchedule?.operating_days ?? sortedDays,
      });
      setDirty(false);
      draft.clear();
      toast.success("Datos del negocio guardados.");
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  async function handleLogo(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!isSupportedImage(file)) {
      toast.error("Usa una imagen JPEG, PNG o WebP.");
      return;
    }

    setUploading(true);
    try {
      const publicUrl = await uploadBusinessAssetImage({
        businessId: business.id,
        folder: "logo",
        file,
      });
      await setLogo.mutateAsync({
        businessId: business.id,
        logoUrl: publicUrl,
      });
      toast.success("Logo actualizado.");
    } catch (error) {
      toast.error(
        errorMessage(error) || "No pudimos subir el logo. Revisa el almacenamiento del negocio.",
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleRemoveLogo() {
    setUploading(true);
    try {
      await setLogo.mutateAsync({ businessId: business.id, logoUrl: null });
      toast.success("Logo eliminado.");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-4 sm:space-y-5 animate-fade-in">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="size-4 text-muted-foreground" aria-hidden="true" />
            Identidad del negocio
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-5">
          <div className="flex flex-col gap-4 rounded-none border bg-muted/20 p-3.5 sm:flex-row sm:items-center sm:p-4">
            <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-none border bg-background">
              {profile.logo_url ? (
                <img
                  src={profile.logo_url}
                  alt={`Logo de ${profile.name}`}
                  className="size-full object-cover"
                />
              ) : (
                <ImageOff className="size-7 text-muted-foreground" aria-hidden="true" />
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-sm font-semibold">Logo o foto del negocio</p>
              <p className="text-xs text-muted-foreground">
                JPEG, PNG o WebP. Se reduce a 1200 px y se sube de forma segura.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  loading={uploading}
                  onClick={() => fileInput.current?.click()}
                >
                  <Camera aria-hidden="true" />
                  {profile.logo_url ? "Reemplazar logo" : "Subir logo"}
                </Button>
                {profile.logo_url && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => void handleRemoveLogo()}
                    disabled={uploading}
                  >
                    <Trash2 aria-hidden="true" />
                    Quitar
                  </Button>
                )}
              </div>
              <input
                ref={fileInput}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                tabIndex={-1}
                data-testid="logo-input"
                onChange={(event) => void handleLogo(event)}
              />
            </div>
            {uploading && (
              <Loader2 className="size-5 animate-spin text-muted-foreground" aria-hidden="true" />
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                id="business-name"
                label="Nombre del negocio"
                hint="Es el nombre visible para tus clientes en su billetera de puntos y códigos QR."
                error={errors.name}
                required
              >
                <Input
                  id="business-name"
                  value={form.name}
                  onChange={(event) => update("name", event.target.value)}
                  aria-invalid={Boolean(errors.name)}
                />
              </Field>
              <Field
                id="business-slug"
                label="Enlace público"
                hint="Enlace único con el que se afilian tus clientes. No se puede cambiar para no romper los QR."
              >
                <Input id="business-slug" value={`/join/${profile.slug}`} readOnly disabled />
              </Field>
            </div>

            <Field
              id="business-description"
              label="Descripción"
              hint="Cuenta brevemente qué ofrece tu negocio; aparecerá en tu página pública de invitación."
              error={errors.description}
            >
              <Textarea
                id="business-description"
                value={form.description}
                onChange={(event) => update("description", event.target.value)}
                rows={3}
                maxLength={500}
                aria-invalid={Boolean(errors.description)}
              />
            </Field>

            <div className="space-y-4 rounded-none border border-border/80 bg-muted/20 p-3.5 sm:p-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <CalendarDays className="size-4 text-muted-foreground" aria-hidden="true" />
                Horario y zona horaria
              </div>

              <div className="space-y-2">
                <Label htmlFor="business-timezone">Zona horaria</Label>
                <select
                  id="business-timezone"
                  value={form.timezone}
                  onChange={(event) => update("timezone", event.target.value)}
                  className="flex h-9 w-full cursor-pointer rounded-none border border-input bg-background px-2 py-1 text-base font-medium shadow-sm transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 dark:border-slate-700 dark:bg-slate-900/90 md:text-sm"
                >
                  {(TIMEZONES.includes(form.timezone)
                    ? TIMEZONES
                    : [form.timezone, ...TIMEZONES]
                  ).map((zone) => (
                    <option key={zone} value={zone}>
                      {zone}
                    </option>
                  ))}
                </select>
                <div
                  className="flex flex-wrap gap-1.5"
                  role="group"
                  aria-label="Zonas horarias frecuentes"
                >
                  {COMMON_TIMEZONES.map((zone) => {
                    const active = form.timezone === zone.value;
                    return (
                      <button
                        key={zone.value}
                        type="button"
                        aria-pressed={active}
                        onClick={() => update("timezone", zone.value)}
                        className={cn(
                          "min-h-8 cursor-pointer rounded-none border px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          active
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
                        )}
                      >
                        {zone.label}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground">
                  Se usa para mostrar las fechas en tu hora local y calcular vencimientos.
                </p>
                {errors.timezone && (
                  <p className="text-xs font-medium text-destructive" role="alert">
                    {errors.timezone}
                  </p>
                )}
              </div>

              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Label>Días de operación</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {DAY_PRESETS.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => update("operatingDays", [...preset.days])}
                        className="cursor-pointer rounded-none border border-border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
                  {Object.entries(DAY_LABELS).map(([day, label]) => {
                    const value = Number(day);
                    const selected = form.operatingDays.includes(value);
                    return (
                      <button
                        key={day}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => toggleDay(value)}
                        className={cn(
                          "min-h-10 cursor-pointer rounded-none border px-2.5 py-1.5 text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-h-11 sm:px-3 sm:py-2",
                          selected
                            ? "border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                            : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
                        )}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground">
                  Indica qué días atiende tu negocio. Ayuda a estimar los días de operación al mes
                  en tus datos económicos.
                </p>
                {errors.operatingDays && (
                  <p className="text-xs font-medium text-destructive" role="alert">
                    {errors.operatingDays}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm font-semibold">
              <MapPin className="size-4 text-muted-foreground" aria-hidden="true" />
              Ubicación
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="business-address" label="Dirección" error={errors.address}>
                <Input
                  id="business-address"
                  value={form.address}
                  onChange={(event) => update("address", event.target.value)}
                  autoComplete="street-address"
                />
              </Field>
              <Field id="business-neighborhood" label="Barrio" error={errors.neighborhood}>
                <Input
                  id="business-neighborhood"
                  value={form.neighborhood}
                  onChange={(event) => update("neighborhood", event.target.value)}
                />
              </Field>
              <Field id="business-city" label="Ciudad" error={errors.city}>
                <Input
                  id="business-city"
                  value={form.city}
                  onChange={(event) => update("city", event.target.value)}
                  autoComplete="address-level2"
                />
              </Field>
            </div>

            <div className="flex items-center gap-2 text-sm font-semibold">
              <Phone className="size-4 text-muted-foreground" aria-hidden="true" />
              Contacto y redes
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                id="business-whatsapp"
                label="WhatsApp"
                hint="Con indicativo, por ejemplo +57 300 123 4567."
                error={errors.phoneWhatsapp}
              >
                <Input
                  id="business-whatsapp"
                  value={form.phoneWhatsapp}
                  onChange={(event) => update("phoneWhatsapp", event.target.value)}
                  inputMode="tel"
                  autoComplete="tel"
                />
              </Field>
              <Field id="business-phone" label="Teléfono fijo" error={errors.phone}>
                <Input
                  id="business-phone"
                  value={form.phone}
                  onChange={(event) => update("phone", event.target.value)}
                  inputMode="tel"
                />
              </Field>
              <Field
                id="business-instagram"
                label="Instagram"
                hint="Solo el usuario, con o sin @."
                error={errors.instagram}
              >
                <Input
                  id="business-instagram"
                  value={form.instagram}
                  onChange={(event) => update("instagram", event.target.value)}
                  autoCapitalize="none"
                  spellCheck={false}
                />
              </Field>
              <Field
                id="business-website"
                label="Sitio web"
                hint="Si no incluyes https://, lo añadimos nosotros."
                error={errors.website}
              >
                <Input
                  id="business-website"
                  value={form.website}
                  onChange={(event) => update("website", event.target.value)}
                  inputMode="url"
                  autoCapitalize="none"
                  spellCheck={false}
                />
              </Field>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {draft.hasDraft && <Badge variant="muted">Borrador guardado</Badge>}
                {profile.logo_url && <Badge variant="secondary">Logo activo</Badge>}
              </div>
              <Button
                type="submit"
                loading={updateProfile.isPending || updateBusiness.isPending}
                disabled={!dirty}
              >
                <CheckCircle2 aria-hidden="true" />
                Guardar datos del negocio
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
