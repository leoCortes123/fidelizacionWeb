import { persistBusinessSelection } from "@/features/loyalty/businessContext";
import { defaultPathForRoles } from "./config";
import { rpc } from "./supabase";

interface BusinessSummary {
  id: string;
  role?: "admin" | "encargado" | "cliente";
}

/**
 * Destino tras iniciar sesión desde el portal web.
 * - Consulta siempre las membresías reales del usuario (`businesses_list`) para
 *   no depender solo de roles legacy ni dejar seleccionado un negocio donde el
 *   usuario es cliente cuando en otro es administrador o encargado.
 * - Un administrador o encargado con varios negocios operativos va al selector;
 *   si tiene uno, persiste ese negocio y entra directo a su inicio.
 * - Un usuario con rol exclusivamente cliente va a `/customer`.
 */
export async function resolvePostLoginPath(
  roles: string[],
  userId?: string | null,
): Promise<string> {
  const fallback = defaultPathForRoles(roles);
  const hasAdminRole = roles.includes("admin");
  const hasRegistrarRole = roles.includes("registrar") || roles.includes("encargado");

  try {
    const businesses = await rpc<BusinessSummary[]>("businesses_list");
    if (Array.isArray(businesses)) {
      const adminBusinesses = businesses.filter((b) => b.role === "admin");
      const encargadoBusinesses = businesses.filter((b) => b.role === "encargado");
      const staffBusinesses = [...adminBusinesses, ...encargadoBusinesses];

      if (staffBusinesses.length > 1) {
        return "/business/select";
      }
      if (adminBusinesses.length === 1) {
        if (userId) persistBusinessSelection(userId, adminBusinesses[0].id);
        return "/admin/dashboard";
      }
      if (encargadoBusinesses.length === 1) {
        if (userId) persistBusinessSelection(userId, encargadoBusinesses[0].id);
        return "/encargado";
      }
      if (staffBusinesses.length === 0 && hasAdminRole) {
        return "/admin/onboarding";
      }
      if (staffBusinesses.length === 0 && hasRegistrarRole) {
        return "/encargado";
      }
      return "/customer";
    }
  } catch {
    // Si falla la consulta, el portal por roles sigue siendo un destino seguro.
  }
  return fallback;
}
