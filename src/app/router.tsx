import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { CustomerShell } from '@/components/layout/CustomerShell';
import { AdminShell } from '@/components/layout/AdminShell';
import { RequireAdmin, RequireAuth } from '@/components/layout/RequireAuth';
import { FullPageLoader } from '@/components/shared/States';

// Las páginas se cargan bajo demanda para reducir el bundle inicial.
const LandingPage = lazy(() =>
  import('@/features/auth/LandingPage').then((module) => ({
    default: module.LandingPage,
  })),
);
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
const ClaimPage = lazy(() =>
  import('@/features/purchases/ClaimPage').then((module) => ({
    default: module.ClaimPage,
  })),
);
const QrPage = lazy(() =>
  import('@/features/admin/QrPage').then((module) => ({
    default: module.QrPage,
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
const SettingsPage = lazy(() =>
  import('@/features/admin/SettingsPage').then((module) => ({
    default: module.SettingsPage,
  })),
);

export function AppRoutes() {
  return (
    <Suspense fallback={<FullPageLoader label="Cargando la página…" />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/claim/:token" element={<ClaimPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        <Route
          path="/customer"
          element={
            <RequireAuth>
              <CustomerShell />
            </RequireAuth>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="purchases" element={<CustomerPurchasesPage />} />
          <Route path="redemptions" element={<CustomerRedemptionsPage />} />
        </Route>

        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminShell />
            </RequireAdmin>
          }
        >
          <Route index element={<QrPage />} />
          <Route path="customers" element={<AdminCustomersPage />} />
          <Route path="customers/:id" element={<AdminCustomerDetailPage />} />
          <Route path="purchases" element={<AdminPurchasesPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Rutas heredadas */}
        <Route path="/registrar/*" element={<Navigate to="/admin" replace />} />
        <Route path="/customer/rewards" element={<Navigate to="/customer" replace />} />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
