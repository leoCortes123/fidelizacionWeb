import { useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Brand } from '@/components/shared/Brand';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FullPageLoader } from '@/components/shared/States';
import { useAuth } from './AuthProvider';
import { safeNextPath } from '@/lib/config';
import { resolvePostLoginPath } from '@/lib/postLogin';

export function AuthCallbackPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { session, roles, loading, rolesLoading } = useAuth();
  const nextParam = params.get('next');
  const next = nextParam ? safeNextPath(nextParam) : null;
  const oauthError =
    params.get('error_description') || params.get('error');

  useEffect(() => {
    if (loading) return;
    if (!session) return;
    if (next) {
      navigate(next, { replace: true });
      return;
    }
    if (rolesLoading) return;
    let active = true;
    void resolvePostLoginPath(roles).then((destination) => {
      if (active) navigate(destination, { replace: true });
    });
    return () => {
      active = false;
    };
  }, [loading, session, roles, rolesLoading, next, navigate]);

  if (oauthError) {
    return (
      <div className="hero-glow grid min-h-screen place-items-center px-4">
        <div className="w-full max-w-md space-y-4">
          <div className="flex justify-center">
            <Brand />
          </div>
          <Alert variant="destructive">
            <AlertTitle>No se pudo completar el inicio de sesión</AlertTitle>
            <AlertDescription>{decodeURIComponent(oauthError)}</AlertDescription>
          </Alert>
          <Button asChild className="w-full">
            <Link to="/login">Intentar de nuevo</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!loading && !session) {
    return (
      <div className="hero-glow grid min-h-screen place-items-center px-4">
        <div className="w-full max-w-md space-y-4">
          <div className="flex justify-center">
            <Brand />
          </div>
          <Alert variant="warning">
            <AlertTitle>No encontramos una sesión activa</AlertTitle>
            <AlertDescription>
              El enlace pudo expirar. Vuelve a iniciar sesión con Google.
            </AlertDescription>
          </Alert>
          <Button asChild className="w-full">
            <Link to={next ? `/login?next=${encodeURIComponent(next)}` : '/login'}>
              Iniciar sesión
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return <FullPageLoader label="Iniciando sesión…" />;
}
