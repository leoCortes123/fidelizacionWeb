import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Banknote,
  Gift,
  Package,
  Settings2,
  UserRound,
  Wrench,
} from 'lucide-react';
import { BusinessGate } from './BusinessGate';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent } from '@/components/ui/card';

const sections = [
  {
    to: '/admin/program',
    title: 'Programa',
    description: 'Acumulación, valor del loopoint, vencimiento y cliente frecuente.',
    icon: Settings2,
  },
  {
    to: '/admin/products',
    title: 'Carta',
    description: 'Productos, precios, costos y combos.',
    icon: Package,
  },
  {
    to: '/admin/rewards',
    title: 'Recompensas',
    description: 'Catálogo, costos y límites de canje.',
    icon: Gift,
  },
  {
    to: '/admin/economic',
    title: 'Económico',
    description: 'Presupuesto, ventas y datos del negocio.',
    icon: Banknote,
  },
  {
    to: '/admin/members',
    title: 'Equipo',
    description: 'Encargados, clientes y permisos.',
    icon: UserRound,
  },
  {
    to: '/admin/settings',
    title: 'Avanzado',
    description: 'Configuración anterior e historial de cambios.',
    icon: Wrench,
  },
];

/**
 * Loopoint de entrada de Configuración. En la fase 3 estas tarjetas se convierten
 * en pestañas dentro de la misma pantalla; por ahora evitan duplicar el menú
 * lateral y mantienen accesibles las pantallas existentes.
 */
export function ConfigHomePage() {
  return (
    <BusinessGate
      title="Configuración"
      description="Elige el negocio que deseas configurar."
      icon={Settings2}
      emptyDescription="Registra un negocio para configurarlo."
    >
      {(business) => (
        <div className="space-y-5 animate-fade-in">
          <PageHeader
            title="Configuración"
            description={`Ajustes de ${business.name}.`}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <Link key={section.to} to={section.to} className="group">
                  <Card className="h-full transition-colors group-hover:border-primary/50 group-hover:bg-muted/40">
                    <CardContent className="flex items-start gap-3 p-4">
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-secondary text-secondary-foreground">
                        <Icon className="size-5" aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="font-semibold">{section.title}</span>
                          <ArrowRight
                            className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                            aria-hidden="true"
                          />
                        </span>
                        <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                          {section.description}
                        </span>
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </BusinessGate>
  );
}
