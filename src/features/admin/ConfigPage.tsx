import { Navigate, useSearchParams } from "react-router-dom";

/**
 * Redirección de compatibilidad desde `/admin/config` hacia la nueva organización:
 * - Carta (`/admin/products`), Recompensas (`/admin/rewards`) y Equipo (`/admin/members`) en menú lateral.
 * - Negocio, Programa y Económico en Perfil (`/admin/perfil?tab=...`).
 * - Onboarding en `/admin/onboarding`.
 */
export function ConfigPage() {
  const [searchParams] = useSearchParams();
  if (searchParams.get("onboarding") === "1") {
    return <Navigate to="/admin/onboarding" replace />;
  }
  const tab = searchParams.get("tab") ?? "negocio";
  if (tab === "carta") return <Navigate to="/admin/products" replace />;
  if (tab === "recompensas") return <Navigate to="/admin/rewards" replace />;
  if (tab === "equipo") return <Navigate to="/admin/members" replace />;
  if (tab === "programa") return <Navigate to="/admin/perfil?tab=programa" replace />;
  if (tab === "economico") return <Navigate to="/admin/perfil?tab=economico" replace />;
  return <Navigate to="/admin/perfil?tab=negocio" replace />;
}
