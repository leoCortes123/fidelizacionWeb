import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Building2, Plus } from "lucide-react";
import { useBusinesses } from "./hooks";
import { businessHomePath } from "@/lib/config";
import { useBusinessContext } from "./businessContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import { SignOutButton } from "@/components/shared/SignOutButton";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/shared/States";

export function BusinessSelectPage() {
  const businesses = useBusinesses();
  const { setSelectedBusiness } = useBusinessContext();
  const navigate = useNavigate();

  if (businesses.isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-0 py-4 sm:px-6 sm:py-8">
        <ListSkeleton rows={3} />
      </div>
    );
  }
  if (businesses.isError) {
    return (
      <div className="mx-auto max-w-4xl px-0 py-4 sm:px-6 sm:py-8">
        <ErrorState error={businesses.error} onRetry={() => void businesses.refetch()} />
      </div>
    );
  }

  const list = businesses.data ?? [];

  return (
    <div className="mx-auto max-w-4xl space-y-4 px-0 py-4 sm:space-y-5 sm:px-6 sm:py-8 animate-fade-in">
      <PageHeader
        title="Selecciona tu negocio"
        description="Elige el negocio con el que deseas trabajar o registra uno nuevo."
        actions={<SignOutButton variant="outline" size="sm" />}
      />

      {list.length === 0 ? (
        <EmptyState
          title="Aún no tienes negocios"
          description="Registra tu primer negocio para comenzar a configurar tu programa de fidelización."
          icon={Building2}
          action={
            <Button variant="outline" asChild>
              <Link to="/admin/onboarding?new=1">
                <Plus aria-hidden="true" />
                Registrar negocio
              </Link>
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
                navigate(businessHomePath(business.role, business.id));
              }}
            >
              <CardContent className="p-4 text-center sm:p-6">
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
                    navigate(businessHomePath(business.role, business.id));
                  }}
                >
                  <ArrowRight aria-hidden="true" /> Seleccionar
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="flex justify-center px-4 sm:px-0">
        <Button variant="outline" size="sm" asChild>
          <Link to="/admin/onboarding?new=1">
            <Plus aria-hidden="true" />
            Registrar un negocio nuevo
          </Link>
        </Button>
      </div>
    </div>
  );
}
