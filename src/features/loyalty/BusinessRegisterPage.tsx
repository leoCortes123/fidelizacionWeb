import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Building2, CheckCircle } from 'lucide-react';
import { useRegisterBusiness } from './hooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/shared/PageHeader';
import { LoadingScreen } from '@/components/shared/States';

export function BusinessRegisterPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const registerBusiness = useRegisterBusiness();
  const [name, setName] = useState(searchParams.get('name') ?? '');
  const [slug, setSlug] = useState(searchParams.get('slug') ?? '');
  const [timezone, setTimezone] = useState('America/Bogota');

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim() || !slug.trim()) return;
    try {
      await registerBusiness.mutateAsync({ name: name.trim(), slug: slug.trim(), timezone });
      navigate('/business/select');
    } catch {
      // El error se muestra mediante el mutation error
    }
  }

  if (registerBusiness.isPending) return <LoadingScreen label="Creando negocio…" />;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Registrar negocio"
        description="Crea tu negocio y conviértete en su administrador."
      />

      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="size-4" aria-hidden="true" />
            Nuevo negocio
          </CardTitle>
        </CardHeader>
        <CardContent>
          {registerBusiness.isError && (
            <div role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive mb-4">
              {registerBusiness.error?.message ?? 'No se pudo crear el negocio.'}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del negocio</Label>
              <Input
                id="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                maxLength={120}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug (identificador en URL)</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(event) => setSlug(event.target.value)}
                placeholder="mi-negocio"
                required
                maxLength={80}
              />
              <p className="text-xs text-muted-foreground">
                Solo letras minúsculas, números y guiones. Único por negocio.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Zona horaria</Label>
              <Input
                id="timezone"
                value={timezone}
                onChange={(event) => setTimezone(event.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Usada para mostrar fechas y calcular vencimientos.
              </p>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" asChild>
                <Link to="/business/select">
                  <ArrowLeft aria-hidden="true" />
                  Volver
                </Link>
              </Button>
              <Button type="submit" loading={registerBusiness.isPending}>
                <CheckCircle aria-hidden="true" />
                Crear negocio
              </Button>
            </div>
          </form>
          <p className="text-xs text-muted-foreground mt-4">
            Al crear el negocio, tu cuenta quedará como su{' '}
            <strong>administrador</strong> y podrás configurar el programa de
            loopoints, crear encargados y gestionar recompensas.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
