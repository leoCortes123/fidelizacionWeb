import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { Brand } from "@/components/shared/Brand";
import { SignOutButton } from "@/components/shared/SignOutButton";
import { ErrorState, FullPageLoader } from "@/components/shared/States";
import { ThemeToggleButton } from "@/components/theme/ThemeToggleButton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LEGAL_URLS } from "@/config/legal.config";
import { useAuth } from "@/features/auth/AuthProvider";
import { isNextPathCompatibleWithRoles, safeNextPath } from "@/lib/config";
import { errorMessage } from "@/lib/errors";
import { clearPendingClaim, pendingClaimPath } from "@/lib/pendingClaim";
import { resolvePostLoginPath } from "@/lib/postLogin";
import { useLegalConsent } from "./hooks";
import { LegalConsentCheckbox, LegalExternalLink } from "./LegalConsentCheckbox";
import { LegalFooterLinks } from "./LegalFooterLinks";

export function AcceptTermsPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user, roles, rolesLoading, rolesLoaded } = useAuth();
  const { status, recordConsent, isRecording } = useLegalConsent();

  const nextParam = params.get("next");
  const next = nextParam ? safeNextPath(nextParam) : null;

  const [acceptedBase, setAcceptedBase] = useState(false);
  const [acceptedBusiness, setAcceptedBusiness] = useState(false);
  const [acceptedAuthority, setAcceptedAuthority] = useState(false);
  const [baseError, setBaseError] = useState<string | undefined>();
  const [businessError, setBusinessError] = useState<string | undefined>();
  const [authorityError, setAuthorityError] = useState<string | undefined>();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const goToDestination = useCallback(async () => {
    if (!user) return;
    if (
      next &&
      !next.startsWith("/aceptar-terminos") &&
      isNextPathCompatibleWithRoles(next, roles)
    ) {
      if (!next.startsWith("/claim/")) {
        clearPendingClaim();
      }
      navigate(next, { replace: true });
      return;
    }
    const pendingClaim = pendingClaimPath();
    if (pendingClaim) {
      navigate(pendingClaim, { replace: true });
      return;
    }
    clearPendingClaim();
    const destination = await resolvePostLoginPath(roles, user.id);
    navigate(destination, { replace: true });
  }, [user, next, roles, navigate]);

  useEffect(() => {
    if (rolesLoading || !rolesLoaded) return;
    if (status.isSuccess && !status.data.has_pending) {
      void goToDestination();
    }
  }, [rolesLoading, rolesLoaded, status.isSuccess, status.data?.has_pending, goToDestination]);

  if (status.isLoading || rolesLoading || !rolesLoaded) {
    return <FullPageLoader label="Cargando documentos legales…" />;
  }

  if (status.isError) {
    return (
      <div className="hero-glow grid min-h-screen place-items-center p-6">
        <div className="w-full max-w-md space-y-4">
          <div className="flex justify-center">
            <Brand />
          </div>
          <ErrorState
            title="No pudimos cargar tu estado legal"
            error={status.error}
            onRetry={() => void status.refetch()}
          />
          <div className="flex justify-center">
            <SignOutButton variant="outline" size="sm" />
          </div>
        </div>
      </div>
    );
  }

  if (!status.data?.has_pending) {
    return <FullPageLoader label="Redirigiendo…" />;
  }

  const pending = status.data.pending_documents;
  const needsBase = pending.includes("terms_customer") || pending.includes("privacy_policy");
  const needsBusiness = pending.includes("terms_business") || pending.includes("dpa");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitError(null);
    setBaseError(undefined);
    setBusinessError(undefined);
    setAuthorityError(undefined);

    let hasErrors = false;
    if (needsBase && !acceptedBase) {
      setBaseError("Debes aceptar los Términos de uso y la Política de Tratamiento de Datos.");
      hasErrors = true;
    }
    if (needsBusiness && !acceptedBusiness) {
      setBusinessError(
        "Debes aceptar los Términos para Negocios y el Acuerdo de Transmisión de Datos (DPA).",
      );
      hasErrors = true;
    }
    if (needsBusiness && !acceptedAuthority) {
      setAuthorityError("Confirma que tienes facultad para representar al comercio.");
      hasErrors = true;
    }
    if (hasErrors) return;

    try {
      await recordConsent({
        documents: pending,
        businessId: null,
        sourceRoute: "/aceptar-terminos",
      });
      await goToDestination();
    } catch (caught) {
      setSubmitError(errorMessage(caught));
    }
  }

  return (
    <div className="hero-glow min-h-dvh px-4 py-6 sm:py-12">
      <div className="mx-auto flex w-full max-w-lg flex-col gap-5">
        <div className="flex items-center justify-between gap-3">
          <Brand compact />
          <div className="flex items-center gap-2">
            <ThemeToggleButton variant="shell" />
            <SignOutButton variant="outline" size="sm" />
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="mb-1 flex items-center gap-2 text-primary">
              <ShieldCheck className="size-5" aria-hidden="true" />
              <span className="font-mono text-xs font-bold uppercase tracking-wider">
                Consentimiento requerido
              </span>
            </div>
            <CardTitle>Acepta los documentos legales vigentes</CardTitle>
            <CardDescription>
              Para continuar usando Fideliapp necesitamos tu aceptación expresa de los documentos
              legales actualizados.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4" noValidate>
              {submitError && (
                <Alert variant="destructive">
                  <AlertTitle>No pudimos registrar tu aceptación</AlertTitle>
                  <AlertDescription>{submitError}</AlertDescription>
                </Alert>
              )}

              {needsBase && (
                <LegalConsentCheckbox
                  id="accept-terms-base"
                  checked={acceptedBase}
                  onCheckedChange={(checked) => {
                    setAcceptedBase(checked);
                    if (checked) setBaseError(undefined);
                  }}
                  error={baseError}
                  disabled={isRecording}
                  label={
                    <>
                      Acepto los{" "}
                      <LegalExternalLink href={LEGAL_URLS.termsCustomer}>
                        Términos de uso
                      </LegalExternalLink>{" "}
                      y la{" "}
                      <LegalExternalLink href={LEGAL_URLS.privacyPolicy}>
                        Política de Tratamiento de Datos
                      </LegalExternalLink>
                      , incluida la transferencia internacional de datos necesaria para operar el
                      servicio.
                    </>
                  }
                />
              )}

              {needsBusiness && (
                <>
                  <LegalConsentCheckbox
                    id="accept-terms-business"
                    checked={acceptedBusiness}
                    onCheckedChange={(checked) => {
                      setAcceptedBusiness(checked);
                      if (checked) setBusinessError(undefined);
                    }}
                    error={businessError}
                    disabled={isRecording}
                    label={
                      <>
                        Acepto los{" "}
                        <LegalExternalLink href={LEGAL_URLS.termsBusiness}>
                          Términos para Negocios
                        </LegalExternalLink>{" "}
                        y el{" "}
                        <LegalExternalLink href={LEGAL_URLS.dpa}>
                          Acuerdo de Transmisión de Datos (DPA)
                        </LegalExternalLink>
                        .
                      </>
                    }
                  />
                  <LegalConsentCheckbox
                    id="accept-terms-authority"
                    checked={acceptedAuthority}
                    onCheckedChange={(checked) => {
                      setAcceptedAuthority(checked);
                      if (checked) setAuthorityError(undefined);
                    }}
                    error={authorityError}
                    disabled={isRecording}
                    label="Declaro que tengo facultad legal para representar al comercio y aceptar estos acuerdos en su nombre."
                  />
                </>
              )}

              <Button type="submit" className="w-full" size="lg" loading={isRecording}>
                Aceptar y continuar
              </Button>
            </form>
          </CardContent>
        </Card>

        <LegalFooterLinks variant={needsBusiness ? "business" : "customer"} />
      </div>
    </div>
  );
}
