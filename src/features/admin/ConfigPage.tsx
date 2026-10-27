import { Link, useSearchParams } from 'react-router-dom';
import {
  Banknote,
  Building2,
  Gift,
  Package,
  Settings2,
  Sparkles,
  UserRound,
  Wrench,
} from 'lucide-react';
import { BusinessGate } from './BusinessGate';
import { BusinessProfileForm } from './BusinessProfileForm';
import { ProgramPage } from './ProgramPage';
import { ProductsPage } from './ProductsPage';
import { RewardsPage } from './RewardsPage';
import { EconomicPage } from './EconomicPage';
import { MembersPage } from './MembersPage';
import { SettingsPage } from './SettingsPage';
import { OnboardingWizardPage } from '@/features/loyalty/OnboardingWizardPage';
import { useAuth } from '@/features/auth/AuthProvider';
import { PageHeader } from '@/components/shared/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const tabs = [
  { value: 'negocio', label: 'Negocio', icon: Building2 },
  { value: 'programa', label: 'Programa', icon: Settings2 },
  { value: 'carta', label: 'Carta', icon: Package },
  { value: 'recompensas', label: 'Recompensas', icon: Gift },
  { value: 'economico', label: 'Económico', icon: Banknote },
  { value: 'equipo', label: 'Equipo', icon: UserRound },
  { value: 'avanzado', label: 'Avanzado', icon: Wrench },
] as const;

type ConfigTab = (typeof tabs)[number]['value'];

const validTabs = new Set<string>(tabs.map((tab) => tab.value));

/**
 * Configuración unificada (Fase 3). Cada pestaña reutiliza la pantalla ya
 * existente, así la ruta antigua sigue funcionando por redirección y no hay
 * dos implementaciones de la misma configuración.
 */
export function ConfigPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const onboarding = searchParams.get('onboarding') === '1';
  const rawTab = searchParams.get('tab') ?? 'negocio';
  const tab: ConfigTab = validTabs.has(rawTab) ? (rawTab as ConfigTab) : 'negocio';
  const { roles } = useAuth();
  const showAdvanced = roles.includes('admin');

  function changeTab(value: string) {
    const next = new URLSearchParams(searchParams);
    next.set('tab', value);
    next.delete('onboarding');
    setSearchParams(next, { replace: true });
  }

  return (
    <BusinessGate
      title="Configuración"
      description="Elige el negocio que deseas configurar."
      icon={Settings2}
      emptyDescription="Registra un negocio para configurarlo."
    >
      {(business) => (
        <div className="space-y-4 animate-fade-in">
          <PageHeader
            title="Configuración"
            description={`Ajustes de ${business.name}. Todo se guarda en este mismo lugar.`}
            actions={
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="hidden sm:inline-flex">
                  <Sparkles aria-hidden="true" />
                  Negocio
                </Badge>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/admin/config?onboarding=1">
                    <Sparkles aria-hidden="true" />
                    Asistente
                  </Link>
                </Button>
              </div>
            }
          />

          {onboarding ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-muted/40 px-4 py-3 text-sm">
                <p>
                  <strong>Asistente de configuración.</strong> Completa los pasos y
                  vuelve cuando quieras a la configuración por pestañas.
                </p>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/admin/config?tab=negocio">Salir del asistente</Link>
                </Button>
              </div>
              <OnboardingWizardPage />
            </div>
          ) : (
            <Tabs value={tab} onValueChange={changeTab}>
              <TabsList aria-label="Secciones de configuración">
                {tabs
                  .filter((item) => item.value !== 'avanzado' || showAdvanced)
                  .map((item) => {
                    const Icon = item.icon;
                    return (
                      <TabsTrigger key={item.value} value={item.value}>
                        <Icon className="mr-1.5 size-4" aria-hidden="true" />
                        {item.label}
                      </TabsTrigger>
                    );
                  })}
              </TabsList>

              <TabsContent value="negocio" className="mt-4">
                <div className="space-y-4">
                  <PageHeader
                    title="Negocio"
                    description="Ficha pública, contacto, redes y logo."
                    className="hidden sm:flex"
                  />
                  <BusinessProfileForm business={business} />
                </div>
              </TabsContent>
              <TabsContent value="programa">
                <ProgramPage />
              </TabsContent>
              <TabsContent value="carta">
                <ProductsPage />
              </TabsContent>
              <TabsContent value="recompensas">
                <RewardsPage />
              </TabsContent>
              <TabsContent value="economico">
                <EconomicPage />
              </TabsContent>
              <TabsContent value="equipo">
                <MembersPage />
              </TabsContent>
              {showAdvanced && (
                <TabsContent value="avanzado">
                  <SettingsPage />
                </TabsContent>
              )}
            </Tabs>
          )}
        </div>
      )}
    </BusinessGate>
  );
}
