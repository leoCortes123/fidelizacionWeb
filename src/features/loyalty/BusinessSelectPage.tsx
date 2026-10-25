import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Plus, Building2 } from 'lucide-react';
import { useBusinesses } from './hooks';
import { businessHomePath } from '@/lib/config';
import { useBusinessContext } from './businessContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState, ErrorState, ListSkeleton } from '@/components/shared/States';

export function BusinessSelectPage() {
  const businesses = useBusinesses();
  const { setSelectedBusiness } = useBusinessContext();
  const navigate = useNavigate();
  const [registering, setRegistering] = useState(false);

  if (businesses.isLoading) return <ListSkeleton rows={3} />;
  if (businesses.isError) {
    return <ErrorState error={businesses.error} onRetry={() => void businesses.refetch()} />;
  }

  const list = businesses.data ?? [];

  if (registering) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Registrar negocio"
          description="Crea tu negocio y conviértete en su administrador."
        />
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Nuevo negocio</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                const form = new FormData(event.currentTarget);
                const name = form.get('name') as string;
                const slug = form.get('slug') as string;
                if (!name || !slug) return;
                // El registro real se hace desde /business/register
                navigate(`/business/register?name=${encodeURIComponent(name)}&slug=${encodeURIComponent(slug)}`);
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="business-name">Nombre del negocio</Label>
                <Input id="business-name" name="name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="business-slug">Slug (URL amigable)</Label>
                <Input id="business-slug" name="slug" placeholder="mi-negocio" required />
                <p className="text-xs text-muted-foreground">
                  Solo letras minúsculas, números y guiones.
                </p>
              </div>
              <Button type="submit" className="w-full">
                <Plus aria-hidden="true" />
                Crear negocio
              </Button>
            </form>
          </CardContent>
        </Card>
        <p className="text-center text-xs text-muted-foreground">
          ¿Ya tienes un negocio?{' '}
          <Button variant="link" onClick={() => setRegistering(false)}>
            Seleccionar uno existente
          </Button>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Selecciona tu negocio"
        description="Elige el negocio con el que deseas trabajar."
      />

      {list.length === 0 ? (
        <EmptyState
          title="Aún no tienes negocios"
          description="Registra tu primer negocio para comenzar a usar el programa de fidelización."
          icon={Building2}
          action={
            <Button variant="outline" onClick={() => setRegistering(true)}>
              <Plus aria-hidden="true" />
              Registrar negocio
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((business) => (
            <Card
              key={business.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => {
                setSelectedBusiness(business);
                navigate(businessHomePath(business.role));
              }}
            >
              <CardContent className="p-6 text-center">
                <Building2 className="mx-auto size-12 text-primary mb-3" aria-hidden="true" />
                <h3 className="font-semibold">{business.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {business.slug} · {business.timezone}
                </p>
                <Button
                  key={business.id}
                  variant="outline"
                  size="sm"
                  className="mt-4 w-full"
                  onClick={(event) => {
                    event.stopPropagation();
                    setSelectedBusiness(business);
                    navigate(businessHomePath(business.role));
                  }}
                >
                  <ArrowRight aria-hidden="true" /> Seleccionar
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="flex justify-center">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setRegistering(true)}
        >
          <Plus aria-hidden="true" />
          Registrar un negocio nuevo
        </Button>
      </div>
    </div>
  );
}
