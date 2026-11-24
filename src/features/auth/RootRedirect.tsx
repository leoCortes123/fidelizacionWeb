import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { FullPageLoader } from "@/components/shared/States";
import { defaultPathForRoles } from "@/lib/config";
import { resolvePostLoginPath } from "@/lib/postLogin";
import { useAuth } from "./AuthProvider";

/**
 * La página comercial vive en el sitio estático separado (`fidelizacionWebPage`).
 * En la app/PWA, `/` lleva al portal del rol autenticado y, sin sesión, a `/login`
 * conservando parámetros como `?install=1`.
 */
export function RootRedirect() {
  const { session, roles, loading, rolesLoading, rolesLoaded } = useAuth();
  const { search } = useLocation();
  const [target, setTarget] = useState<string | null>(null);
  const loginTarget = search ? `/login${search}` : "/login";

  useEffect(() => {
    if (loading) return;
    if (!session) {
      setTarget(loginTarget);
      return;
    }
    if (rolesLoading || !rolesLoaded) return;

    let active = true;
    setTarget(null);
    void resolvePostLoginPath(roles, session.user.id)
      .then((path) => {
        if (active) setTarget(path);
      })
      .catch(() => {
        if (active) setTarget(defaultPathForRoles(roles));
      });

    return () => {
      active = false;
    };
  }, [loading, loginTarget, roles, rolesLoaded, rolesLoading, session]);

  if (loading || (session && (rolesLoading || !rolesLoaded))) {
    return <FullPageLoader label="Cargando tu cuenta…" />;
  }

  if (!session) return <Navigate to={loginTarget} replace />;
  if (!target) return <FullPageLoader label="Preparando tu inicio…" />;

  return <Navigate to={target} replace />;
}
