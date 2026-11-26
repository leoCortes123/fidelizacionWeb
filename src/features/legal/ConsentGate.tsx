import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Brand } from "@/components/shared/Brand";
import { ErrorState, FullPageLoader } from "@/components/shared/States";
import { SignOutButton } from "@/components/shared/SignOutButton";
import { useLegalConsentStatus } from "./hooks";

export function ConsentGate({ children }: { children: ReactNode }) {
  const location = useLocation();
  const status = useLegalConsentStatus();

  if (status.isLoading) {
    return <FullPageLoader label="Verificando términos legales…" />;
  }

  if (status.isError) {
    return (
      <div className="hero-glow grid min-h-screen place-items-center p-6">
        <div className="w-full max-w-md space-y-4">
          <div className="flex justify-center">
            <Brand />
          </div>
          <ErrorState
            title="No pudimos verificar tus consentimientos legales"
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

  if (status.data?.has_pending) {
    const next = `${location.pathname}${location.search}`;
    return <Navigate to={`/aceptar-terminos?next=${encodeURIComponent(next)}`} replace />;
  }

  return <>{children}</>;
}
