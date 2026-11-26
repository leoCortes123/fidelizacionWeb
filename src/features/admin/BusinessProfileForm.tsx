import { useEffect, useRef, useState } from "react";
import {
  Building2,
  CalendarDays,
  Camera,
  CheckCircle2,
  Globe,
  ImageOff,
  Loader2,
  MapPin,
  Phone,
  Share2,
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
import {
  isSupportedImage,
  removeBusinessAssetPath,
  storagePathFromPublicUrl,
  uploadBusinessAssetImage,
} from "@/lib/image";
import { cn } from "@/lib/utils";
import type { Business, BusinessProfile } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Field } from "@/components/shared/Field";
import { ErrorState, LoadingScreen } from "@/components/shared/States";

const phonePattern = /^\+?[0-9\s().-]{7,20}$/;
const instagramPattern = /^@?[A-Za-z0-9._]{1,30}$/;
const socialHandleOrUrlPattern = /^(@?[A-Za-z0-9._/@-]{2,120}|https?:\/\/[^\s]{4,120})$/;
const safeSocialValue = (value: string) =>
  value === "" ||
  (socialHandleOrUrlPattern.test(value) && !value.includes("..") && !/^javascript:/i.test(value));
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
  facebook: z
    .string()
    .trim()
    .max(120, "El usuario o enlace de Facebook supera 120 caracteres.")
    .refine(safeSocialValue, "Escribe un usuario o enlace de Facebook válido."),
  tiktok: z
    .string()
    .trim()
    .max(120, "El usuario o enlace de TikTok supera 120 caracteres.")
    .refine(safeSocialValue, "Escribe un usuario o enlace de TikTok válido."),
  twitter: z
    .string()
    .trim()
    .max(120, "El usuario o enlace de X supera 120 caracteres.")
    .refine(safeSocialValue, "Escribe un usuario o enlace de X (Twitter) válido."),
  youtube: z
    .string()
    .trim()
    .max(120, "El canal o enlace de YouTube supera 120 caracteres.")
    .refine(safeSocialValue, "Escribe un canal o enlace de YouTube válido."),
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
    facebook: profile.facebook ?? "",
    tiktok: profile.tiktok ?? "",
    twitter: profile.twitter ?? "",
    youtube: profile.youtube ?? "",
    website: profile.website ?? "",
    timezone: profile.timezone || fallbackBusiness?.timezone || "America/Bogota",
    operatingDays: normalizeOperatingDays(
      profile.operating_days,
      fallbackBusiness?.operating_days ?? [1, 2, 3, 4, 5, 6],
    ),
  };
}

/**
 * Ficha del negocio: datos públicos, contacto, redes sociales y logo.
 */
export function BusinessProfileForm({
  business,
  embeddedSocialLayout = false,
}: {
  business: Business;
  embeddedSocialLayout?: boolean;
}) {
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

  return (
    <BusinessProfileFields
      business={business}
      profile={profile.data}
      embeddedSocialLayout={embeddedSocialLayout}
    />
  );
}

function BusinessProfileFields({
  business,
  profile,
  embeddedSocialLayout,
}: {
  business: Business;
  profile: BusinessProfile;
  embeddedSocialLayout: boolean;
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
        facebook: parsed.data.facebook,
        tiktok: parsed.data.tiktok,
        twitter: parsed.data.twitter,
        youtube: parsed.data.youtube,
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
    let uploadedUrl: string | null = null;
    try {
      uploadedUrl = await uploadBusinessAssetImage({
        businessId: business.id,
        folder: "logo",
        file,
      });
      await setLogo.mutateAsync({
        businessId: business.id,
        logoUrl: uploadedUrl,
      });
      toast.success("Logo actualizado.");
    } catch (error) {
      if (uploadedUrl) {
        void removeBusinessAssetPath(storagePathFromPublicUrl(uploadedUrl));
      }
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
    <div className="space-y-3.5 animate-fade-in">
      <Card>
        <CardHeader className="pb-2.5">
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="size-4 text-[var(--lp-accent-link)]" aria-hidden="true" />
            Identidad y redes del negocio
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!embeddedSocialLayout && (
            <div className="lp-subpanel flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-none border-2 border-[var(--lp-ink)] bg-card">
                {profile.logo_url ? (
                  <img
                    src={profile.logo_url}
                    alt={`Logo de ${profile.name}`}
                    className="size-full object-cover"
                  />
                ) : (
                  <ImageOff className="size-6 text-muted-foreground" aria-hidden="true" />
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-sm font-semibold">Logo o foto del negocio</p>
                <p className="text-xs text-muted-foreground">
                  JPEG, PNG o WebP. Se reduce a 1200 px y se sube de forma segura.
                </p>
                <div className="flex flex-wrap gap-2 pt-0.5">
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
                  aria-label="Subir logo del negocio"
                  data-testid="logo-input"
                  onChange={(event) => void handleLogo(event)}
                />
              </div>
              {uploading && (
                <Loader2 className="size-5 animate-spin text-muted-foreground" aria-hidden="true" />
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                id="business-name"
                label="Nombre del negocio"
                help="Es el nombre visible para tus clientes en su billetera de monedas y códigos QR."
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
                help="Enlace único con el que se afilian tus clientes. No se puede cambiar para no romper los QR."
              >
                <Input id="business-slug" value={`/join/${profile.slug}`} readOnly disabled />
              </Field>
            </div>

            <Field
              id="business-description"
              label="Descripción"
              help="Cuenta brevemente qué ofrece tu negocio; aparecerá en tu página pública de invitación."
              error={errors.description}
            >
              <Textarea
                id="business-description"
                value={form.description}
                onChange={(event) => update("description", event.target.value)}
                rows={2}
                maxLength={500}
                aria-invalid={Boolean(errors.description)}
              />
            </Field>

            <div className="lp-subpanel space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <CalendarDays className="size-4 text-[var(--lp-accent-link)]" aria-hidden="true" />
                Horario y zona horaria
              </div>

              <Field
                id="business-timezone"
                label="Zona horaria"
                help="Se usa para mostrar las fechas en tu hora local y calcular vencimientos."
                error={errors.timezone}
              >
                <div className="space-y-1.5">
                  <NativeSelect
                    id="business-timezone"
                    value={form.timezone}
                    onChange={(event) => update("timezone", event.target.value)}
                  >
                    {(TIMEZONES.includes(form.timezone)
                      ? TIMEZONES
                      : [form.timezone, ...TIMEZONES]
                    ).map((zone) => (
                      <option key={zone} value={zone}>
                        {zone}
                      </option>
                    ))}
                  </NativeSelect>
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
                            "min-h-11 cursor-pointer rounded-none border-2 px-2.5 py-0.5 font-mono text-xs font-bold transition-colors focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[var(--lp-focus-ring)] md:min-h-8 [@media(pointer:coarse)]:min-h-11",
                            active
                              ? "border-[var(--lp-ink)] bg-[var(--lp-gold)] text-[#16262e] shadow-[var(--lp-shadow-sm)]"
                              : "border-[var(--lp-ink)] bg-card text-muted-foreground hover:bg-[var(--lp-tab-hover-bg)] hover:text-foreground",
                          )}
                        >
                          {zone.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </Field>

              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Label>Días de operación</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {DAY_PRESETS.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => update("operatingDays", [...preset.days])}
                        className="min-h-11 cursor-pointer rounded-none border-2 border-[var(--lp-ink)] bg-card px-2 py-0.5 font-mono text-xs font-semibold text-foreground transition-colors hover:bg-[var(--lp-gold-soft)] hover:text-[#16262e] md:min-h-7 [@media(pointer:coarse)]:min-h-11"
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
                          "min-h-11 cursor-pointer rounded-none border-2 px-2 py-1 font-mono text-xs font-bold uppercase transition-all duration-150 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[var(--lp-focus-ring)] md:min-h-9 [@media(pointer:coarse)]:min-h-11",
                          selected
                            ? "border-[var(--lp-ink)] bg-[var(--lp-gold)] text-[#16262e] shadow-[var(--lp-shadow-sm)]"
                            : "border-[var(--lp-ink)] bg-card text-muted-foreground hover:bg-[var(--lp-tab-hover-bg)] hover:text-foreground",
                        )}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
                {errors.operatingDays && (
                  <p className="text-xs font-medium text-destructive" role="alert">
                    {errors.operatingDays}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <MapPin className="size-4 text-[var(--lp-accent-link)]" aria-hidden="true" />
                Ubicación
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
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
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Phone className="size-4 text-[var(--lp-accent-link)]" aria-hidden="true" />
                Contacto directo
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <Field
                  id="business-whatsapp"
                  label="WhatsApp"
                  help="Con indicativo, por ejemplo +57 300 123 4567."
                  error={errors.phoneWhatsapp}
                >
                  <Input
                    id="business-whatsapp"
                    value={form.phoneWhatsapp}
                    onChange={(event) => update("phoneWhatsapp", event.target.value)}
                    placeholder="+57 300 123 4567"
                    inputMode="tel"
                    autoComplete="tel"
                  />
                </Field>
                <Field id="business-phone" label="Teléfono fijo" error={errors.phone}>
                  <Input
                    id="business-phone"
                    value={form.phone}
                    onChange={(event) => update("phone", event.target.value)}
                    placeholder="601 234 5678"
                    inputMode="tel"
                  />
                </Field>
                <Field
                  id="business-website"
                  label="Sitio web"
                  help="Si no incluyes https://, lo añadimos nosotros."
                  error={errors.website}
                >
                  <div className="relative">
                    <Globe
                      className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <Input
                      id="business-website"
                      className="pl-8"
                      value={form.website}
                      onChange={(event) => update("website", event.target.value)}
                      placeholder="tunegocio.com"
                      inputMode="url"
                      autoCapitalize="none"
                      spellCheck={false}
                    />
                  </div>
                </Field>
              </div>
            </div>

            <div className="lp-subpanel space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Share2 className="size-4 text-[var(--lp-accent-link)]" aria-hidden="true" />
                Redes sociales
              </div>
              <p className="text-xs text-muted-foreground">
                Conecta tus perfiles más populares para que tus clientes te encuentren y compartan
                tus recompensas.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  id="business-instagram"
                  label="Instagram"
                  help="Solo el usuario, con o sin @."
                  error={errors.instagram}
                >
                  <Input
                    id="business-instagram"
                    value={form.instagram}
                    onChange={(event) => update("instagram", event.target.value)}
                    placeholder="@tunegocio"
                    autoCapitalize="none"
                    spellCheck={false}
                  />
                </Field>
                <Field
                  id="business-facebook"
                  label="Facebook"
                  help="Página, usuario o enlace completo."
                  error={errors.facebook}
                >
                  <Input
                    id="business-facebook"
                    value={form.facebook}
                    onChange={(event) => update("facebook", event.target.value)}
                    placeholder="facebook.com/tunegocio"
                    autoCapitalize="none"
                    spellCheck={false}
                  />
                </Field>
                <Field
                  id="business-tiktok"
                  label="TikTok"
                  help="Usuario con @ o enlace al perfil."
                  error={errors.tiktok}
                >
                  <Input
                    id="business-tiktok"
                    value={form.tiktok}
                    onChange={(event) => update("tiktok", event.target.value)}
                    placeholder="@tunegocio"
                    autoCapitalize="none"
                    spellCheck={false}
                  />
                </Field>
                <Field
                  id="business-twitter"
                  label="X (Twitter)"
                  help="Usuario con @ o enlace al perfil."
                  error={errors.twitter}
                >
                  <Input
                    id="business-twitter"
                    value={form.twitter}
                    onChange={(event) => update("twitter", event.target.value)}
                    placeholder="@tunegocio"
                    autoCapitalize="none"
                    spellCheck={false}
                  />
                </Field>
                <Field
                  id="business-youtube"
                  label="YouTube"
                  help="Canal (@tunegocio) o enlace completo."
                  error={errors.youtube}
                  className="sm:col-span-2"
                >
                  <Input
                    id="business-youtube"
                    value={form.youtube}
                    onChange={(event) => update("youtube", event.target.value)}
                    placeholder="@tunegocio o https://youtube.com/@tunegocio"
                    autoCapitalize="none"
                    spellCheck={false}
                  />
                </Field>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-[var(--lp-ink)] pt-3">
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
