import type { LucideIcon } from 'lucide-react';
import { useBusinesses } from '@/features/loyalty/hooks';
import { useBusinessContext } from '@/features/loyalty/businessContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState, ErrorState, ListSkeleton } from '@/components/shared/States';
import type { Business } from '@/types';

/**
 * Resuelve el negocio activo para las pantallas administrativas nuevas.
 * Con un solo negocio entra directo; con varios pide elegir y recuerda la
 * selección mediante `BusinessProvider`.
 */
export function BusinessGate({
  title,
  description,
  icon,
  emptyDescription,
  children,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  emptyDescription: string;
  children: (business: Business) => React.ReactNode;
}) {
  const businesses = useBusinesses();
  const { selectedBusiness, setSelectedBusiness } = useBusinessContext();

  if (businesses.isLoading) return <ListSkeleton rows={3} />;
  if (businesses.isError) {
    return <ErrorState error={businesses.error} onRetry={() => void businesses.refetch()} />;
  }

  const list = businesses.data ?? [];

  if (list.length > 1 && !selectedBusiness) {
    const Icon = icon;
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader title="Selecciona un negocio" description={description} />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((business) => (
            <Card key={business.id} className="cursor-pointer transition-shadow hover:shadow-md">
              <CardContent className="p-6 text-center">
                <Icon className="mx-auto mb-3 size-12 text-primary" aria-hidden="true" />
                <h3 className="font-semibold">{business.name}</h3>
                <p className="text-xs text-muted-foreground">{business.slug}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 w-full"
                  onClick={() => setSelectedBusiness(business)}
                >
                  Seleccionar
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const current = selectedBusiness ?? list[0];
  if (!current) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader title={title} description={description} />
        <EmptyState title="Sin negocios" description={emptyDescription} icon={icon} />
      </div>
    );
  }

  return <>{children(current)}</>;
}
