import { defaultPathForRoles } from './config';
import { rpc } from './supabase';

interface BusinessSummary {
  id: string;
}

/**
 * Destino tras iniciar sesión. Si la cuenta participa en algún negocio se abre
 * el selector (que ya conoce el rol por negocio); si no, se cae al portal que
 * corresponda a sus roles globales.
 */
export async function resolvePostLoginPath(roles: string[]): Promise<string> {
  const fallback = defaultPathForRoles(roles);
  try {
    const businesses = await rpc<BusinessSummary[]>('businesses_list');
    if (Array.isArray(businesses) && businesses.length > 0) {
      return '/business/select';
    }
  } catch {
    // Si falla la consulta, el portal por roles sigue siendo un destino seguro.
  }
  return fallback;
}
