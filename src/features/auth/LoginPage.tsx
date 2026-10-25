import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Brand } from '@/components/shared/Brand';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from './AuthProvider';
import {
  brandName,
  isSupabaseConfigured,
  safeNextPath,
} from '@/lib/config';
import { resolvePostLoginPath } from '@/lib/postLogin';
import { errorMessage } from '@/lib/errors';

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4">
      <path
        fill="#4285F4"
        d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.33 2.98-7.38Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.96-.9 6.62-2.39l-3.24-2.51c-.9.6-2.05.96-3.38.96-2.6 0-4.8-1.76-5.59-4.12H3.06v2.59A10 10 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.41 13.94a6 6 0 0 1 0-3.88V7.47H3.06a10 10 0 0 0 0 9.06l3.35-2.59Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.94c1.47 0 2.79.5 3.82 1.5l2.87-2.87A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.94 5.47l3.35 2.59C7.2 7.7 9.4 5.94 12 5.94Z"
      />
    </svg>
  );
}

export function LoginPage() {
  const [params] = useSearchParams();
  const next = safeNextPath(params.get('next'));
  const navigate = useNavigate();
  const {
    session,
    roles,
    loading,
    rolesLoading,
    rolesLoaded,
    signInWithGoogle,
    signInWithPassword,
    signUpWithPassword,
  } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  useEffect(() => {
    if (loading || !session || rolesLoading || !rolesLoaded) return;
    if (params.get('next')) {
      navigate(next, { replace: true });
      return;
    }
    let active = true;
    void resolvePostLoginPath(roles).then((destination) => {
      if (active) navigate(destination, { replace: true });
    });
    return () => {
      active = false;
    };
  }, [loading, session, rolesLoading, rolesLoaded, roles, next, params, navigate]);

  async function handleGoogle() {
    setSubmitting(true);
    setError(null);
    try {
      await signInWithGoogle(next);
    } catch (submitError) {
      setError(errorMessage(submitError));
      setSubmitting(false);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    if (!email.includes('@')) {
      setError('Escribe un correo válido.');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (mode === 'register' && fullName.trim().length < 2) {
      setError('Escribe tu nombre para personalizar tu cuenta.');
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'login') {
        await signInWithPassword(email, password);
      } else {
        const { needsConfirmation } = await signUpWithPassword({
          email,
          password,
          fullName,
        });
        if (needsConfirmation) {
          setNotice('Revisa tu correo para confirmar la cuenta y luego entra.');
        }
      }
    } catch (submitError) {
      setError(errorMessage(submitError));
    } finally {
      setSubmitting(false);
    }
  }

  function switchMode(nextMode: 'login' | 'register') {
    setMode(nextMode);
    setError(null);
    setNotice(null);
  }

  return (
    <div className="hero-glow grid min-h-screen place-items-center px-4 py-8">
      <div className="w-full max-w-md space-y-5">
        <div className="flex flex-col items-center gap-2 text-center">
          <Brand />
          <p className="text-sm text-muted-foreground">{brandName}</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="text-2xl">
              {mode === 'login' ? 'Entra a tus puntos' : 'Crea tu cuenta'}
            </CardTitle>
            <CardDescription>
              {mode === 'login'
                ? 'Revisa tu saldo y tus recompensas desde el teléfono.'
                : 'Regístrate en segundos para empezar a acumular.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isSupabaseConfigured && (
              <Alert variant="warning">
                <AlertTitle>Configuración pendiente</AlertTitle>
                <AlertDescription>
                  Define las variables de Supabase en <code>.env</code> para
                  habilitar el inicio de sesión. Consulta{' '}
                  <code>docs/CONFIGURACION.md</code>.
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertTitle>No se pudo continuar</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {notice && (
              <Alert variant="success">
                <AlertTitle>Cuenta creada</AlertTitle>
                <AlertDescription>{notice}</AlertDescription>
              </Alert>
            )}

            <Button
              size="lg"
              className="w-full"
              onClick={handleGoogle}
              disabled={submitting || loading}
            >
              {submitting ? (
                <Loader2 className="animate-spin" aria-hidden="true" />
              ) : (
                <GoogleIcon />
              )}
              Continuar con Google
            </Button>

            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-border" />
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                o con tu correo
              </span>
              <span className="h-px flex-1 bg-border" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {mode === 'register' && (
                <div className="space-y-1.5">
                  <Label htmlFor="full-name">Nombre</Label>
                  <Input
                    id="full-name"
                    autoComplete="name"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    placeholder="Tu nombre"
                    required
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="email">Correo</Label>
                <Input
                  id="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="tu@correo.com"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete={
                    mode === 'login' ? 'current-password' : 'new-password'
                  }
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  minLength={6}
                  required
                />
              </div>

              <Button
                type="submit"
                variant="outline"
                size="lg"
                className="w-full"
                loading={submitting}
              >
                {mode === 'login' ? 'Entrar con correo' : 'Crear cuenta'}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              {mode === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
              <button
                type="button"
                className="font-semibold text-primary underline-offset-4 hover:underline"
                onClick={() =>
                  switchMode(mode === 'login' ? 'register' : 'login')
                }
              >
                {mode === 'login' ? 'Regístrate' : 'Inicia sesión'}
              </button>
            </p>

            <Button variant="ghost" className="w-full" asChild>
              <Link to="/">
                <ArrowLeft aria-hidden="true" />
                Volver al inicio
              </Link>
            </Button>
          </CardContent>
        </Card>

        <p className="text-center text-xs leading-relaxed text-muted-foreground">
          Al entrar aceptas que guardemos tu nombre y correo para asociar tus
          compras. No pedimos datos de tarjetas.
        </p>
      </div>
    </div>
  );
}
