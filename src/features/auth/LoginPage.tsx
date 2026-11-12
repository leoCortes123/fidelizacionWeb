import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  Check,
  Eye,
  EyeOff,
  Gift,
  Loader2,
  QrCode,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Brand } from "@/components/shared/Brand";
import { FullPageLoader } from "@/components/shared/States";
import { queryClient } from "@/app/queryClient";
import { useAuth } from "./AuthProvider";
import { persistBusinessSelection } from "@/features/loyalty/businessContext";
import {
  brandName,
  brandTagline,
  businessHomePath,
  isSupabaseConfigured,
  safeNextPath,
} from "@/lib/config";
import { clearPendingClaim } from "@/lib/pendingClaim";
import { resolvePostLoginPath } from "@/lib/postLogin";
import { errorMessage } from "@/lib/errors";
import { queryKeys } from "@/lib/queryKeys";
import { rpc } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import type { BusinessRole, MemberInviteAcceptResult, MemberInvitePreview } from "@/types";

export type AccountType = "customer" | "admin";

type FieldErrors = {
  fullName?: string;
  email?: string;
  password?: string;
};

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4 shrink-0">
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

const INVITE_TOKEN_PATTERN = /^[A-Za-z0-9_-]{20,100}$/;

function inviteRoleLabel(role: BusinessRole): string {
  if (role === "admin") return "Administrador";
  if (role === "encargado") return "Encargado";
  return "Cliente";
}

function inviteStatusMessage(status: MemberInvitePreview["status"] | undefined): string | null {
  if (status === "accepted") {
    return "Este código QR de invitación ya fue utilizado por otra cuenta.";
  }
  if (status === "expired") {
    return "Este código QR de invitación venció. Pide al administrador uno nuevo.";
  }
  if (status === "revoked") {
    return "Esta invitación fue anulada. Pide al administrador un código nuevo.";
  }
  return null;
}

export function LoginPage() {
  const [params] = useSearchParams();
  const next = safeNextPath(params.get("next"));
  const hasNextParam = Boolean(params.get("next"));
  const inviteToken = params.get("invite")?.trim() || null;
  const hasInvite = Boolean(inviteToken);
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
    refreshRoles,
  } = useAuth();

  const modeParam = params.get("mode");
  const roleParam = params.get("role") ?? params.get("account");

  const [mode, setMode] = useState<"login" | "register">(
    modeParam === "register" ? "register" : "login",
  );
  const [accountType, setAccountType] = useState<AccountType>(() => {
    if (hasInvite) return "customer";
    if (
      roleParam === "admin" ||
      next.startsWith("/business/register") ||
      next.startsWith("/admin")
    ) {
      return "admin";
    }
    return "customer";
  });

  useEffect(() => {
    if (modeParam === "register" || modeParam === "login") {
      setMode(modeParam);
    }
  }, [modeParam]);

  useEffect(() => {
    if (hasInvite) {
      setAccountType("customer");
      return;
    }
    if (
      roleParam === "admin" ||
      next.startsWith("/business/register") ||
      next.startsWith("/admin")
    ) {
      setAccountType("admin");
    } else if (roleParam === "customer") {
      setAccountType("customer");
    }
  }, [hasInvite, roleParam, next]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [invitePreview, setInvitePreview] = useState<MemberInvitePreview | null>(null);
  const [invitePreviewLoading, setInvitePreviewLoading] = useState(false);
  const [invitePreviewError, setInvitePreviewError] = useState<string | null>(null);
  const [inviteAcceptError, setInviteAcceptError] = useState<string | null>(null);
  const inviteAcceptAttemptRef = useRef<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const errorBannerRef = useRef<HTMLDivElement>(null);
  const loginTabRef = useRef<HTMLButtonElement>(null);
  const registerTabRef = useRef<HTMLButtonElement>(null);
  const customerRadioRef = useRef<HTMLButtonElement>(null);
  const adminRadioRef = useRef<HTMLButtonElement>(null);

  const inviteCallbackPath = inviteToken
    ? `/login?invite=${encodeURIComponent(inviteToken)}`
    : null;
  const isGenericAdminHome = next === "/admin" || next === "/admin/dashboard";
  const effectiveNext = inviteCallbackPath
    ? inviteCallbackPath
    : mode === "register"
      ? accountType === "admin"
        ? next.startsWith("/admin/onboarding") || next.startsWith("/business")
          ? next
          : "/admin/onboarding"
        : next.startsWith("/admin") || next.startsWith("/business")
          ? "/customer"
          : next
      : next;

  useEffect(() => {
    if (!hasNextParam || !next.startsWith("/claim/")) {
      clearPendingClaim();
    }
  }, [hasNextParam, next]);

  useEffect(() => {
    if (!inviteToken) {
      setInvitePreview(null);
      setInvitePreviewError(null);
      setInvitePreviewLoading(false);
      return;
    }
    if (!INVITE_TOKEN_PATTERN.test(inviteToken)) {
      setInvitePreview(null);
      setInvitePreviewError("Este código QR de invitación no es válido.");
      setInvitePreviewLoading(false);
      return;
    }
    let active = true;
    setInvitePreviewLoading(true);
    setInvitePreviewError(null);
    void rpc<MemberInvitePreview>("business_member_invite_preview", {
      p_token: inviteToken,
    })
      .then((data) => {
        if (!active) return;
        setInvitePreview(data);
      })
      .catch((previewError) => {
        if (!active) return;
        setInvitePreview(null);
        setInvitePreviewError(errorMessage(previewError));
      })
      .finally(() => {
        if (active) setInvitePreviewLoading(false);
      });
    return () => {
      active = false;
    };
  }, [inviteToken]);

  const sessionUserId = session?.user.id ?? null;

  useEffect(() => {
    if (loading) return;
    if (!sessionUserId) {
      inviteAcceptAttemptRef.current = null;
      return;
    }
    if (!inviteToken) return;
    if (!INVITE_TOKEN_PATTERN.test(inviteToken)) {
      setInviteAcceptError("Este código QR de invitación no es válido.");
      return;
    }
    const attemptKey = `${sessionUserId}:${inviteToken}`;
    if (inviteAcceptAttemptRef.current === attemptKey) return;
    inviteAcceptAttemptRef.current = attemptKey;

    setInviteAcceptError(null);
    void rpc<MemberInviteAcceptResult>("business_member_invite_accept", {
      p_token: inviteToken,
    })
      .then(async (result) => {
        if (!mountedRef.current || inviteAcceptAttemptRef.current !== attemptKey) return;
        persistBusinessSelection(sessionUserId, result.business_id);
        queryClient.removeQueries({ queryKey: queryKeys.businesses });
        queryClient.removeQueries({ queryKey: queryKeys.customerBusinessesSummary });
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: queryKeys.roles }),
          queryClient.invalidateQueries({
            queryKey: queryKeys.businessMemberships(result.business_id),
          }),
        ]);
        await refreshRoles?.();
        if (!mountedRef.current || inviteAcceptAttemptRef.current !== attemptKey) return;
        const label = inviteRoleLabel(result.role).toLowerCase();
        toast.success(
          result.role_changed
            ? `Tu rol en ${result.business_name} cambió a ${label}.`
            : `Te uniste a ${result.business_name} como ${label}.`,
        );
        navigate(businessHomePath(result.role, result.business_id), { replace: true });
      })
      .catch((acceptError) => {
        if (!mountedRef.current || inviteAcceptAttemptRef.current !== attemptKey) return;
        setInviteAcceptError(errorMessage(acceptError));
      });
  }, [loading, sessionUserId, inviteToken, refreshRoles, navigate]);

  useEffect(() => {
    if (loading || !session || rolesLoading || !rolesLoaded) return;
    if (inviteToken) return;

    if (mode === "register") {
      navigate(effectiveNext, { replace: true });
      return;
    }
    if (hasNextParam && next !== "/customer" && !isGenericAdminHome) {
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
    inviteToken,
    refreshRoles,
    next,
    effectiveNext,
    hasNextParam,
    isGenericAdminHome,
    mode,
    navigate,
  ]);

  function focusErrorBanner() {
    window.requestAnimationFrame(() => {
      errorBannerRef.current?.focus();
    });
  }

  function validateField(field: keyof FieldErrors, value: string): string | undefined {
    if (field === "fullName" && mode === "register") {
      if (value.trim().length > 0 && value.trim().length < 2) {
        return "Escribe tu nombre (mínimo 2 caracteres).";
      }
    }
    if (field === "email" && value.trim().length > 0 && !value.includes("@")) {
      return "Escribe un correo válido.";
    }
    if (field === "password" && value.length > 0 && value.length < 6) {
      return "La contraseña debe tener al menos 6 caracteres.";
    }
    return undefined;
  }

  async function handleGoogle() {
    setSubmitting(true);
    setError(null);
    setFieldErrors({});
    try {
      if (inviteCallbackPath) {
        await signInWithGoogle(inviteCallbackPath, mode === "register" ? "customer" : undefined);
      } else if (mode === "register") {
        await signInWithGoogle(effectiveNext, accountType);
      } else {
        await signInWithGoogle(hasNextParam ? effectiveNext : undefined);
      }
    } catch (submitError) {
      setError(errorMessage(submitError));
      focusErrorBanner();
      setSubmitting(false);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setNotice(null);

    const nextFieldErrors: FieldErrors = {};
    if (mode === "register" && fullName.trim().length < 2) {
      nextFieldErrors.fullName = "Escribe tu nombre para personalizar tu cuenta.";
    }
    if (!email.includes("@")) {
      nextFieldErrors.email = "Escribe un correo válido.";
    }
    if (password.length < 6) {
      nextFieldErrors.password = "La contraseña debe tener al menos 6 caracteres.";
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      setError(
        nextFieldErrors.email ??
          nextFieldErrors.password ??
          nextFieldErrors.fullName ??
          "Revisa los campos marcados.",
      );
      focusErrorBanner();
      return;
    }

    setFieldErrors({});
    setSubmitting(true);
    try {
      if (mode === "login") {
        await signInWithPassword(email, password);
      } else {
        const { needsConfirmation } = await signUpWithPassword({
          email,
          password,
          fullName,
          accountType: hasInvite ? "customer" : accountType,
          nextPath: effectiveNext,
        });
        if (needsConfirmation) {
          setNotice("Revisa tu correo para confirmar la cuenta y luego entra.");
        }
      }
    } catch (submitError) {
      setError(errorMessage(submitError));
      focusErrorBanner();
    } finally {
      setSubmitting(false);
    }
  }

  function switchMode(nextMode: "login" | "register") {
    setMode(nextMode);
    setError(null);
    setNotice(null);
    setFieldErrors({});
  }

  function handleTabKeyDown(event: React.KeyboardEvent, current: "login" | "register") {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const nextMode = current === "login" ? "register" : "login";
    switchMode(nextMode);
    (nextMode === "login" ? loginTabRef : registerTabRef).current?.focus();
  }

  function handleRadioKeyDown(event: React.KeyboardEvent, current: AccountType) {
    if (
      event.key !== "ArrowLeft" &&
      event.key !== "ArrowRight" &&
      event.key !== "ArrowUp" &&
      event.key !== "ArrowDown"
    ) {
      return;
    }
    event.preventDefault();
    const nextType: AccountType = current === "customer" ? "admin" : "customer";
    setAccountType(nextType);
    (nextType === "customer" ? customerRadioRef : adminRadioRef).current?.focus();
  }

  const brand = brandName || "Loopoint";
  const isBusinessRegister = !hasInvite && mode === "register" && accountType === "admin";
  const inviteUnavailableReason =
    invitePreviewError ?? inviteStatusMessage(invitePreview?.status) ?? null;
  const inviteBlocked = hasInvite && Boolean(inviteUnavailableReason);
  const inviteRoleText = invitePreview ? inviteRoleLabel(invitePreview.role) : null;

  if (session && inviteToken) {
    if (inviteAcceptError) {
      return (
        <div className="hero-glow grid min-h-screen place-items-center px-4">
          <div className="w-full max-w-md space-y-4">
            <div className="flex justify-center">
              <Brand />
            </div>
            <Alert variant="destructive">
              <AlertTitle>No se pudo aplicar la invitación</AlertTitle>
              <AlertDescription>{inviteAcceptError}</AlertDescription>
            </Alert>
            <Button
              type="button"
              className="w-full"
              disabled={rolesLoading || !rolesLoaded}
              onClick={() => {
                void resolvePostLoginPath(roles).then((destination) => {
                  navigate(destination, { replace: true });
                });
              }}
            >
              {rolesLoading || !rolesLoaded ? "Cargando tu portal…" : "Ir a mi portal"}
            </Button>
          </div>
        </div>
      );
    }
    return <FullPageLoader label="Aplicando invitación…" />;
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border/80 bg-card/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <Brand linkTo="/" />
          <Button variant="outline" size="sm" asChild className="shrink-0">
            <Link to="/">
              <ArrowLeft aria-hidden="true" />
              Volver al inicio
            </Link>
          </Button>
        </div>
      </header>

      <main className="grid flex-1 lg:grid-cols-12">
        {/* Panel editorial izquierdo (desktop) */}
        <section
          aria-label={`Beneficios de ${brand}`}
          className="relative hidden overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 p-10 text-white lg:col-span-5 lg:flex lg:flex-col lg:justify-between xl:p-14"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-24 -top-24 size-80 rounded-full bg-blue-500/20 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-24 -right-24 size-80 rounded-full bg-amber-400/15 blur-3xl"
          />

          <div className="relative space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-blue-100 backdrop-blur-sm">
              <Sparkles className="size-3.5 text-amber-300" aria-hidden="true" />
              {isBusinessRegister
                ? "Portal para negocios"
                : mode === "register"
                  ? "Empieza en menos de un minuto"
                  : "Tu billetera de recompensas"}
            </span>

            <div className="space-y-3">
              <h2 className="font-display text-3xl font-extrabold leading-tight tracking-tight xl:text-4xl">
                {isBusinessRegister
                  ? "Convierte cada venta en clientes que vuelven."
                  : "Cada compra suma loopoints y te acerca a un premio."}
              </h2>
              <p className="max-w-md text-sm leading-relaxed text-slate-300">
                {isBusinessRegister
                  ? "Configura tus reglas en pesos colombianos, controla el presupuesto de recompensas y valida canjes con QR desde cualquier celular."
                  : "Consulta tus saldos separados por negocio, revisa tus compras y canjea recompensas al instante sin tarjetas físicas."}
              </p>
            </div>
          </div>

          <div className="relative my-8 rounded-none border border-white/15 bg-white/10 p-5 shadow-2xl backdrop-blur-md">
            {isBusinessRegister ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="grid size-9 place-items-center rounded-none bg-amber-400 text-slate-950">
                      <TrendingUp className="size-4" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-xs font-medium text-blue-200">Resumen del programa</p>
                      <p className="text-sm font-bold text-white">Panel operativo en vivo</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-400/20 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300">
                    Activo
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-none border border-white/10 bg-slate-950/40 p-3">
                    <p className="text-[11px] text-slate-300">Regla sugerida</p>
                    <p className="mt-1 font-mono text-sm font-bold text-amber-300">
                      1 PTO / $1.000
                    </p>
                  </div>
                  <div className="rounded-none border border-white/10 bg-slate-950/40 p-3">
                    <p className="text-[11px] text-slate-300">Acreditación</p>
                    <p className="mt-1 font-mono text-sm font-bold text-cyan-300">QR en caja</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <img
                      src="/loopoint-coin.png"
                      alt=""
                      width={34}
                      height={34}
                      className="size-8 rounded-none object-contain"
                      aria-hidden="true"
                    />
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-blue-200">
                        Saldo disponible
                      </p>
                      <p className="font-display text-xl font-extrabold tabular-nums text-white">
                        1.250 loopoints
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-amber-400/20 px-2.5 py-0.5 text-[11px] font-semibold text-amber-300">
                    72% meta
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/15">
                  <div className="h-full w-[72%] rounded-full bg-gradient-to-r from-amber-400 to-cyan-400" />
                </div>
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span>Próximo premio: Café gratis</span>
                  <span className="font-mono text-emerald-300">2.000 pts</span>
                </div>
              </div>
            )}
          </div>

          <ul className="relative space-y-3 text-xs text-slate-300">
            <li className="flex items-center gap-2.5">
              <QrCode className="size-4 shrink-0 text-cyan-300" aria-hidden="true" />
              <span>Escanea códigos QR de venta o canje directamente desde tu navegador.</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Gift className="size-4 shrink-0 text-amber-300" aria-hidden="true" />
              <span>Tus saldos de cada comercio se mantienen ordenados y separados.</span>
            </li>
            <li className="flex items-center gap-2.5">
              <ShieldCheck className="size-4 shrink-0 text-emerald-300" aria-hidden="true" />
              <span>Acceso seguro con Google o correo, compatible con gestores de claves.</span>
            </li>
          </ul>
        </section>

        {/* Formulario principal derecho */}
        <section className="flex items-center justify-center px-0 py-4 sm:px-8 sm:py-8 lg:col-span-7 lg:py-12">
          <div className="w-full max-w-[460px] space-y-4 sm:space-y-5">
            <div className="rounded-none border border-border/80 bg-card p-4 shadow-[0_8px_30px_rgba(15,23,42,0.06)] dark:border-slate-800 sm:p-8">
              <div
                role="tablist"
                aria-label="Modo de acceso"
                className="mb-5 grid grid-cols-2 gap-1 rounded-none bg-muted p-1"
              >
                <button
                  ref={loginTabRef}
                  id="tab-login"
                  type="button"
                  role="tab"
                  aria-selected={mode === "login"}
                  aria-controls="auth-tabpanel"
                  tabIndex={mode === "login" ? 0 : -1}
                  onClick={() => switchMode("login")}
                  onKeyDown={(event) => handleTabKeyDown(event, "login")}
                  className={cn(
                    "min-h-9 cursor-pointer rounded-none px-3 py-1.5 text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    mode === "login"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  Iniciar sesión
                </button>
                <button
                  ref={registerTabRef}
                  id="tab-register"
                  type="button"
                  role="tab"
                  aria-selected={mode === "register"}
                  aria-controls="auth-tabpanel"
                  tabIndex={mode === "register" ? 0 : -1}
                  onClick={() => switchMode("register")}
                  onKeyDown={(event) => handleTabKeyDown(event, "register")}
                  className={cn(
                    "min-h-9 cursor-pointer rounded-none px-3 py-1.5 text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    mode === "register"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  Registro
                </button>
              </div>

              <div
                id="auth-tabpanel"
                role="tabpanel"
                aria-labelledby={mode === "login" ? "tab-login" : "tab-register"}
              >
                <div className="mb-6 space-y-1.5">
                  <span className="lp-section-kicker">
                    {hasInvite
                      ? "Invitación por código QR"
                      : mode === "login"
                        ? "Acceso a tu cuenta"
                        : accountType === "admin"
                          ? "Registro de administrador"
                          : "Registro de cliente"}
                  </span>
                  <h1 className="font-display text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                    {hasInvite
                      ? mode === "login"
                        ? "Inicia sesión para unirte"
                        : "Crea tu cuenta para unirte"
                      : mode === "login"
                        ? "Entra a tus loopoints"
                        : "Crea tu cuenta"}
                  </h1>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {hasInvite
                      ? invitePreview && !inviteUnavailableReason
                        ? `Te unirás a ${invitePreview.business_name} como ${inviteRoleText?.toLowerCase()}. Si ya tienes cuenta como cliente, tu rol se actualizará automáticamente.`
                        : "Completa el acceso para aplicar tu rol en el negocio."
                      : mode === "login"
                        ? "Revisa tu saldo y tus recompensas desde el teléfono."
                        : accountType === "admin"
                          ? "Crea tu cuenta de administrador para registrar y gestionar tu negocio."
                          : "Regístrate en segundos para empezar a acumular."}
                  </p>
                </div>

                <div className="space-y-5">
                  {hasInvite && (
                    <>
                      {invitePreviewLoading ? (
                        <Alert>
                          <AlertTitle>Verificando invitación…</AlertTitle>
                          <AlertDescription>
                            Estamos consultando los datos del negocio y tu rol asignado.
                          </AlertDescription>
                        </Alert>
                      ) : inviteUnavailableReason ? (
                        <Alert variant="destructive">
                          <AlertTitle>Invitación no disponible</AlertTitle>
                          <AlertDescription className="space-y-2">
                            <p>{inviteUnavailableReason}</p>
                            <Link
                              to="/login?mode=login"
                              className="inline-block font-semibold underline underline-offset-4"
                            >
                              Ir al acceso normal
                            </Link>
                          </AlertDescription>
                        </Alert>
                      ) : invitePreview ? (
                        <div className="space-y-2 rounded-none border border-primary/30 bg-primary/5 p-3.5 text-sm">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-semibold text-foreground">
                              {invitePreview.business_name}
                            </span>
                            <Badge variant="secondary">Rol: {inviteRoleText}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {invitePreview.role === "encargado" &&
                            invitePreview.can_approve_redemptions
                              ? "Incluye permiso para aprobar redenciones en caja."
                              : "El rol se asignará automáticamente al completar este paso."}
                          </p>
                        </div>
                      ) : null}
                    </>
                  )}

                  {!isSupabaseConfigured && (
                    <Alert variant="warning">
                      <AlertTitle>Configuración pendiente</AlertTitle>
                      <AlertDescription>
                        Define las variables de Supabase en <code>.env</code> para habilitar el
                        inicio de sesión. Consulta <code>docs/CONFIGURACION.md</code>.
                      </AlertDescription>
                    </Alert>
                  )}

                  {error && (
                    <div
                      ref={errorBannerRef}
                      tabIndex={-1}
                      className="rounded-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
                    >
                      <Alert variant="destructive">
                        <AlertTitle>No se pudo continuar</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    </div>
                  )}

                  {notice && (
                    <Alert variant="success">
                      <AlertTitle>Cuenta creada</AlertTitle>
                      <AlertDescription>{notice}</AlertDescription>
                    </Alert>
                  )}

                  {mode === "register" && !hasInvite && (
                    <div className="space-y-2" role="radiogroup" aria-label="Tipo de cuenta">
                      <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Tipo de cuenta
                      </span>
                      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                        <button
                          ref={customerRadioRef}
                          type="button"
                          role="radio"
                          aria-checked={accountType === "customer"}
                          tabIndex={accountType === "customer" ? 0 : -1}
                          onClick={() => setAccountType("customer")}
                          onKeyDown={(event) => handleRadioKeyDown(event, "customer")}
                          className={cn(
                            "relative flex cursor-pointer flex-col gap-1.5 rounded-none border p-3.5 text-left transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            accountType === "customer"
                              ? "border-emerald-600 bg-emerald-50/70 text-emerald-950 shadow-sm ring-1 ring-emerald-600/20 dark:border-emerald-500 dark:bg-emerald-950/35 dark:text-emerald-50"
                              : "border-border bg-background/60 text-foreground hover:border-slate-300 hover:bg-muted/50 dark:hover:border-slate-700",
                          )}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={cn(
                                "grid size-8 place-items-center rounded-none",
                                accountType === "customer"
                                  ? "bg-emerald-600 text-white"
                                  : "bg-muted text-muted-foreground",
                              )}
                            >
                              <UserRound className="size-4" aria-hidden="true" />
                            </span>
                            {accountType === "customer" && (
                              <span className="grid size-5 place-items-center rounded-full bg-emerald-600 text-white">
                                <Check className="size-3" aria-hidden="true" />
                              </span>
                            )}
                          </div>
                          <span className="font-display text-sm font-bold">Cliente</span>
                          <span className="text-xs leading-snug text-muted-foreground dark:text-slate-300">
                            Acumula loopoints y canjea premios
                          </span>
                        </button>

                        <button
                          ref={adminRadioRef}
                          type="button"
                          role="radio"
                          aria-checked={accountType === "admin"}
                          tabIndex={accountType === "admin" ? 0 : -1}
                          onClick={() => setAccountType("admin")}
                          onKeyDown={(event) => handleRadioKeyDown(event, "admin")}
                          className={cn(
                            "relative flex cursor-pointer flex-col gap-1.5 rounded-none border p-3.5 text-left transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            accountType === "admin"
                              ? "border-primary bg-primary/5 text-foreground shadow-sm ring-1 ring-primary/20 dark:bg-primary/15"
                              : "border-border bg-background/60 text-foreground hover:border-slate-300 hover:bg-muted/50 dark:hover:border-slate-700",
                          )}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={cn(
                                "grid size-8 place-items-center rounded-none",
                                accountType === "admin"
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-muted-foreground",
                              )}
                            >
                              <Building2 className="size-4" aria-hidden="true" />
                            </span>
                            {accountType === "admin" && (
                              <span className="grid size-5 place-items-center rounded-full bg-primary text-primary-foreground">
                                <Check className="size-3" aria-hidden="true" />
                              </span>
                            )}
                          </div>
                          <span className="font-display text-sm font-bold">Administrador</span>
                          <span className="text-xs leading-snug text-muted-foreground dark:text-slate-300">
                            Registra y administra tu negocio
                          </span>
                        </button>
                      </div>
                    </div>
                  )}

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleGoogle}
                    disabled={submitting || loading || inviteBlocked || invitePreviewLoading}
                  >
                    {submitting ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <GoogleIcon />
                    )}
                    Continuar con Google
                  </Button>

                  <div className="relative flex items-center gap-3">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      o con tu correo
                    </span>
                    <div className="h-px flex-1 bg-border" />
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                    {mode === "register" && (
                      <div className="space-y-1.5">
                        <Label htmlFor="full-name">Nombre</Label>
                        <Input
                          id="full-name"
                          name="name"
                          autoComplete="name"
                          value={fullName}
                          onChange={(event) => {
                            setFullName(event.target.value);
                            if (fieldErrors.fullName) {
                              setFieldErrors((current) => ({ ...current, fullName: undefined }));
                            }
                          }}
                          onBlur={() => {
                            const msg = validateField("fullName", fullName);
                            if (msg) setFieldErrors((current) => ({ ...current, fullName: msg }));
                          }}
                          placeholder={
                            accountType === "admin" ? "Nombre del administrador" : "Tu nombre"
                          }
                          aria-invalid={Boolean(fieldErrors.fullName)}
                          aria-describedby={fieldErrors.fullName ? "full-name-error" : undefined}
                          required
                        />
                        {fieldErrors.fullName && (
                          <p
                            id="full-name-error"
                            aria-live="polite"
                            className="text-xs font-medium text-destructive dark:text-red-400"
                          >
                            {fieldErrors.fullName}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <Label htmlFor="email">Correo</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        value={email}
                        onChange={(event) => {
                          setEmail(event.target.value);
                          if (fieldErrors.email) {
                            setFieldErrors((current) => ({ ...current, email: undefined }));
                          }
                        }}
                        onBlur={() => {
                          const msg = validateField("email", email);
                          if (msg) setFieldErrors((current) => ({ ...current, email: msg }));
                        }}
                        placeholder="tu@correo.com"
                        aria-invalid={Boolean(fieldErrors.email)}
                        aria-describedby={fieldErrors.email ? "email-error" : undefined}
                        required
                      />
                      {fieldErrors.email && (
                        <p
                          id="email-error"
                          aria-live="polite"
                          className="text-xs font-medium text-destructive dark:text-red-400"
                        >
                          {fieldErrors.email}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="password">Contraseña</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          autoComplete={mode === "login" ? "current-password" : "new-password"}
                          value={password}
                          onChange={(event) => {
                            setPassword(event.target.value);
                            if (fieldErrors.password) {
                              setFieldErrors((current) => ({ ...current, password: undefined }));
                            }
                          }}
                          onBlur={() => {
                            const msg = validateField("password", password);
                            if (msg) setFieldErrors((current) => ({ ...current, password: msg }));
                          }}
                          placeholder="Mínimo 6 caracteres"
                          minLength={6}
                          className="pr-9"
                          aria-invalid={Boolean(fieldErrors.password)}
                          aria-describedby={fieldErrors.password ? "password-error" : undefined}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((current) => !current)}
                          aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                          aria-pressed={showPassword}
                          className="absolute right-0.5 top-1/2 grid size-8 -translate-y-1/2 cursor-pointer place-items-center rounded-none text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          {showPassword ? (
                            <EyeOff className="size-4" aria-hidden="true" />
                          ) : (
                            <Eye className="size-4" aria-hidden="true" />
                          )}
                        </button>
                      </div>
                      {fieldErrors.password && (
                        <p
                          id="password-error"
                          aria-live="polite"
                          className="text-xs font-medium text-destructive dark:text-red-400"
                        >
                          {fieldErrors.password}
                        </p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      size="lg"
                      loading={submitting}
                      disabled={inviteBlocked || invitePreviewLoading}
                    >
                      {mode === "login"
                        ? "Entrar con correo"
                        : !hasInvite && accountType === "admin"
                          ? "Crear cuenta de administrador"
                          : "Crear cuenta"}
                    </Button>
                  </form>

                  <p className="text-center text-sm text-muted-foreground">
                    {mode === "login" ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}{" "}
                    <button
                      type="button"
                      className="cursor-pointer font-semibold text-primary underline-offset-4 hover:underline"
                      onClick={() => switchMode(mode === "login" ? "register" : "login")}
                    >
                      {mode === "login" ? "Regístrate" : "Inicia sesión"}
                    </button>
                  </p>
                </div>
              </div>
            </div>

            <p className="px-4 text-center text-xs leading-relaxed text-muted-foreground sm:px-0">
              {brand} · {brandTagline}. Al entrar aceptas que guardemos tu nombre y correo para
              asociar tus compras. No pedimos datos de tarjetas.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
