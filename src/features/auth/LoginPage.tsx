import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Building2, Loader2, UserRound } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "./AuthProvider";
import { brandName, brandTagline, isSupabaseConfigured, safeNextPath } from "@/lib/config";
import { clearPendingClaim } from "@/lib/pendingClaim";
import { resolvePostLoginPath } from "@/lib/postLogin";
import { errorMessage } from "@/lib/errors";
import "./LandingPage.css";

export type AccountType = "customer" | "admin";

function PixelHeartIcon() {
  return (
    <svg viewBox="0 0 8 7" className="pixel-heart" shapeRendering="crispEdges" aria-hidden="true">
      <path fill="#e6533f" d="M1 0h2v1h2V0h2v1h1v2H7v1H6v1H5v1H3V5H2V4H1V3H0V1h1V0z" />
      <path fill="#ffd166" d="M1 1h1v1H1V1z" />
    </svg>
  );
}

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
  const next = safeNextPath(params.get("next"));
  const hasNextParam = Boolean(params.get("next"));
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
  const [mode, setMode] = useState<"login" | "register">(
    params.get("mode") === "register" ? "register" : "login",
  );
  const [accountType, setAccountType] = useState<AccountType>(() => {
    const roleParam = params.get("role") ?? params.get("account");
    if (
      roleParam === "admin" ||
      next.startsWith("/business/register") ||
      next.startsWith("/admin")
    ) {
      return "admin";
    }
    return "customer";
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  const effectiveNext =
    mode === "register"
      ? accountType === "admin"
        ? next.startsWith("/admin") || next.startsWith("/business")
          ? next
          : "/business/register"
        : next.startsWith("/admin") || next.startsWith("/business")
          ? "/customer"
          : next
      : next;

  useEffect(() => {
    if (!hasNextParam) {
      clearPendingClaim();
    }
  }, [hasNextParam]);

  useEffect(() => {
    if (loading || !session || rolesLoading || !rolesLoaded) return;
    if (mode === "register") {
      navigate(effectiveNext, { replace: true });
      return;
    }
    if (hasNextParam && next !== "/customer") {
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
  }, [
    loading,
    session,
    rolesLoading,
    rolesLoaded,
    roles,
    next,
    effectiveNext,
    hasNextParam,
    mode,
    navigate,
  ]);

  async function handleGoogle() {
    setSubmitting(true);
    setError(null);
    try {
      if (mode === "register") {
        await signInWithGoogle(effectiveNext, accountType);
      } else {
        await signInWithGoogle(effectiveNext);
      }
    } catch (submitError) {
      setError(errorMessage(submitError));
      setSubmitting(false);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    if (!email.includes("@")) {
      setError("Escribe un correo válido.");
      return;
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (mode === "register" && fullName.trim().length < 2) {
      setError("Escribe tu nombre para personalizar tu cuenta.");
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "login") {
        await signInWithPassword(email, password);
      } else {
        const { needsConfirmation } = await signUpWithPassword({
          email,
          password,
          fullName,
          accountType,
          nextPath: effectiveNext,
        });
        if (needsConfirmation) {
          setNotice("Revisa tu correo para confirmar la cuenta y luego entra.");
        }
      }
    } catch (submitError) {
      setError(errorMessage(submitError));
    } finally {
      setSubmitting(false);
    }
  }

  function switchMode(nextMode: "login" | "register") {
    setMode(nextMode);
    setError(null);
    setNotice(null);
  }

  const brand = brandName || "Loopoint";

  return (
    <div className="retro-landing retro-auth">
      <header className="retro-header">
        <div className="wrap nav">
          <Link className="brand" to="/" aria-label={`${brand}, ir al inicio`}>
            <span className="brand-mark" aria-hidden="true">
              <img src="/loopoint-coin.png" alt="" width={26} height={26} className="brand-coin" />
            </span>
            <span className="brand-text">
              {brand.toLowerCase()}
              <span className="brand-dot">.</span>
            </span>
          </Link>
          <div className="nav-actions">
            <Link className="btn btn-light" to="/">
              <ArrowLeft className="size-4" aria-hidden="true" />
              Volver al inicio
            </Link>
          </div>
        </div>
      </header>

      <main className="auth-main">
        <div className="auth-shell">
          <div className="pixel-window auth-window">
            <div className="window-bar">
              <span className="window-title">
                <span className="window-led" aria-hidden="true" />{" "}
                {mode === "login" ? "PLAYER LOGIN" : "NEW PLAYER"}
              </span>
              <span className="window-hearts" aria-hidden="true">
                <PixelHeartIcon />
                <PixelHeartIcon />
                <PixelHeartIcon />
              </span>
            </div>

            <div className="window-body">
              <div className="auth-head">
                <div className="kicker">
                  {mode === "login" ? "★ INSERT COIN · ACCESO" : "✦ SELECT YOUR MODE"}
                </div>
                <h1 className="auth-title">
                  {mode === "login" ? "Entra a tus loopoints" : "Crea tu cuenta"}
                </h1>
                <p className="auth-subtitle">
                  {mode === "login"
                    ? "Revisa tu saldo y tus recompensas desde el teléfono."
                    : accountType === "admin"
                      ? "Crea tu cuenta de administrador para registrar y gestionar tu negocio."
                      : "Regístrate en segundos para empezar a acumular."}
                </p>
              </div>

              <div className="auth-stack">
                {!isSupabaseConfigured && (
                  <Alert variant="warning">
                    <AlertTitle>Configuración pendiente</AlertTitle>
                    <AlertDescription>
                      Define las variables de Supabase en <code>.env</code> para habilitar el inicio
                      de sesión. Consulta <code>docs/CONFIGURACION.md</code>.
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

                {mode === "register" && (
                  <div className="account-type-group" role="radiogroup" aria-label="Tipo de cuenta">
                    <span className="account-type-label">Tipo de cuenta</span>
                    <div className="account-type-grid">
                      <button
                        type="button"
                        role="radio"
                        aria-checked={accountType === "customer"}
                        className={`account-type-card customer ${
                          accountType === "customer" ? "active" : ""
                        }`}
                        onClick={() => setAccountType("customer")}
                      >
                        <div className="account-type-top">
                          <span className="account-type-tag">PLAYER 1</span>
                          <UserRound className="size-4" aria-hidden="true" />
                        </div>
                        <span className="account-type-name">Cliente</span>
                        <span className="account-type-desc">
                          Acumula loopoints y canjea premios
                        </span>
                      </button>

                      <button
                        type="button"
                        role="radio"
                        aria-checked={accountType === "admin"}
                        className={`account-type-card admin ${
                          accountType === "admin" ? "active" : ""
                        }`}
                        onClick={() => setAccountType("admin")}
                      >
                        <div className="account-type-top">
                          <span className="account-type-tag">PLAYER 2</span>
                          <Building2 className="size-4" aria-hidden="true" />
                        </div>
                        <span className="account-type-name">Administrador</span>
                        <span className="account-type-desc">Registra y administra tu negocio</span>
                      </button>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  className="btn btn-light auth-btn-full"
                  onClick={handleGoogle}
                  disabled={submitting || loading}
                >
                  {submitting ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <GoogleIcon />
                  )}
                  Continuar con Google
                </button>

                <div className="auth-divider">o con tu correo</div>

                <form onSubmit={handleSubmit} className="retro-form">
                  {mode === "register" && (
                    <div className="retro-field">
                      <Label htmlFor="full-name" className="retro-label">
                        Nombre
                      </Label>
                      <Input
                        id="full-name"
                        autoComplete="name"
                        value={fullName}
                        onChange={(event) => setFullName(event.target.value)}
                        placeholder={
                          accountType === "admin" ? "Nombre del administrador" : "Tu nombre"
                        }
                        className="retro-input"
                        required
                      />
                    </div>
                  )}
                  <div className="retro-field">
                    <Label htmlFor="email" className="retro-label">
                      Correo
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="tu@correo.com"
                      className="retro-input"
                      required
                    />
                  </div>
                  <div className="retro-field">
                    <Label htmlFor="password" className="retro-label">
                      Contraseña
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      autoComplete={mode === "login" ? "current-password" : "new-password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      minLength={6}
                      className="retro-input"
                      required
                    />
                  </div>

                  <button type="submit" className="btn btn-red auth-btn-full" disabled={submitting}>
                    {submitting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                    {mode === "login"
                      ? "Entrar con correo"
                      : accountType === "admin"
                        ? "Crear cuenta de administrador"
                        : "Crear cuenta"}
                  </button>
                </form>

                <p className="auth-switch">
                  {mode === "login" ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}{" "}
                  <button
                    type="button"
                    className="retro-link-btn"
                    onClick={() => switchMode(mode === "login" ? "register" : "login")}
                  >
                    {mode === "login" ? "Regístrate" : "Inicia sesión"}
                  </button>
                </p>
              </div>
            </div>
          </div>

          <p className="auth-legal">
            {brandTagline} · Al entrar aceptas que guardemos tu nombre y correo para asociar tus
            compras. No pedimos datos de tarjetas.
          </p>
        </div>
      </main>
    </div>
  );
}
