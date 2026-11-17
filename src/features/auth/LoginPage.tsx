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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePortalTheme } from "@/components/theme/ThemeProvider";
import { FullPageLoader } from "@/components/shared/States";
import { HeroCoinSvg, LoopointCoinSvg } from "@/features/customer/pixelSprites";
import "@/features/customer/customerRetro.css";
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
  businessName?: string;
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

function appendBusinessNameToPath(targetPath: string, bizName: string): string {
  const trimmed = bizName.trim();
  if (!trimmed) return targetPath;
  try {
    const url = new URL(targetPath, "http://localhost");
    url.searchParams.set("name", trimmed);
    return `${url.pathname}${url.search}`;
  } catch {
    const separator = targetPath.includes("?") ? "&" : "?";
    return `${targetPath}${separator}name=${encodeURIComponent(trimmed)}`;
  }
}

export function LoginPage() {
  usePortalTheme("customer");
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

  const [mode, setMode] = useState<"login" | "register">(() => {
    if (modeParam === "register" || modeParam === "login") return modeParam;
    return next.startsWith("/join/") ? "register" : "login";
  });
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
  const [businessName, setBusinessName] = useState("");
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
        ? appendBusinessNameToPath(
            next.startsWith("/admin/onboarding") || next.startsWith("/business")
              ? next
              : "/admin/onboarding",
            businessName,
          )
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
    if (field === "businessName" && mode === "register" && accountType === "admin" && !hasInvite) {
      if (value.trim().length > 0 && value.trim().length < 2) {
        return "El nombre del negocio debe tener al menos 2 caracteres.";
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
    if (
      mode === "register" &&
      accountType === "admin" &&
      !hasInvite &&
      businessName.trim().length < 2
    ) {
      nextFieldErrors.businessName = "Escribe el nombre de tu negocio para continuar.";
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
        nextFieldErrors.fullName ??
          nextFieldErrors.businessName ??
          nextFieldErrors.email ??
          nextFieldErrors.password ??
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
          ...(accountType === "admin" && !hasInvite && businessName.trim()
            ? { businessName: businessName.trim() }
            : {}),
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

  function handleSelectAccountType(nextType: AccountType) {
    setAccountType(nextType);
    if (nextType === "customer") {
      setFieldErrors((current) => ({ ...current, businessName: undefined }));
      setError((current) =>
        current === "Escribe el nombre de tu negocio para continuar." ? null : current,
      );
    }
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
    handleSelectAccountType(nextType);
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
        <div className="retro-customer">
          <header className="app-navbar">
            <div className="navbar-inner">
              <Link to="/" className="brand-link" title="Ir a Inicio">
                <div className="brand-logo-box" aria-hidden="true">
                  <LoopointCoinSvg size={20} />
                </div>
                <span className="brand-name">
                  {brand.toLowerCase()}
                  <span className="brand-dot">.</span>
                </span>
              </Link>
              <Link to="/" className="pixel-btn pixel-btn-secondary py-1.5 text-[11px] shrink-0">
                <ArrowLeft className="size-3.5" aria-hidden="true" />
                Volver al inicio
              </Link>
            </div>
          </header>

          <main className="grid flex-1 min-h-0 place-items-center overflow-y-auto px-4 py-6">
            <div className="pixel-box w-full max-w-md space-y-4 p-5 sm:p-6">
              <Alert variant="destructive" className="retro-alert">
                <AlertTitle>No se pudo aplicar la invitación</AlertTitle>
                <AlertDescription>{inviteAcceptError}</AlertDescription>
              </Alert>
              <button
                type="button"
                className="pixel-btn pixel-btn-dark w-full"
                disabled={rolesLoading || !rolesLoaded}
                onClick={() => {
                  void resolvePostLoginPath(roles).then((destination) => {
                    navigate(destination, { replace: true });
                  });
                }}
              >
                {rolesLoading || !rolesLoaded ? "Cargando tu portal…" : "Ir a mi portal"}
              </button>
            </div>
          </main>
        </div>
      );
    }
    return <FullPageLoader label="Aplicando invitación…" />;
  }

  return (
    <div className="retro-customer">
      <header className="app-navbar">
        <div className="navbar-inner">
          <Link to="/" className="brand-link" title="Ir a Inicio">
            <div className="brand-logo-box" aria-hidden="true">
              <LoopointCoinSvg size={20} />
            </div>
            <span className="brand-name">
              {brand.toLowerCase()}
              <span className="brand-dot">.</span>
            </span>
          </Link>
          <Link to="/" className="pixel-btn pixel-btn-secondary py-1.5 text-[11px] shrink-0">
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            Volver al inicio
          </Link>
        </div>
      </header>

      <main className="flex-1 min-h-0 overflow-y-auto px-3 py-4 sm:px-6 sm:py-8">
        <div className="mx-auto flex min-h-full w-full max-w-[960px] items-center">
          <div className="grid w-full items-stretch gap-5 lg:grid-cols-12 lg:gap-6">
            {/* Panel arcade izquierdo (desktop) */}
            <section
              aria-label={`Beneficios de ${brand}`}
              className="pixel-window hidden flex-col overflow-hidden lg:col-span-5 lg:flex"
            >
              <div className="window-bar">
                <span className="window-title">
                  <span className="window-led" aria-hidden="true" />
                  {isBusinessRegister ? "PORTAL NEGOCIO" : "LOOPOINT · CLIENTE"}
                </span>
                <span className="inline-flex items-center gap-1 text-[9px]">
                  <HeroCoinSvg size={13} />
                  ARCADE
                </span>
              </div>

              <div className="flex flex-1 flex-col justify-between gap-5 bg-[var(--cream)] p-6">
                <div className="space-y-4">
                  <span className="retro-kicker w-fit">
                    <Sparkles className="size-3.5" aria-hidden="true" />
                    {isBusinessRegister
                      ? "Portal para negocios"
                      : mode === "register"
                        ? "Empieza en menos de un minuto"
                        : "Tu billetera de recompensas"}
                  </span>

                  <div className="space-y-2.5">
                    <h2 className="font-['Space_Grotesk'] text-2xl font-bold leading-tight tracking-tight text-[var(--ink)] xl:text-[28px]">
                      {isBusinessRegister
                        ? "Convierte cada venta en clientes que vuelven."
                        : "Cada compra suma loopoints y te acerca a un premio."}
                    </h2>
                    <p className="text-sm leading-relaxed text-[var(--ink-muted)]">
                      {isBusinessRegister
                        ? "Configura tus reglas en pesos colombianos, controla el presupuesto de recompensas y valida canjes con QR desde cualquier celular."
                        : "Consulta tus saldos separados por negocio, revisa tus compras y canjea recompensas al instante sin tarjetas físicas."}
                    </p>
                  </div>
                </div>

                <div className="pixel-box-dark space-y-3 p-4">
                  {isBusinessRegister ? (
                    <>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span className="grid size-9 place-items-center border-2 border-[#1e1c1a] bg-[var(--gold)] text-[#1e1c1a]">
                            <TrendingUp className="size-4" aria-hidden="true" />
                          </span>
                          <div>
                            <p className="font-['DM_Mono'] text-[10px] font-bold uppercase text-[var(--ink-muted)]">
                              Resumen del programa
                            </p>
                            <p className="text-sm font-bold text-[var(--ink)]">
                              Panel operativo en vivo
                            </p>
                          </div>
                        </div>
                        <span className="item-badge-highlight">ACTIVO</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="retro-stat-chip flex-col items-start gap-1">
                          <span className="retro-stat-key">Regla sugerida</span>
                          <strong className="text-xs text-[var(--ink)]">1 PTO / $1.000</strong>
                        </div>
                        <div className="retro-stat-chip flex-col items-start gap-1">
                          <span className="retro-stat-key">Acreditación</span>
                          <strong className="text-xs text-[var(--ink)]">QR en caja</strong>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="grid size-9 place-items-center border-2 border-[var(--border-color)] bg-[#1e1c1a]">
                            <HeroCoinSvg size={18} />
                          </div>
                          <div>
                            <p className="font-['DM_Mono'] text-[10px] font-bold uppercase text-[var(--ink-muted)]">
                              Saldo disponible
                            </p>
                            <p className="font-['Space_Grotesk'] text-lg font-bold tabular-nums text-[var(--ink)]">
                              1.250 loopoints
                            </p>
                          </div>
                        </div>
                        <span className="item-badge-highlight">72% META</span>
                      </div>
                      <div className="retro-progress">
                        <span style={{ width: "72%" }} />
                      </div>
                      <div className="flex items-center justify-between font-['DM_Mono'] text-[11px] font-bold text-[var(--ink-muted)]">
                        <span>Próximo premio: Café gratis</span>
                        <span className="text-[var(--ink)] dark:text-[var(--green-bright)]">
                          2.000 PTS
                        </span>
                      </div>
                    </>
                  )}
                </div>

                <ul className="space-y-2.5 text-xs text-[var(--ink-muted)]">
                  <li className="flex items-center gap-2.5">
                    <span className="grid size-7 shrink-0 place-items-center border-2 border-[var(--border-color)] bg-[var(--paper-deep)] text-[var(--blue)]">
                      <QrCode className="size-3.5" aria-hidden="true" />
                    </span>
                    <span>
                      Escanea códigos QR de venta o canje directamente desde tu navegador.
                    </span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="grid size-7 shrink-0 place-items-center border-2 border-[var(--border-color)] bg-[var(--paper-deep)] text-[var(--red)]">
                      <Gift className="size-3.5" aria-hidden="true" />
                    </span>
                    <span>Tus saldos de cada comercio se mantienen ordenados y separados.</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="grid size-7 shrink-0 place-items-center border-2 border-[var(--border-color)] bg-[var(--paper-deep)] text-[var(--green)]">
                      <ShieldCheck className="size-3.5" aria-hidden="true" />
                    </span>
                    <span>
                      Acceso seguro con Google o correo, compatible con gestores de claves.
                    </span>
                  </li>
                </ul>
              </div>
            </section>

            {/* Formulario principal derecho */}
            <section className="flex items-center justify-center lg:col-span-7">
              <div className="w-full max-w-[460px] space-y-3.5">
                <div className="pixel-box p-4 sm:p-6">
                  <div
                    role="tablist"
                    aria-label="Modo de acceso"
                    className="store-tabs-bar login-tabs-bar"
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
                      className={cn("store-tab-btn", mode === "login" && "active")}
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
                      className={cn("store-tab-btn", mode === "register" && "active")}
                    >
                      Registro
                    </button>
                  </div>

                  <div
                    id="auth-tabpanel"
                    role="tabpanel"
                    aria-labelledby={mode === "login" ? "tab-login" : "tab-register"}
                  >
                    <div className="mb-5 space-y-2">
                      <span className="retro-kicker">
                        {hasInvite
                          ? "Invitación por código QR"
                          : mode === "login"
                            ? "Acceso a tu cuenta"
                            : accountType === "admin"
                              ? "Registro de administrador"
                              : "Registro de cliente"}
                      </span>
                      <h1 className="font-['Space_Grotesk'] text-2xl font-bold tracking-tight text-[var(--ink)] sm:text-[26px]">
                        {hasInvite
                          ? mode === "login"
                            ? "Inicia sesión para unirte"
                            : "Crea tu cuenta para unirte"
                          : mode === "login"
                            ? "Entra a tus loopoints"
                            : "Crea tu cuenta"}
                      </h1>
                      <p className="text-sm leading-relaxed text-[var(--ink-muted)]">
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

                    <div className="space-y-4">
                      {hasInvite && (
                        <>
                          {invitePreviewLoading ? (
                            <Alert className="retro-alert bg-[var(--paper-deep)]">
                              <AlertTitle>Verificando invitación…</AlertTitle>
                              <AlertDescription>
                                Estamos consultando los datos del negocio y tu rol asignado.
                              </AlertDescription>
                            </Alert>
                          ) : inviteUnavailableReason ? (
                            <Alert variant="destructive" className="retro-alert">
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
                            <div className="pixel-box-dark space-y-2 p-3.5 text-sm">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="font-bold text-[var(--ink)]">
                                  {invitePreview.business_name}
                                </span>
                                <Badge
                                  variant="secondary"
                                  className="rounded-none border-2 border-[var(--border-color)] bg-[var(--gold)] text-[#1e1c1a]"
                                >
                                  Rol: {inviteRoleText}
                                </Badge>
                              </div>
                              <p className="text-xs text-[var(--ink-muted)]">
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
                        <Alert variant="warning" className="retro-alert">
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
                          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--red)]"
                        >
                          <Alert variant="destructive" className="retro-alert">
                            <AlertTitle>No se pudo continuar</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                          </Alert>
                        </div>
                      )}

                      {notice && (
                        <Alert variant="success" className="retro-alert">
                          <AlertTitle>Cuenta creada</AlertTitle>
                          <AlertDescription>{notice}</AlertDescription>
                        </Alert>
                      )}

                      {mode === "register" && !hasInvite && (
                        <div className="space-y-2" role="radiogroup" aria-label="Tipo de cuenta">
                          <span className="form-label block">Tipo de cuenta</span>
                          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                            <button
                              ref={customerRadioRef}
                              type="button"
                              role="radio"
                              aria-checked={accountType === "customer"}
                              tabIndex={accountType === "customer" ? 0 : -1}
                              onClick={() => handleSelectAccountType("customer")}
                              onKeyDown={(event) => handleRadioKeyDown(event, "customer")}
                              className={cn(
                                "relative flex cursor-pointer flex-col gap-1.5 border-[3px] border-[var(--border-color)] p-3 text-left transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue)]",
                                accountType === "customer"
                                  ? "bg-[color-mix(in_srgb,var(--green)_15%,var(--cream))] text-[var(--ink)] shadow-[4px_4px_0_var(--shadow-color)]"
                                  : "bg-[var(--paper-deep)] text-[var(--ink)] shadow-[2px_2px_0_var(--shadow-color)] hover:bg-[var(--cream-alt)]",
                              )}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span
                                  className={cn(
                                    "grid size-8 place-items-center border-2 border-[var(--border-color)]",
                                    accountType === "customer"
                                      ? "bg-[var(--green)] text-white"
                                      : "bg-[var(--cream)] text-[var(--ink-muted)]",
                                  )}
                                >
                                  <UserRound className="size-4" aria-hidden="true" />
                                </span>
                                {accountType === "customer" && (
                                  <span className="grid size-5 place-items-center border-2 border-[var(--border-color)] bg-[var(--green)] text-white">
                                    <Check className="size-3" aria-hidden="true" />
                                  </span>
                                )}
                              </div>
                              <span className="font-['Space_Grotesk'] text-sm font-bold">
                                Cliente
                              </span>
                              <span className="text-xs leading-snug text-[var(--ink-muted)]">
                                Acumula loopoints y canjea premios
                              </span>
                            </button>

                            <button
                              ref={adminRadioRef}
                              type="button"
                              role="radio"
                              aria-checked={accountType === "admin"}
                              tabIndex={accountType === "admin" ? 0 : -1}
                              onClick={() => handleSelectAccountType("admin")}
                              onKeyDown={(event) => handleRadioKeyDown(event, "admin")}
                              className={cn(
                                "relative flex cursor-pointer flex-col gap-1.5 border-[3px] border-[var(--border-color)] p-3 text-left transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue)]",
                                accountType === "admin"
                                  ? "bg-[color-mix(in_srgb,var(--gold)_28%,var(--cream))] dark:bg-[color-mix(in_srgb,var(--gold)_15%,var(--cream))] text-[var(--ink)] shadow-[4px_4px_0_var(--shadow-color)]"
                                  : "bg-[var(--paper-deep)] text-[var(--ink)] shadow-[2px_2px_0_var(--shadow-color)] hover:bg-[var(--cream-alt)]",
                              )}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span
                                  className={cn(
                                    "grid size-8 place-items-center border-2 border-[var(--border-color)]",
                                    accountType === "admin"
                                      ? "bg-[var(--gold)] text-[#1e1c1a]"
                                      : "bg-[var(--cream)] text-[var(--ink-muted)]",
                                  )}
                                >
                                  <Building2 className="size-4" aria-hidden="true" />
                                </span>
                                {accountType === "admin" && (
                                  <span className="grid size-5 place-items-center border-2 border-[#1e1c1a] bg-[var(--gold)] text-[#1e1c1a]">
                                    <Check className="size-3" aria-hidden="true" />
                                  </span>
                                )}
                              </div>
                              <span className="font-['Space_Grotesk'] text-sm font-bold">
                                Administrador
                              </span>
                              <span className="text-xs leading-snug text-[var(--ink-muted)]">
                                Registra y administra tu negocio
                              </span>
                            </button>
                          </div>
                        </div>
                      )}

                      <button
                        type="button"
                        className="pixel-btn pixel-btn-secondary w-full py-2.5"
                        onClick={handleGoogle}
                        disabled={submitting || loading || inviteBlocked || invitePreviewLoading}
                      >
                        {submitting ? (
                          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                        ) : (
                          <GoogleIcon />
                        )}
                        Continuar con Google
                      </button>

                      <div className="relative flex items-center gap-3">
                        <div className="flex-1 border-t-2 border-dashed border-[var(--dash-line)]" />
                        <span className="font-['DM_Mono'] text-[11px] font-bold uppercase tracking-wider text-[var(--ink-muted)]">
                          o con tu correo
                        </span>
                        <div className="flex-1 border-t-2 border-dashed border-[var(--dash-line)]" />
                      </div>

                      <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
                        {mode === "register" && (
                          <div className="form-field">
                            <Label htmlFor="full-name" className="form-label">
                              Nombre
                            </Label>
                            <Input
                              id="full-name"
                              name="name"
                              autoComplete="name"
                              className="form-input"
                              value={fullName}
                              onChange={(event) => {
                                setFullName(event.target.value);
                                if (fieldErrors.fullName) {
                                  setFieldErrors((current) => ({
                                    ...current,
                                    fullName: undefined,
                                  }));
                                }
                              }}
                              onBlur={() => {
                                const msg = validateField("fullName", fullName);
                                if (msg)
                                  setFieldErrors((current) => ({ ...current, fullName: msg }));
                              }}
                              placeholder={
                                accountType === "admin" ? "Nombre del administrador" : "Tu nombre"
                              }
                              aria-invalid={Boolean(fieldErrors.fullName)}
                              aria-describedby={
                                fieldErrors.fullName ? "full-name-error" : undefined
                              }
                              required
                            />
                            {fieldErrors.fullName && (
                              <p
                                id="full-name-error"
                                aria-live="polite"
                                className="text-xs font-semibold text-[var(--red-dark)] dark:text-red-400"
                              >
                                {fieldErrors.fullName}
                              </p>
                            )}
                          </div>
                        )}

                        {mode === "register" && accountType === "admin" && !hasInvite && (
                          <div className="form-field animate-fade-in">
                            <Label htmlFor="business-name" className="form-label">
                              Nombre del negocio
                            </Label>
                            <Input
                              id="business-name"
                              name="businessName"
                              autoComplete="organization"
                              className="form-input"
                              value={businessName}
                              onChange={(event) => {
                                setBusinessName(event.target.value);
                                if (fieldErrors.businessName) {
                                  setFieldErrors((current) => ({
                                    ...current,
                                    businessName: undefined,
                                  }));
                                }
                              }}
                              onBlur={() => {
                                const msg = validateField("businessName", businessName);
                                if (msg)
                                  setFieldErrors((current) => ({ ...current, businessName: msg }));
                              }}
                              placeholder="Ej. Taquería El Fogón"
                              aria-invalid={Boolean(fieldErrors.businessName)}
                              aria-describedby={
                                fieldErrors.businessName ? "business-name-error" : undefined
                              }
                              required
                            />
                            {fieldErrors.businessName && (
                              <p
                                id="business-name-error"
                                aria-live="polite"
                                className="text-xs font-semibold text-[var(--red-dark)] dark:text-red-400"
                              >
                                {fieldErrors.businessName}
                              </p>
                            )}
                          </div>
                        )}

                        <div className="form-field">
                          <Label htmlFor="email" className="form-label">
                            Correo
                          </Label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            inputMode="email"
                            autoComplete="email"
                            className="form-input"
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
                              className="text-xs font-semibold text-[var(--red-dark)] dark:text-red-400"
                            >
                              {fieldErrors.email}
                            </p>
                          )}
                        </div>

                        <div className="form-field">
                          <Label htmlFor="password" className="form-label">
                            Contraseña
                          </Label>
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
                                  setFieldErrors((current) => ({
                                    ...current,
                                    password: undefined,
                                  }));
                                }
                              }}
                              onBlur={() => {
                                const msg = validateField("password", password);
                                if (msg)
                                  setFieldErrors((current) => ({ ...current, password: msg }));
                              }}
                              placeholder="Mínimo 6 caracteres"
                              minLength={6}
                              className="form-input form-input-with-trailing"
                              aria-invalid={Boolean(fieldErrors.password)}
                              aria-describedby={fieldErrors.password ? "password-error" : undefined}
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword((current) => !current)}
                              aria-label={
                                showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                              }
                              aria-pressed={showPassword}
                              className="absolute right-1 top-1/2 grid size-11 -translate-y-1/2 cursor-pointer place-items-center text-[var(--ink-muted)] transition-colors hover:bg-[var(--paper-deep)] hover:text-[var(--ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--red)]"
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
                              className="text-xs font-semibold text-[var(--red-dark)] dark:text-red-400"
                            >
                              {fieldErrors.password}
                            </p>
                          )}
                        </div>

                        <button
                          type="submit"
                          className="pixel-btn pixel-btn-dark w-full py-3"
                          disabled={submitting || inviteBlocked || invitePreviewLoading}
                          aria-busy={submitting || undefined}
                        >
                          {submitting ? (
                            <>
                              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                              <span>Procesando…</span>
                            </>
                          ) : mode === "login" ? (
                            "Entrar con correo"
                          ) : !hasInvite && accountType === "admin" ? (
                            "Crear cuenta de administrador"
                          ) : (
                            "Crear cuenta"
                          )}
                        </button>
                      </form>

                      <p className="text-center text-sm text-[var(--ink-muted)]">
                        {mode === "login" ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}{" "}
                        <button
                          type="button"
                          className="cursor-pointer font-bold text-[var(--red-dark)] underline underline-offset-4 hover:text-[var(--red)] dark:text-[var(--gold)] dark:hover:text-[#ffe08a]"
                          onClick={() => switchMode(mode === "login" ? "register" : "login")}
                        >
                          {mode === "login" ? "Regístrate" : "Inicia sesión"}
                        </button>
                      </p>
                    </div>
                  </div>
                </div>

                <p className="px-2 text-center text-xs leading-relaxed text-[var(--ink-muted)]">
                  {brand} · {brandTagline}. Al entrar aceptas que guardemos tu nombre y correo para
                  asociar tus compras. No pedimos datos de tarjetas.
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
