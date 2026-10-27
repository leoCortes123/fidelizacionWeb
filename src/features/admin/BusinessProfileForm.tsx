import { useEffect, useRef, useState } from 'react';
import {
  Building2,
  Camera,
  CheckCircle2,
  ImageOff,
  Loader2,
  MapPin,
  Phone,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import {
  useBusinessProfile,
  useSetBusinessLogo,
  useUpdateBusinessProfile,
} from '@/features/loyalty/hooks';
import { errorMessage } from '@/lib/errors';
import { useFormDraft } from '@/lib/useFormDraft';
import { isSupportedImage, prepareImage } from '@/lib/image';
import { supabase } from '@/lib/supabase';
import type { Business, BusinessProfile } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Field } from '@/components/shared/Field';
import { ErrorState, LoadingScreen } from '@/components/shared/States';

const phonePattern = /^\+?[0-9\s().-]{7,20}$/;
const instagramPattern = /^@?[A-Za-z0-9._]{1,30}$/;
const websitePattern = /^(https?:\/\/)?[^\s]+\.[^\s]{2,}$/;

export const businessProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres.')
    .max(120, 'El nombre no puede superar 120 caracteres.'),
  description: z
    .string()
    .trim()
    .max(500, 'La descripción no puede superar 500 caracteres.'),
  address: z.string().trim().max(160, 'La dirección supera 160 caracteres.'),
  neighborhood: z.string().trim().max(160, 'El barrio supera 160 caracteres.'),
  city: z.string().trim().max(160, 'La ciudad supera 160 caracteres.'),
  phoneWhatsapp: z
    .string()
    .trim()
    .refine(
      (value) => value === '' || phonePattern.test(value),
      'Escribe un WhatsApp válido (7 a 15 dígitos).',
    ),
  phone: z
    .string()
    .trim()
    .refine(
      (value) => value === '' || phonePattern.test(value),
      'Escribe un teléfono válido (7 a 15 dígitos).',
    ),
  instagram: z
    .string()
    .trim()
    .refine(
      (value) => value === '' || instagramPattern.test(value),
      'Escribe un usuario de Instagram válido.',
    ),
  website: z
    .string()
    .trim()
    .refine(
      (value) => value === '' || websitePattern.test(value),
      'Escribe una dirección web válida.',
    ),
});

export type BusinessProfileFormState = z.infer<typeof businessProfileSchema>;

function fromProfile(profile: BusinessProfile): BusinessProfileFormState {
  return {
    name: profile.name,
    description: profile.description ?? '',
    address: profile.address ?? '',
    neighborhood: profile.neighborhood ?? '',
    city: profile.city ?? '',
    phoneWhatsapp: profile.phone_whatsapp ?? '',
    phone: profile.phone ?? '',
    instagram: profile.instagram ?? '',
    website: profile.website ?? '',
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
        error={profile.error ?? new Error('No encontramos el negocio.')}
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
  const setLogo = useSetBusinessLogo();
  const draft = useFormDraft<BusinessProfileFormState>({
    key: `admin:business-profile:${business.id}`,
  });
  const fileInput = useRef<HTMLInputElement | null>(null);
  const [form, setForm] = useState<BusinessProfileFormState>(
    () => draft.read() ?? fromProfile(profile),
  );
  const [errors, setErrors] = useState<
    Partial<Record<keyof BusinessProfileFormState, string>>
  >({});
  const [dirty, setDirty] = useState(false);
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
      toast.error(parsed.error.issues[0]?.message ?? 'Revisa los datos del negocio.');
      return;
    }

    try {
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
      setForm(fromProfile(result));
      setDirty(false);
      draft.clear();
      toast.success('Datos del negocio guardados.');
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  async function handleLogo(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!isSupportedImage(file)) {
      toast.error('Usa una imagen JPEG, PNG o WebP.');
      return;
    }

    setUploading(true);
    try {
      const prepared = await prepareImage(file);
      const path = `business/${business.id}/logo-${Date.now()}.${prepared.extension}`;
      const { error } = await supabase.storage
        .from('business-assets')
        .upload(path, prepared.blob, {
          contentType: prepared.contentType,
          cacheControl: '3600',
          upsert: false,
        });
      if (error) throw error;

      const { data } = supabase.storage.from('business-assets').getPublicUrl(path);
      await setLogo.mutateAsync({
        businessId: business.id,
        logoUrl: data.publicUrl,
      });
      toast.success('Logo actualizado.');
    } catch (error) {
      toast.error(
        errorMessage(error) ||
          'No pudimos subir el logo. Revisa el almacenamiento del negocio.',
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleRemoveLogo() {
    setUploading(true);
    try {
      await setLogo.mutateAsync({ businessId: business.id, logoUrl: null });
      toast.success('Logo eliminado.');
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="size-4 text-muted-foreground" aria-hidden="true" />
            Identidad del negocio
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-col gap-4 rounded-xl border bg-muted/20 p-4 sm:flex-row sm:items-center">
            <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-2xl border bg-background">
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
                  {profile.logo_url ? 'Reemplazar logo' : 'Subir logo'}
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
                hint="Es el nombre que ven tus clientes."
                error={errors.name}
                required
              >
                <Input
                  id="business-name"
                  value={form.name}
                  onChange={(event) => update('name', event.target.value)}
                  aria-invalid={Boolean(errors.name)}
                />
              </Field>
              <Field
                id="business-slug"
                label="Enlace público"
                hint="El identificador no se puede cambiar para no romper los QR."
              >
                <Input id="business-slug" value={`/join/${profile.slug}`} readOnly disabled />
              </Field>
            </div>

            <Field
              id="business-description"
              label="Descripción"
              hint="Qué ofrece el negocio, en una o dos frases."
              error={errors.description}
            >
              <Textarea
                id="business-description"
                value={form.description}
                onChange={(event) => update('description', event.target.value)}
                rows={3}
                maxLength={500}
                aria-invalid={Boolean(errors.description)}
              />
            </Field>

            <div className="flex items-center gap-2 text-sm font-semibold">
              <MapPin className="size-4 text-muted-foreground" aria-hidden="true" />
              Ubicación
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="business-address" label="Dirección" error={errors.address}>
                <Input
                  id="business-address"
                  value={form.address}
                  onChange={(event) => update('address', event.target.value)}
                  autoComplete="street-address"
                />
              </Field>
              <Field id="business-neighborhood" label="Barrio" error={errors.neighborhood}>
                <Input
                  id="business-neighborhood"
                  value={form.neighborhood}
                  onChange={(event) => update('neighborhood', event.target.value)}
                />
              </Field>
              <Field id="business-city" label="Ciudad" error={errors.city}>
                <Input
                  id="business-city"
                  value={form.city}
                  onChange={(event) => update('city', event.target.value)}
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
                  onChange={(event) => update('phoneWhatsapp', event.target.value)}
                  inputMode="tel"
                  autoComplete="tel"
                />
              </Field>
              <Field id="business-phone" label="Teléfono fijo" error={errors.phone}>
                <Input
                  id="business-phone"
                  value={form.phone}
                  onChange={(event) => update('phone', event.target.value)}
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
                  onChange={(event) => update('instagram', event.target.value)}
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
                  onChange={(event) => update('website', event.target.value)}
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
              <Button type="submit" loading={updateProfile.isPending} disabled={!dirty}>
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
