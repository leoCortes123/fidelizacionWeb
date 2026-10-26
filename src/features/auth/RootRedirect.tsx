import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { FullPageLoader } from '@/components/shared/States';
import { defaultPathForRoles } from '@/lib/config';
import { resolvePostLoginPath } from '@/lib/postLogin';
import { useAuth } from './AuthProvider';

/**
 * La landing comercial se retiró: `/` lleva al portal del rol autenticado y,
 * sin sesión, al inicio de sesión.
 */
export function RootRedirect() {
  const { session, roles, loading, rolesLoading, rolesLoaded } = useAuth();
  const [target, setTarget] = useState<string | null>(null);

  useEffect(() => {
    if (!session) {
      setTarget('/login');
      return;
    }
    if (rolesLoading || !rolesLoaded) return;

    let active = true;
    void resolvePostLoginPath(roles)
      .then((path) => {
        if (active) setTarget(path);
      })
      .catch(() => {
        if (active) setTarget(defaultPathForRoles(roles));
      });

    return () => {
      active = false;
    };
  }, [roles, rolesLoaded, rolesLoading, session]);

  if (loading || (session && (rolesLoading || !rolesLoaded))) {
    return <FullPageLoader label="Cargando tu cuenta…" />;
  }

  if (!session) return <Navigate to="/login" replace />;
  if (!target) return <FullPageLoader label="Preparando tu inicio…" />;

  return <Navigate to={target} replace />;
}
