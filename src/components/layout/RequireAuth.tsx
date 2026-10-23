import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthProvider';
import { ErrorState, FullPageLoader } from '@/components/shared/States';
import { Brand } from '@/components/shared/Brand';
import { Button } from '@/components/ui/button';

function loginPath(next: string) {
  return `/login?next=${encodeURIComponent(next)}`;
}

function RolesErrorScreen({
  error,
  onRetry,
}: {
  error: unknown;
  onRetry: () => void;
}) {
  return (
    <div className="hero-glow grid min-h-screen place-items-center p-6">
      <div className="w-full max-w-md space-y-4">
        <div className="flex justify-center">
          <Brand />
        </div>
        <ErrorState
          title="No pudimos verificar tus permisos"
          error={error}
          onRetry={onRetry}
        />
        <Button variant="ghost" className="w-full" asChild>
          <Link to="/customer">Ir a mis puntos</Link>
        </Button>
      </div>
    </div>
  );
}

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullPageLoader />;
  if (!session) {
    const next = `${location.pathname}${location.search}`;
    return <Navigate to={loginPath(next)} replace />;
  }
  return <>{children}</>;
}

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const {
    session,
    roles,
    loading,
    rolesLoading,
    rolesLoaded,
    rolesError,
    refreshRoles,
  } = useAuth();
  const location = useLocation();

  if (loading) return <FullPageLoader />;
  if (!session) {
    const next = `${location.pathname}${location.search}`;
    return <Navigate to={loginPath(next)} replace />;
  }
  if (rolesLoading || !rolesLoaded) {
    return <FullPageLoader label="Verificando permisos…" />;
  }
  // Un fallo de red no significa que el usuario no sea administrador: se
  // ofrece reintentar en lugar de mandarlo a "Acceso restringido".
  if (rolesError) {
    return (
      <RolesErrorScreen
        error={rolesError}
        onRetry={() => void refreshRoles()}
      />
    );
  }
  if (!roles.includes('admin')) {
    return <Navigate to="/unauthorized" replace />;
  }
  return <>{children}</>;
}
