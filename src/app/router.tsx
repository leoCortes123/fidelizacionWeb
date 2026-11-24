import { lazy, Suspense, useEffect, useState } from "react";
import { Link, Navigate, Route, Routes, useSearchParams } from "react-router-dom";
import { CustomerShell } from "@/components/layout/CustomerShell";
import { AdminShell } from "@/components/layout/AdminShell";
import { EncargadoShell } from "@/components/layout/EncargadoShell";
import {
  RequireAdmin,
  RequireAuth,
  RequireBusinessRole,
  RolesErrorScreen,
} from "@/components/layout/RequireAuth";
import { Brand } from "@/components/shared/Brand";
import { SignOutButton } from "@/components/shared/SignOutButton";
import { ErrorState, FullPageLoader } from "@/components/shared/States";
import { Button } from "@/components/ui/button";
import { ThemeToggleButton } from "@/components/theme/ThemeToggleButton";
import { RootRedirect } from "@/features/auth/RootRedirect";
import { BusinessProvider, useBusinessContext } from "@/features/loyalty/businessContext";
import { businessHomePath } from "@/lib/config";
import { useAuth } from "@/features/auth/AuthProvider";
import { useBusinesses } from "@/features/loyalty/hooks";

function BusinessLayout({ children }: { children: React.ReactNode }) {
  const businesses = useBusinesses();
  const { user } = useAuth();
  if (businesses.isLoading) return <FullPageLoader label="Cargando negocios…" />;
  if (businesses.isError) {
    return (
      <div className="mx-auto max-w-md px-4 py-12">
        <ErrorState
          title="No pudimos cargar tus negocios"
          error={businesses.error}
          onRetry={() => void businesses.refetch()}
        />
      </div>
    );
  }
  return (
    <BusinessProvider key={user?.id ?? "anon"} userId={user?.id} businesses={businesses.data ?? []}>
      {children}
    </BusinessProvider>
  );
}

function BusinessRegisterRedirect() {
  const [searchParams] = useSearchParams();
  const nextParams = new URLSearchParams(searchParams);
  nextParams.set("new", "1");
  return <Navigate to={`/admin/onboarding?${nextParams.toString()}`} replace />;
}

function OnboardingRoute() {
  const { roles, rolesLoading, rolesLoaded, rolesError, refreshRoles } = useAuth();
  const { businesses, selectedBusiness } = useBusinessContext();
  const [searchParams] = useSearchParams();
  const isNewQuery = searchParams.get("new") === "1";
  const canEnter = isNewQuery || roles.includes("admin");
  const [accessGranted, setAccessGranted] = useState(
    () => !rolesLoading && rolesLoaded && !rolesError && canEnter,
  );
  const adminBusinesses = businesses.filter((business) => business.role === "admin");
  const [startedAsNew] = useState(() => isNewQuery || adminBusinesses.length === 0);

  useEffect(() => {
    if (!rolesLoading && rolesLoaded && !rolesError && canEnter) {
      setAccessGranted(true);
    }
  }, [rolesLoading, rolesLoaded, rolesError, canEnter]);

  if (!accessGranted) {
    if (rolesLoading || !rolesLoaded) {
      return <FullPageLoader label="Verificando permisos…" />;
    }
    if (rolesError && !isNewQuery) {
      return <RolesErrorScreen error={rolesError} onRetry={() => void refreshRoles()} />;
    }
    if (!canEnter) {
      const fallback = roles.includes("registrar") ? "/encargado" : "/unauthorized";
      return <Navigate to={fallback} replace />;
    }
  }

  if (startedAsNew) {
    return (
      <div className="min-h-dvh text-foreground">
        <header className="sticky top-0 z-20 border-b-[3px] border-[var(--lp-ink)] bg-[var(--lp-header-bg)] backdrop-blur-[6px]">
          <div className="mx-auto flex h-12 max-w-[var(--lp-shell-max-w)] items-center justify-between gap-3 px-4 sm:px-5">
            <Brand compact className="sm:hidden" linkTo="/" />
            <Brand compact className="hidden sm:flex" linkTo="/" />
            <div className="flex shrink-0 items-center gap-2">
              {businesses.length > 0 && (
                <Button variant="outline" size="sm" asChild>
                  <Link to="/business/select">Mis negocios</Link>
                </Button>
              )}
              <ThemeToggleButton variant="shell" />
              <SignOutButton variant="outline" size="sm" />
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[var(--lp-shell-max-w)] px-0 py-3 sm:px-5 md:py-4">
          <OnboardingWizardPage newBusinessMode />
        </main>
      </div>
    );
  }

  if (selectedBusiness && selectedBusiness.role !== "admin") {
    return <Navigate to={businessHomePath(selectedBusiness.role, selectedBusiness.id)} replace />;
  }

  return (
    <AdminShell>
      <OnboardingWizardPage />
    </AdminShell>
  );
}
const LoginPage = lazy(() =>
  import("@/features/auth/LoginPage").then((module) => ({
    default: module.LoginPage,
  })),
);
const AuthCallbackPage = lazy(() =>
  import("@/features/auth/AuthCallbackPage").then((module) => ({
    default: module.AuthCallbackPage,
  })),
);
const UnauthorizedPage = lazy(() =>
  import("@/features/auth/StatusPages").then((module) => ({
    default: module.UnauthorizedPage,
  })),
);
const NotFoundPage = lazy(() =>
  import("@/features/auth/StatusPages").then((module) => ({
    default: module.NotFoundPage,
  })),
);
const CustomerBusinessesPage = lazy(() =>
  import("@/features/customer/CustomerBusinessesPage").then((module) => ({
    default: module.CustomerBusinessesPage,
  })),
);
const CustomerBusinessHomePage = lazy(() =>
  import("@/features/customer/CustomerBusinessHomePage").then((module) => ({
    default: module.CustomerBusinessHomePage,
  })),
);
const CustomerPurchasesPage = lazy(() =>
  import("@/features/customer/PurchasesPage").then((module) => ({
    default: module.PurchasesPage,
  })),
);
const CustomerRedemptionsPage = lazy(() =>
  import("@/features/customer/RedemptionsPage").then((module) => ({
    default: module.RedemptionsPage,
  })),
);
const ClaimPage = lazy(() =>
  import("@/features/purchases/ClaimPage").then((module) => ({
    default: module.ClaimPage,
  })),
);
const AdminPurchasesPage = lazy(() =>
  import("@/features/admin/PurchasesPage").then((module) => ({
    default: module.PurchasesPage,
  })),
);
const AdminCustomersPage = lazy(() =>
  import("@/features/admin/CustomersPage").then((module) => ({
    default: module.CustomersPage,
  })),
);
const AdminCustomerDetailPage = lazy(() =>
  import("@/features/admin/CustomerDetailPage").then((module) => ({
    default: module.CustomerDetailPage,
  })),
);
const BusinessSelectPage = lazy(() =>
  import("@/features/loyalty/BusinessSelectPage").then((module) => ({
    default: module.BusinessSelectPage,
  })),
);
const BusinessJoinPage = lazy(() =>
  import("@/features/loyalty/BusinessJoinPage").then((module) => ({
    default: module.BusinessJoinPage,
  })),
);
const BusinessDashboardPage = lazy(() =>
  import("@/features/admin/BusinessDashboardPage").then((module) => ({
    default: module.BusinessDashboardPage,
  })),
);
const ConfigPage = lazy(() =>
  import("@/features/admin/ConfigPage").then((module) => ({
    default: module.ConfigPage,
  })),
);
const ProductsPage = lazy(() =>
  import("@/features/admin/ProductsPage").then((module) => ({
    default: module.ProductsPage,
  })),
);
const RewardsPage = lazy(() =>
  import("@/features/admin/RewardsPage").then((module) => ({
    default: module.RewardsPage,
  })),
);
const MembersPage = lazy(() =>
  import("@/features/admin/MembersPage").then((module) => ({
    default: module.MembersPage,
  })),
);
const OnboardingWizardPage = lazy(() =>
  import("@/features/loyalty/OnboardingWizardPage").then((module) => ({
    default: module.OnboardingWizardPage,
  })),
);
const ProfilePage = lazy(() =>
  import("@/features/profile/ProfilePage").then((module) => ({
    default: module.ProfilePage,
  })),
);
const PurchaseRegistrationPage = lazy(() =>
  import("@/features/admin/PurchaseRegistrationPage").then((module) => ({
    default: module.PurchaseRegistrationPage,
  })),
);
const AuditPage = lazy(() =>
  import("@/features/admin/AuditPage").then((module) => ({
    default: module.AuditPage,
  })),
);
const CampaignsPage = lazy(() =>
  import("@/features/admin/CampaignsPage").then((module) => ({
    default: module.CampaignsPage,
  })),
);
const AdminRedemptionsPage = lazy(() =>
  import("@/features/admin/RedemptionsPage").then((module) => ({
    default: module.RedemptionsPage,
  })),
);
const EncargadoDashboardPage = lazy(() =>
  import("@/features/loyalty/EncargadoDashboardPage").then((module) => ({
    default: module.EncargadoDashboardPage,
  })),
);
const EncargadoRedemptionsPage = lazy(() =>
  import("@/features/loyalty/EncargadoRedemptionsPage").then((module) => ({
    default: module.EncargadoRedemptionsPage,
  })),
);
const ScanRedemptionPage = lazy(() =>
  import("@/features/loyalty/ScanRedemptionPage").then((module) => ({
    default: module.ScanRedemptionPage,
  })),
);

export function AppRoutes() {
  return (
    <Suspense fallback={<FullPageLoader label="Cargando la página…" />}>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/claim/:token" element={<ClaimPage />} />
        <Route path="/join/:slug" element={<BusinessJoinPage />} />
        <Route
          path="/scan/:token"
          element={
            <RequireAuth>
              <ScanRedemptionPage />
            </RequireAuth>
          }
        />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route
          path="/perfil"
          element={
            <RequireAuth>
              <BusinessLayout>
                <ProfilePage />
              </BusinessLayout>
            </RequireAuth>
          }
        />

        {/* Selección y registro de negocio (multiempresa) */}
        <Route
          path="/business/select"
          element={
            <RequireAuth>
              <BusinessLayout>
                <BusinessSelectPage />
              </BusinessLayout>
            </RequireAuth>
          }
        />
        <Route
          path="/business/register"
          element={
            <RequireAuth>
              <BusinessRegisterRedirect />
            </RequireAuth>
          }
        />
        <Route
          path="/admin/onboarding"
          element={
            <RequireAuth>
              <BusinessLayout>
                <OnboardingRoute />
              </BusinessLayout>
            </RequireAuth>
          }
        />

        <Route
          path="/encargado"
          element={
            <RequireAuth>
              <BusinessLayout>
                <RequireBusinessRole roles={["admin", "encargado"]}>
                  <EncargadoShell />
                </RequireBusinessRole>
              </BusinessLayout>
            </RequireAuth>
          }
        >
          <Route index element={<EncargadoDashboardPage />} />
          <Route path="venta" element={<PurchaseRegistrationPage />} />
          <Route path="solicitudes" element={<EncargadoRedemptionsPage />} />
        </Route>

        <Route
          path="/customer"
          element={
            <RequireAuth>
              <BusinessLayout>
                <CustomerShell />
              </BusinessLayout>
            </RequireAuth>
          }
        >
          <Route index element={<CustomerBusinessesPage />} />
          <Route path="business/:businessId" element={<CustomerBusinessHomePage />} />
          <Route path="balance" element={<Navigate to="/customer" replace />} />
          <Route path="purchases" element={<CustomerPurchasesPage />} />
          <Route path="compras" element={<Navigate to="/customer/purchases" replace />} />
          <Route path="redemptions" element={<CustomerRedemptionsPage />} />
          <Route path="canjes" element={<Navigate to="/customer/redemptions" replace />} />
          <Route path="perfil" element={<ProfilePage />} />
        </Route>

        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <BusinessLayout>
                <RequireBusinessRole roles={["admin"]}>
                  <AdminShell />
                </RequireBusinessRole>
              </BusinessLayout>
            </RequireAdmin>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<BusinessDashboardPage />} />
          <Route path="perfil" element={<ProfilePage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="rewards" element={<RewardsPage />} />
          <Route path="members" element={<MembersPage />} />
          <Route path="redemptions" element={<AdminRedemptionsPage />} />
          <Route path="customers" element={<AdminCustomersPage />} />
          <Route path="customers/:id" element={<AdminCustomerDetailPage />} />
          <Route path="purchases" element={<AdminPurchasesPage />} />
          <Route path="purchases/new" element={<PurchaseRegistrationPage />} />
          <Route path="audit" element={<AuditPage />} />
          <Route path="campaigns" element={<CampaignsPage />} />
          {/* Redirecciones a Perfil y páginas directas */}
          <Route path="config" element={<ConfigPage />} />
          <Route path="business" element={<Navigate to="/admin/perfil?tab=negocio" replace />} />
          <Route path="program" element={<Navigate to="/admin/perfil?tab=programa" replace />} />
          <Route path="economic" element={<Navigate to="/admin/perfil?tab=economico" replace />} />
          <Route path="settings" element={<Navigate to="/admin/perfil" replace />} />
        </Route>

        {/* Rutas heredadas */}
        <Route path="/registrar/*" element={<Navigate to="/admin" replace />} />
        <Route path="/customer/rewards" element={<Navigate to="/customer" replace />} />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
