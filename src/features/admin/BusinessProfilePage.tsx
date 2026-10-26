import { Building2 } from 'lucide-react';
import { BusinessGate } from './BusinessGate';
import { BusinessProfileForm } from './BusinessProfileForm';
import { PageHeader } from '@/components/shared/PageHeader';

/**
 * Configuración del negocio (Fase 2). En la Fase 3 pasa a ser la pestaña
 * “Negocio” de Configuración; la ruta se conserva como acceso directo.
 */
export function BusinessProfilePage() {
  return (
    <BusinessGate
      title="Negocio"
      description="Elige el negocio cuyos datos deseas editar."
      icon={Building2}
      emptyDescription="Registra un negocio para completar su ficha."
    >
      {(business) => (
        <div className="space-y-5 animate-fade-in">
          <PageHeader
            title="Negocio"
            description={`Ficha pública y datos de contacto de ${business.name}.`}
          />
          <BusinessProfileForm business={business} />
        </div>
      )}
    </BusinessGate>
  );
}
