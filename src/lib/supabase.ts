import { createClient } from '@supabase/supabase-js';
import { supabaseAnonKey, supabaseUrl } from './config';

/**
 * Supabase no aplica timeout a sus peticiones. Si el backend alojado se queda
 * colgado (algo que ocurre de forma intermitente), el `await` no termina nunca
 * y la interfaz muestra un spinner infinito. Abortamos la petición para que el
 * error llegue a la UI y el usuario pueda reintentar.
 */
const REQUEST_TIMEOUT_MS = 15_000;

const TIMEOUT_MESSAGE =
  'La conexión con el servidor tardó demasiado. Revisa tu conexión e inténtalo de nuevo.';

export const fetchWithTimeout: typeof fetch = async (input, init) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort(new DOMException(TIMEOUT_MESSAGE, 'TimeoutError'));
  }, REQUEST_TIMEOUT_MS);

  // Respeta las cancelaciones que haga Supabase (p. ej. al desmontar).
  const externalSignal = init?.signal;
  const abortFromExternal = () => controller.abort(externalSignal?.reason);
  if (externalSignal) {
    if (externalSignal.aborted) abortFromExternal();
    else externalSignal.addEventListener('abort', abortFromExternal, { once: true });
  }

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
    externalSignal?.removeEventListener('abort', abortFromExternal);
  }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: { fetch: fetchWithTimeout },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
});

export async function rpc<T>(
  functionName: string,
  args: Record<string, unknown> = {},
): Promise<T> {
  const { data, error } = await supabase.rpc(functionName, args);
  if (error) throw error;
  return data as T;
}
