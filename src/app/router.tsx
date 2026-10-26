import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { CustomerShell } from '@/components/layout/CustomerShell';
import { AdminShell } from '@/components/layout/AdminShell';
import {
  RequireAdmin,
  RequireAuth,
  RequireBusinessRole,
} from '@/components/layout/RequireAuth';
import { FullPageLoader } from '@/components/shared/States';
import { BusinessProvider } from '@/features/loyalty/businessContext';
import { RootRedirect } from '@/features/auth/RootRedirect';
import { useAuth } from '@/features/auth/AuthProvider';
import { useBusinesses } from '@/features/loyalty/hooks';

function BusinessLayout({ children }: { children: React.ReactNode }) {
  const businesses = useBusinesses();
  const { user } = useAuth();
  if (businesses.isLoading) return <FullPageLoader label="Cargando negocios…" />;
  if (businesses.isError) return null;
  return (
    <BusinessProvider
      key={user?.id ?? 'anon'}
      userId={user?.id}
      businesses={businesses.data ?? []}
    >
      {children}
    </BusinessProvider>
  );
}

// Las páginas se cargan bajo demanda para reducir el bundle inicial.
const LoginPage = lazy(() =>
  import('@/features/auth/LoginPage').then((module) => ({
    default: module.LoginPage,
  })),
);
const AuthCallbackPage = lazy(() =>
  import('@/features/auth/AuthCallbackPage').then((module) => ({
    default: module.AuthCallbackPage,
  })),
);
const UnauthorizedPage = lazy(() =>
  import('@/features/auth/StatusPages').then((module) => ({
    default: module.UnauthorizedPage,
  })),
);
const NotFoundPage = lazy(() =>
  import('@/features/auth/StatusPages').then((module) => ({
    default: module.NotFoundPage,
  })),
);
const DashboardPage = lazy(() =>
  import('@/features/customer/DashboardPage').then((module) => ({
    default: module.DashboardPage,
  })),
);
const CustomerPurchasesPage = lazy(() =>
  import('@/features/customer/PurchasesPage').then((module) => ({
    default: module.PurchasesPage,
  })),
);
const CustomerRedemptionsPage = lazy(() =>
  import('@/features/customer/RedemptionsPage').then((module) => ({
    default: module.RedemptionsPage,
  })),
);
const CustomerBusinessBalancePage = lazy(() =>
  import('@/features/customer/BusinessBalancePage').then((module) => ({
    default: module.BusinessBalancePage,
  })),
);
const ClaimPage = lazy(() =>
  import('@/features/purchases/ClaimPage').then((module) => ({
    default: module.ClaimPage,
  })),
);
const AdminPurchasesPage = lazy(() =>
  import('@/features/admin/PurchasesPage').then((module) => ({
    default: module.PurchasesPage,
  })),
);
const AdminCustomersPage = lazy(() =>
  import('@/features/admin/CustomersPage').then((module) => ({
    default: module.CustomersPage,
  })),
);
const AdminCustomerDetailPage = lazy(() =>
  import('@/features/admin/CustomerDetailPage').then((module) => ({
    default: module.CustomerDetailPage,
  })),
);
const BusinessSelectPage = lazy(() =>
  import('@/features/loyalty/BusinessSelectPage').then((module) => ({
    default: module.BusinessSelectPage,
  })),
);
const BusinessRegisterPage = lazy(() =>
  import('@/features/loyalty/BusinessRegisterPage').then((module) => ({
    default: module.BusinessRegisterPage,
  })),
);
const BusinessJoinPage = lazy(() =>
  import('@/features/loyalty/BusinessJoinPage').then((module) => ({
    default: module.BusinessJoinPage,
  })),
);
const BusinessDashboardPage = lazy(() =>
  import('@/features/admin/BusinessDashboardPage').then((module) => ({
    default: module.BusinessDashboardPage,
  })),
);
const ConfigPage = lazy(() =>
  import('@/features/admin/ConfigPage').then((module) => ({
    default: module.ConfigPage,
  })),
);
const ProfilePage = lazy(() =>
  import('@/features/profile/ProfilePage').then((module) => ({
    default: module.ProfilePage,
  })),
);
const PurchaseRegistrationPage = lazy(() =>
  import('@/features/admin/PurchaseRegistrationPage').then((module) => ({
    default: module.PurchaseRegistrationPage,
  })),
);
const AuditPage = lazy(() =>
  import('@/features/admin/AuditPage').then((module) => ({
    default: module.AuditPage,
  })),
);
const CampaignsPage = lazy(() =>
  import('@/features/admin/CampaignsPage').then((module) => ({
    default: module.CampaignsPage,
  })),
);
const AdminRedemptionsPage = lazy(() =>
  import('@/features/admin/RedemptionsPage').then((module) => ({
    default: module.RedemptionsPage,
  })),
);
const EncargadoPage = lazy(() =>
  import('@/features/loyalty/EncargadoPage').then((module) => ({
    default: module.EncargadoPage,
  })),
);
const ScanRedemptionPage = lazy(() =>
  import('@/features/loyalty/ScanRedemptionPage').then((module) => ({
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
              <ProfilePage />
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
              <BusinessRegisterPage />
            </RequireAuth>
          }
        />

        <Route
          path="/encargado"
          element={
            <RequireAuth>
              <BusinessLayout>
                <RequireBusinessRole roles={['admin', 'encargado']}>
                  <EncargadoPage />
                </RequireBusinessRole>
              </BusinessLayout>
            </RequireAuth>
          }
        />
        <Route
          path="/encargado/venta"
          element={
            <RequireAuth>
              <BusinessLayout>
                <RequireBusinessRole roles={['admin', 'encargado']}>
                  <PurchaseRegistrationPage />
                </RequireBusinessRole>
              </BusinessLayout>
            </RequireAuth>
          }
        />

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
          <Route index element={<DashboardPage />} />
          <Route path="balance" element={<CustomerBusinessBalancePage />} />
          <Route path="purchases" element={<CustomerPurchasesPage />} />
          <Route path="redemptions" element={<CustomerRedemptionsPage />} />
        </Route>

        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <BusinessLayout>
                <RequireBusinessRole roles={['admin']}>
                  <AdminShell />
                </RequireBusinessRole>
              </BusinessLayout>
            </RequireAdmin>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<BusinessDashboardPage />} />
          <Route path="config" element={<ConfigPage />} />
          <Route
            path="business"
            element={<Navigate to="/admin/config?tab=negocio" replace />}
          />
          <Route
            path="program"
            element={<Navigate to="/admin/config?tab=programa" replace />}
          />
          <Route
            path="products"
            element={<Navigate to="/admin/config?tab=carta" replace />}
          />
          <Route
            path="rewards"
            element={<Navigate to="/admin/config?tab=recompensas" replace />}
          />
          <Route path="redemptions" element={<AdminRedemptionsPage />} />
          <Route
            path="members"
            element={<Navigate to="/admin/config?tab=equipo" replace />}
          />
          <Route path="customers" element={<AdminCustomersPage />} />
          <Route path="customers/:id" element={<AdminCustomerDetailPage />} />
          <Route path="purchases" element={<AdminPurchasesPage />} />
          <Route path="purchases/new" element={<PurchaseRegistrationPage />} />
          <Route
            path="economic"
            element={<Navigate to="/admin/config?tab=economico" replace />}
          />
          <Route path="audit" element={<AuditPage />} />
          <Route
            path="onboarding"
            element={<Navigate to="/admin/config?tab=negocio&onboarding=1" replace />}
          />
          <Route path="campaigns" element={<CampaignsPage />} />
          <Route
            path="settings"
            element={<Navigate to="/admin/config?tab=avanzado" replace />}
          />
        </Route>

        {/* Rutas heredadas */}
        <Route path="/registrar/*" element={<Navigate to="/admin" replace />} />
        <Route path="/customer/rewards" element={<Navigate to="/customer" replace />} />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
