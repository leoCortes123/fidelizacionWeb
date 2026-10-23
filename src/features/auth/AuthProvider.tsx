import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase, rpc } from '@/lib/supabase';
import { oauthRedirectUrl } from '@/lib/config';
import type { AppRole } from '@/types';

interface AuthContextValue {
  session: Session | null;
  user: Session['user'] | null;
  roles: AppRole[];
  loading: boolean;
  rolesLoading: boolean;
  rolesLoaded: boolean;
  rolesError: unknown;
  displayName: string;
  signInWithGoogle: (nextPath?: string) => Promise<void>;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signUpWithPassword: (params: {
    email: string;
    password: string;
    fullName: string;
  }) => Promise<{ needsConfirmation: boolean }>;
  signOut: () => Promise<void>;
  refreshRoles: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Red de seguridad: ninguna espera de autenticación debe dejar la app en un
 * spinner permanente. Si Supabase no responde, se resuelve con error.
 */
const SESSION_TIMEOUT_MS = 20_000;

function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  message: string,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

function nameFromSession(session: Session | null): string {
  if (!session?.user) return '';
  const metadata = session.user.user_metadata ?? {};
  return (
    (metadata.full_name as string | undefined)?.trim() ||
    (metadata.name as string | undefined)?.trim() ||
    session.user.email ||
    ''
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [rolesLoaded, setRolesLoaded] = useState(false);
  const [rolesError, setRolesError] = useState<unknown>(null);

  useEffect(() => {
    let active = true;

    withTimeout(
      supabase.auth.getSession(),
      SESSION_TIMEOUT_MS,
      'No se pudo recuperar la sesión. Revisa tu conexión e inténtalo de nuevo.',
    )
      .then(({ data }) => {
        if (!active) return;
        setSession(data.session ?? null);
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setSession(null);
        setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession ?? null);
      setLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const loadRoles = useCallback(async (currentSession: Session | null) => {
    if (!currentSession) {
      setRoles([]);
      setRolesError(null);
      setRolesLoading(false);
      setRolesLoaded(true);
      return;
    }
    setRolesLoading(true);
    setRolesLoaded(false);
    setRolesError(null);
    try {
      const data = await rpc<AppRole[]>('get_my_roles');
      setRoles(Array.isArray(data) ? data : []);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('No se pudieron cargar los roles', error);
      }
      setRoles([]);
      setRolesError(error);
    } finally {
      setRolesLoading(false);
      setRolesLoaded(true);
    }
  }, []);

  // Al cambiar de cuenta no se debe reutilizar el rol anterior mientras se
  // consultan los roles del nuevo usuario.
  useEffect(() => {
    if (loading) return;
    setRoles([]);
    setRolesError(null);
    if (!session) {
      setRolesLoaded(true);
      return;
    }
    setRolesLoaded(false);
  }, [loading, session?.user.id]);

  useEffect(() => {
    if (loading) return;
    void loadRoles(session);
  }, [loading, session, loadRoles]);

  const refreshRoles = useCallback(async () => {
    await loadRoles(session);
  }, [loadRoles, session]);

  const signInWithGoogle = useCallback(async (nextPath?: string) => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: oauthRedirectUrl(nextPath),
        queryParams: { prompt: 'select_account' },
      },
    });
    if (error) throw error;
  }, []);

  const signInWithPassword = useCallback(
    async (email: string, password: string) => {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;
    },
    [],
  );

  const signUpWithPassword = useCallback(
    async ({
      email,
      password,
      fullName,
    }: {
      email: string;
      password: string;
      fullName: string;
    }) => {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { full_name: fullName.trim() },
        },
      });
      if (error) throw error;
      // Con la confirmación por correo desactivada Supabase devuelve sesión.
      return { needsConfirmation: !data.session };
    },
    [],
  );

  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      // Si el servidor no responde, al menos se limpia la sesión local.
      if (error) await supabase.auth.signOut({ scope: 'local' });
    } catch {
      await supabase.auth.signOut({ scope: 'local' }).catch(() => undefined);
    } finally {
      setSession(null);
      setRoles([]);
      setRolesLoaded(true);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      roles,
      loading,
      rolesLoading,
      rolesLoaded,
      rolesError,
      displayName: nameFromSession(session),
      signInWithGoogle,
      signInWithPassword,
      signUpWithPassword,
      signOut,
      refreshRoles,
    }),
    [
      session,
      roles,
      loading,
      rolesLoading,
      rolesLoaded,
      rolesError,
      signInWithGoogle,
      signInWithPassword,
      signUpWithPassword,
      signOut,
      refreshRoles,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}
