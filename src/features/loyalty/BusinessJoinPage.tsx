import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowRight,
  Building2,
  CalendarDays,
  Clock,
  Gift,
  Globe,
  Instagram,
  MapPin,
  Phone,
} from 'lucide-react';
import { toast } from 'sonner';
import { Brand } from '@/components/shared/Brand';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ErrorState, LoadingScreen } from '@/components/shared/States';
import { useAuth } from '@/features/auth/AuthProvider';
import { useBusinessPublic, useJoinBusiness } from './hooks';
import { persistBusinessSelection } from './businessContext';
import { businessHomePath } from '@/lib/config';
import { errorMessage } from '@/lib/errors';

const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function operatingDaysLabel(days: number[] | null | undefined): string {
  if (!days || days.length === 0) return 'Horario no publicado';
  if (days.length === 7) return 'Todos los días';
  return days
    .slice()
    .sort((a, b) => a - b)
    .map((day) => dayNames[day] ?? day)
    .join(' · ');
}

export function BusinessJoinPage() {
  const { slug = '' } = useParams();
  const navigate = useNavigate();
  const { session, user } = useAuth();
  const business = useBusinessPublic(slug);
  const joinBusiness = useJoinBusiness();
  const [joining, setJoining] = useState(false);

  const loginHref = `/login?next=${encodeURIComponent(`/join/${slug}`)}`;

  async function handleJoin() {
    if (!session) {
      navigate(loginHref);
      return;
    }
    setJoining(true);
    try {
      const result = await joinBusiness.mutateAsync({ slug });
      persistBusinessSelection(user?.id, result.business_id);
      toast.success(
        result.already_member
          ? `Ya participabas en ${result.business_name}.`
          : `¡Bienvenido a ${result.business_name}!`,
      );
      navigate(businessHomePath(result.role), { replace: true });
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setJoining(false);
    }
  }

  if (business.isLoading) {
    return (
      <div className="hero-glow grid min-h-screen place-items-center px-4">
        <div className="space-y-6 text-center">
          <Brand />
          <LoadingScreen label="Cargando negocio…" />
        </div>
      </div>
    );
  }

  if (business.isError) {
    return (
      <div className="hero-glow grid min-h-screen place-items-center px-4">
        <div className="w-full max-w-md space-y-4">
          <div className="flex justify-center">
            <Brand />
          </div>
          <ErrorState
            error={business.error}
            onRetry={() => void business.refetch()}
          />
          <Button variant="outline" className="w-full" asChild>
            <Link to="/">Volver al inicio</Link>
          </Button>
        </div>
      </div>
    );
  }

  const data = business.data;
  if (!data) {
    return (
      <div className="hero-glow grid min-h-screen place-items-center px-4">
        <div className="w-full max-w-md space-y-4 text-center">
          <Brand />
          <Card>
            <CardContent className="space-y-3 p-8">
              <span className="mx-auto grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
                <MapPin className="size-5" aria-hidden="true" />
              </span>
              <h1 className="font-display text-xl font-extrabold">
                No encontramos este negocio
              </h1>
              <p className="text-sm text-muted-foreground">
                El enlace puede haber cambiado o el negocio ya no está disponible.
                Pide al local un enlace de invitación actualizado.
              </p>
              <Button variant="outline" asChild className="w-full">
                <Link to="/">Volver al inicio</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="hero-glow min-h-screen px-4 py-10">
      <div className="mx-auto w-full max-w-lg space-y-5">
        <div className="flex justify-center">
          <Brand />
        </div>

        <Card className="overflow-hidden shadow-lg">
          <div className="bg-foreground px-6 py-8 text-background">
            {data.logo_url ? (
              <img
                src={data.logo_url}
                alt={`Logo de ${data.name}`}
                className="size-14 rounded-2xl border border-background/20 object-cover"
              />
            ) : (
              <span className="grid size-12 place-items-center rounded-2xl bg-background/10">
                <Building2 className="size-6" aria-hidden="true" />
              </span>
            )}
            <h1 className="mt-4 font-display text-3xl font-extrabold leading-tight">
              {data.name}
            </h1>
            <p className="mt-1 text-sm text-background/70">@{data.slug}</p>
            {data.description && (
              <p className="mt-3 max-w-md text-sm leading-relaxed text-background/80">
                {data.description}
              </p>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant={data.loyalty_active ? 'success' : 'warning'}>
                {data.loyalty_active
                  ? 'Programa de loopoints activo'
                  : 'Programa en preparación'}
              </Badge>
            </div>
          </div>

          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Gift className="size-4 text-muted-foreground" aria-hidden="true" />
              Únete y empieza a sumar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Afíliate con tu cuenta para acumular loopoints en tus compras y canjear
              recompensas. No necesitas tarjeta física.
            </p>

            <div className="space-y-2 rounded-lg border bg-muted/30 p-3 text-sm">
              {(data.address || data.neighborhood || data.city) && (
                <p className="flex items-start gap-2">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <span>
                    {[data.address, data.neighborhood, data.city]
                      .filter(Boolean)
                      .join(', ')}
                  </span>
                </p>
              )}
              <p className="flex items-center gap-2">
                <Clock className="size-4 text-muted-foreground" aria-hidden="true" />
                Zona horaria: {data.timezone}
              </p>
              <p className="flex items-center gap-2">
                <CalendarDays className="size-4 text-muted-foreground" aria-hidden="true" />
                {operatingDaysLabel(data.operating_days)}
              </p>
              {data.phone_whatsapp && (
                <p className="flex items-center gap-2">
                  <Phone className="size-4 text-muted-foreground" aria-hidden="true" />
                  <a
                    className="font-semibold underline-offset-4 hover:underline"
                    href={`https://wa.me/${data.phone_whatsapp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    WhatsApp {data.phone_whatsapp}
                  </a>
                </p>
              )}
              {data.instagram && (
                <p className="flex items-center gap-2">
                  <Instagram className="size-4 text-muted-foreground" aria-hidden="true" />
                  <a
                    className="font-semibold underline-offset-4 hover:underline"
                    href={`https://instagram.com/${data.instagram}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    @{data.instagram}
                  </a>
                </p>
              )}
              {data.website && (
                <p className="flex items-center gap-2">
                  <Globe className="size-4 text-muted-foreground" aria-hidden="true" />
                  <a
                    className="font-semibold underline-offset-4 hover:underline"
                    href={data.website}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {data.website.replace(/^https?:\/\//, '')}
                  </a>
                </p>
              )}
            </div>

            {!data.loyalty_active && (
              <Alert variant="warning">
                <AlertTitle>El programa aún no está activo</AlertTitle>
                <AlertDescription>
                  Puedes afiliarte desde ya. Cuando el negocio active su programa,
                  tus compras empezarán a sumar loopoints automáticamente.
                </AlertDescription>
              </Alert>
            )}

            {session ? (
              <Button
                className="w-full"
                size="lg"
                onClick={() => void handleJoin()}
                loading={joining}
              >
                Unirme a {data.name}
                <ArrowRight aria-hidden="true" />
              </Button>
            ) : (
              <Button className="w-full" size="lg" asChild>
                <Link to={loginHref}>
                  Entrar y unirme
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
            )}

            <p className="text-center text-xs text-muted-foreground">
              Al unirte aceptas que el negocio asocie tu nombre y correo a tu cuenta
              de loopoints. No compartimos datos con otros negocios.
            </p>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          ¿Ya tienes loopoints?{' '}
          <Link to="/login" className="font-semibold text-primary underline-offset-4 hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
