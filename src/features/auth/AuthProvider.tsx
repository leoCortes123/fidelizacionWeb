import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { queryClient } from "@/app/queryClient";
import { supabase, rpc } from "@/lib/supabase";
import { oauthRedirectUrl } from "@/lib/config";
import type { AppRole } from "@/types";

interface AuthContextValue {
  session: Session | null;
  user: Session["user"] | null;
  roles: AppRole[];
  loading: boolean;
  rolesLoading: boolean;
  rolesLoaded: boolean;
  rolesError: unknown;
  displayName: string;
  signInWithGoogle: (nextPath?: string, accountType?: "customer" | "admin") => Promise<void>;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signUpWithPassword: (params: {
    email: string;
    password: string;
    fullName: string;
    accountType?: "customer" | "admin";
    nextPath?: string;
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

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
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

const PENDING_ACCOUNT_TYPE_KEY = "fidelizacion:pending-account-type";

function roleFromSessionMetadata(session: Session | null): AppRole | null {
  if (!session?.user) return null;
  const metadata = session.user.user_metadata ?? {};
  const raw =
    (metadata.account_type as string | undefined)?.trim().toLowerCase() ||
    (metadata.role as string | undefined)?.trim().toLowerCase();
  if (raw === "admin") return "admin";
  if (raw === "customer") return "customer";
  return null;
}

function peekPendingAccountType(): "admin" | "customer" | null {
  try {
    const value = window.sessionStorage.getItem(PENDING_ACCOUNT_TYPE_KEY);
    if (value === "admin" || value === "customer") return value;
    return null;
  } catch {
    return null;
  }
}

function clearPendingAccountType(): void {
  try {
    window.sessionStorage.removeItem(PENDING_ACCOUNT_TYPE_KEY);
  } catch {
    // Ignorado.
  }
}

function nameFromSession(session: Session | null): string {
  if (!session?.user) return "";
  const metadata = session.user.user_metadata ?? {};
  return (
    (metadata.full_name as string | undefined)?.trim() ||
    (metadata.name as string | undefined)?.trim() ||
    session.user.email ||
    ""
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [rolesUserId, setRolesUserId] = useState<string | null>(null);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [rolesLoaded, setRolesLoaded] = useState(false);
  const [rolesError, setRolesError] = useState<unknown>(null);
  const prevUserIdRef = useRef<string | null | undefined>(undefined);
  const rolesRequestIdRef = useRef(0);
  const sessionRef = useRef<Session | null>(null);
  sessionRef.current = session;

  const applySession = useCallback((nextSession: Session | null) => {
    const nextUserId = nextSession?.user.id ?? null;
    if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== nextUserId) {
      queryClient.clear();
    }
    prevUserIdRef.current = nextUserId;
    setSession(nextSession);
    setLoading(false);
  }, []);

  useEffect(() => {
    let active = true;

    withTimeout(
      supabase.auth.getSession(),
      SESSION_TIMEOUT_MS,
      "No se pudo recuperar la sesión. Revisa tu conexión e inténtalo de nuevo.",
    )
      .then(({ data }) => {
        if (!active) return;
        applySession(data.session ?? null);
      })
      .catch(() => {
        if (!active) return;
        applySession(null);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      applySession(nextSession ?? null);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [applySession]);

  const loadRoles = useCallback(async (currentSession: Session | null) => {
    const requestId = ++rolesRequestIdRef.current;
    const targetUserId = currentSession?.user.id ?? null;
    if (!currentSession || !targetUserId) {
      setRoles([]);
      setRolesUserId(null);
      setRolesError(null);
      setRolesLoading(false);
      setRolesLoaded(true);
      return;
    }
    setRolesLoading(true);
    setRolesLoaded(false);
    setRolesError(null);
    const pendingType = peekPendingAccountType();
    const metaRole = pendingType ?? roleFromSessionMetadata(currentSession);
    try {
      if (pendingType === "admin") {
        await rpc("profile_set_account_type", { p_account_type: "admin" }).catch(() => undefined);
      }
      if (pendingType && rolesRequestIdRef.current === requestId) {
        clearPendingAccountType();
      }
      // get_my_app_roles une los roles legacy, las membresías por negocio y account_type.
      // Si la migración 0009 aún no está aplicada, se usa el RPC anterior.
      let data: AppRole[];
      try {
        data = await rpc<AppRole[]>("get_my_app_roles");
      } catch {
        data = await rpc<AppRole[]>("get_my_roles");
      }
      if (rolesRequestIdRef.current !== requestId) return;
      const fetched = Array.isArray(data) ? data : [];
      setRolesUserId(targetUserId);
      if (metaRole === "admin" && !fetched.includes("admin")) {
        setRoles(Array.from(new Set<AppRole>(["admin", ...fetched])));
      } else {
        setRoles(fetched);
      }
    } catch (error) {
      if (rolesRequestIdRef.current !== requestId) return;
      if (import.meta.env.DEV) {
        console.error("No se pudieron cargar los roles", error);
      }
      setRolesUserId(targetUserId);
      setRoles(metaRole === "admin" ? ["admin"] : []);
      setRolesError(error);
    } finally {
      if (rolesRequestIdRef.current === requestId) {
        setRolesLoading(false);
        setRolesLoaded(true);
      }
    }
  }, []);

  const currentUserId = session?.user.id ?? null;

  useEffect(() => {
    if (loading) return;
    void loadRoles(sessionRef.current);
  }, [loading, currentUserId, loadRoles]);

  const refreshRoles = useCallback(async () => {
    await loadRoles(sessionRef.current);
  }, [loadRoles]);

  const signInWithGoogle = useCallback(
    async (nextPath?: string, accountType?: "customer" | "admin") => {
      try {
        if (accountType) {
          window.sessionStorage.setItem(PENDING_ACCOUNT_TYPE_KEY, accountType);
        } else {
          window.sessionStorage.removeItem(PENDING_ACCOUNT_TYPE_KEY);
        }
      } catch {
        // Ignorado.
      }
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: oauthRedirectUrl(nextPath),
          queryParams: { prompt: "select_account" },
        },
      });
      if (error) {
        clearPendingAccountType();
        throw error;
      }
    },
    [],
  );

  const signInWithPassword = useCallback(async (email: string, password: string) => {
    clearPendingAccountType();
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) throw error;
  }, []);

  const signUpWithPassword = useCallback(
    async ({
      email,
      password,
      fullName,
      accountType = "customer",
      nextPath,
    }: {
      email: string;
      password: string;
      fullName: string;
      accountType?: "customer" | "admin";
      nextPath?: string;
    }) => {
      const resolvedAccountType = accountType === "admin" ? "admin" : "customer";
      if (resolvedAccountType !== "admin") {
        clearPendingAccountType();
      }
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            role: resolvedAccountType,
            account_type: resolvedAccountType,
          },
          // Vuelve al QR (o al destino pendiente) después de confirmar el correo.
          emailRedirectTo: oauthRedirectUrl(nextPath),
        },
      });
      if (error) {
        clearPendingAccountType();
        throw error;
      }
      // Con la confirmación por correo desactivada Supabase devuelve sesión.
      return { needsConfirmation: !data.session };
    },
    [],
  );

  const signOut = useCallback(async () => {
    clearPendingAccountType();
    try {
      const { error } = await supabase.auth.signOut();
      // Si el servidor no responde, al menos se limpia la sesión local.
      if (error) await supabase.auth.signOut({ scope: "local" });
    } catch {
      await supabase.auth.signOut({ scope: "local" }).catch(() => undefined);
    } finally {
      rolesRequestIdRef.current += 1;
      prevUserIdRef.current = null;
      queryClient.clear();
      setSession(null);
      setRoles([]);
      setRolesUserId(null);
      setRolesError(null);
      setRolesLoading(false);
      setRolesLoaded(true);
    }
  }, []);

  const rolesMatchSession = currentUserId === null ? !loading : rolesUserId === currentUserId;
  const activeRoles = useMemo(
    () => (currentUserId !== null && rolesMatchSession ? roles : []),
    [currentUserId, rolesMatchSession, roles],
  );
  const activeRolesLoading = currentUserId !== null && (!rolesMatchSession || rolesLoading);
  const activeRolesLoaded = rolesMatchSession && rolesLoaded;
  const activeRolesError = rolesMatchSession ? rolesError : null;

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      roles: activeRoles,
      loading,
      rolesLoading: activeRolesLoading,
      rolesLoaded: activeRolesLoaded,
      rolesError: activeRolesError,
      displayName: nameFromSession(session),
      signInWithGoogle,
      signInWithPassword,
      signUpWithPassword,
      signOut,
      refreshRoles,
    }),
    [
      session,
      activeRoles,
      loading,
      activeRolesLoading,
      activeRolesLoaded,
      activeRolesError,
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
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return context;
}
