import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Brand } from "@/components/shared/Brand";
import { FullPageLoader } from "@/components/shared/States";
import { usePortalTheme } from "@/components/theme/ThemeProvider";
import { LegalFooterLinks } from "@/features/legal/LegalFooterLinks";
import { errorMessage } from "@/lib/errors";
import { useAuth } from "./AuthProvider";

export function ResetPasswordPage() {
  usePortalTheme("customer");
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { session, loading, updatePassword } = useAuth();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const linkError =
    params.get("error_description") ||
    params.get("error") ||
    hashParams.get("error_description") ||
    hashParams.get("error");

  if (loading) {
    return <FullPageLoader label="Verificando enlace de recuperación…" />;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setSubmitting(true);
    try {
      await updatePassword(password);
      setDone(true);
    } catch (submitError) {
      setError(errorMessage(submitError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="hero-glow flex min-h-dvh flex-col justify-between px-4 py-8">
      <div className="mx-auto w-full max-w-md space-y-6">
        <div className="flex justify-center">
          <Brand />
        </div>

        <div className="retro-card border-[3px] border-[var(--border-color)] bg-[var(--paper)] p-6 shadow-[6px_6px_0_var(--shadow-color)]">
          {linkError || (!session && !done) ? (
            <div className="space-y-4">
              <Alert variant="warning" className="retro-alert">
                <AlertTitle>El enlace de recuperación venció o no es válido</AlertTitle>
                <AlertDescription>
                  {linkError
                    ? errorMessage(linkError)
                    : "Solicita un nuevo correo de recuperación desde el inicio de sesión."}
                </AlertDescription>
              </Alert>
              <Button asChild className="w-full">
                <Link to="/login">Volver a iniciar sesión</Link>
              </Button>
            </div>
          ) : done ? (
            <div className="space-y-4">
              <Alert variant="success" className="retro-alert">
                <CheckCircle2 className="size-4" aria-hidden="true" />
                <AlertTitle>Contraseña actualizada</AlertTitle>
                <AlertDescription>
                  Tu nueva contraseña ya quedó guardada. Puedes continuar usando Fideliapp.
                </AlertDescription>
              </Alert>
              <Button
                type="button"
                className="w-full"
                onClick={() => navigate("/", { replace: true })}
              >
                Continuar a Fideliapp
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="space-y-1">
                <h1 className="flex items-center gap-2 font-display text-xl font-bold text-[var(--ink)]">
                  <KeyRound className="size-5" aria-hidden="true" />
                  Restablecer contraseña
                </h1>
                <p className="text-sm text-[var(--ink-muted)]">
                  Elige una nueva contraseña de al menos 6 caracteres para tu cuenta.
                </p>
              </div>

              {error && (
                <Alert variant="destructive" className="retro-alert">
                  <AlertTitle>No se pudo actualizar la contraseña</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="form-field">
                <Label htmlFor="reset-password" className="form-label">
                  Nueva contraseña
                </Label>
                <div className="relative">
                  <Input
                    id="reset-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    minLength={6}
                    className="pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    aria-pressed={showPassword}
                    className="absolute right-0.5 top-1/2 grid size-11 -translate-y-1/2 cursor-pointer place-items-center text-[var(--ink-muted)] transition-colors hover:bg-[var(--paper-deep)] hover:text-[var(--ink)] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] md:size-8 [@media(pointer:coarse)]:size-11"
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" aria-hidden="true" />
                    ) : (
                      <Eye className="size-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              <div className="form-field">
                <Label htmlFor="reset-password-confirm" className="form-label">
                  Confirmar contraseña
                </Label>
                <Input
                  id="reset-password-confirm"
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Repite tu nueva contraseña"
                  minLength={6}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />}
                Guardar nueva contraseña
              </Button>
            </form>
          )}
        </div>
      </div>

      <LegalFooterLinks variant="customer" />
    </div>
  );
}
