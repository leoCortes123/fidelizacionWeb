import { defaultPathForRoles } from "./config";
import { rpc } from "./supabase";

interface BusinessSummary {
  id: string;
  role?: "admin" | "encargado" | "cliente";
}

/**
 * Destino tras iniciar sesión desde el portal web.
 * - Un usuario cliente va siempre a su página de inicio (`/customer`).
 * - Un administrador o encargado con varios negocios va al selector; si no,
 *   cae al portal que corresponda a su rol.
 */
export async function resolvePostLoginPath(roles: string[]): Promise<string> {
  const fallback = defaultPathForRoles(roles);
  if (!roles.includes("admin") && !roles.includes("registrar")) {
    return fallback;
  }
  try {
    const businesses = await rpc<BusinessSummary[]>("businesses_list");
    const staffBusinesses = Array.isArray(businesses)
      ? businesses.filter((b) => b.role === "admin" || b.role === "encargado")
      : [];
    if (Array.isArray(businesses) && staffBusinesses.length === 0 && roles.includes("admin")) {
      return "/business/register";
    }
    if (staffBusinesses.length > 1) {
      return "/business/select";
    }
  } catch {
    // Si falla la consulta, el portal por roles sigue siendo un destino seguro.
  }
  return fallback;
}
