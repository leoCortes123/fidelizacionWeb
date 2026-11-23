import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Business, BusinessRole } from "@/types";

const STORAGE_PREFIX = "fidelizacion:selected-business";

export function businessStorageKey(userId?: string | null): string {
  return userId ? `${STORAGE_PREFIX}:${userId}` : STORAGE_PREFIX;
}

function getStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function readStoredBusinessId(storageKey: string): string | null {
  try {
    return getStorage()?.getItem(storageKey) ?? null;
  } catch {
    return null;
  }
}

/** Recuerda el negocio elegido para un usuario concreto (usado tras afiliarse). */
export function persistBusinessSelection(
  userId: string | null | undefined,
  businessId: string,
): void {
  try {
    getStorage()?.setItem(businessStorageKey(userId), businessId);
  } catch {
    // Sin almacenamiento: la selección se resolverá al cargar los negocios.
  }
}

interface BusinessContextValue {
  selectedBusiness: Business | null;
  businesses: Business[];
  selectedRole: BusinessRole | null;
  canApproveRedemptions: boolean;
  setSelectedBusiness: (business: Business | null) => void;
}

const BusinessContext = createContext<BusinessContextValue | undefined>(undefined);

const ROLE_PRIORITY: Record<BusinessRole, number> = {
  admin: 0,
  encargado: 1,
  cliente: 2,
};

function defaultBusinessForUser(businesses: Business[]): Business | null {
  if (businesses.length === 0) return null;
  return (
    [...businesses].sort(
      (a, b) => (ROLE_PRIORITY[a.role] ?? 9) - (ROLE_PRIORITY[b.role] ?? 9),
    )[0] ?? null
  );
}

export function BusinessProvider({
  children,
  businesses = [],
  userId,
}: {
  children: ReactNode;
  businesses?: Business[];
  userId?: string | null;
}) {
  const storageKey = businessStorageKey(userId);
  const [chosenId, setChosenId] = useState<string | null>(() => readStoredBusinessId(storageKey));
  // `showSelector` permite volver a la pantalla de selección desde el panel.
  const [showSelector, setShowSelector] = useState(false);

  const selectedBusiness = showSelector
    ? null
    : (businesses.find((business) => business.id === chosenId) ??
      defaultBusinessForUser(businesses));

  // Conserva la elección (incluida la selección por defecto) para la próxima visita.
  useEffect(() => {
    if (!selectedBusiness) return;
    if (selectedBusiness.id === chosenId) return;
    setChosenId(selectedBusiness.id);
  }, [selectedBusiness, chosenId]);

  useEffect(() => {
    if (!chosenId) return;
    try {
      getStorage()?.setItem(storageKey, chosenId);
    } catch {
      // Ignorado.
    }
  }, [chosenId, storageKey]);

  function setSelectedBusiness(business: Business | null) {
    if (!business) {
      setShowSelector(true);
      setChosenId(null);
      try {
        getStorage()?.removeItem(storageKey);
      } catch {
        // Ignorado.
      }
      return;
    }
    setShowSelector(false);
    setChosenId(business.id);
  }

  return (
    <BusinessContext.Provider
      value={{
        selectedBusiness,
        businesses,
        selectedRole: selectedBusiness?.role ?? null,
        canApproveRedemptions: selectedBusiness?.can_approve_redemptions ?? false,
        setSelectedBusiness,
      }}
    >
      {children}
    </BusinessContext.Provider>
  );
}

export function useOptionalBusinessContext() {
  return useContext(BusinessContext) ?? null;
}

export function useBusinessContext() {
  const context = useContext(BusinessContext);
  if (!context) {
    throw new Error("useBusinessContext debe usarse dentro de BusinessProvider");
  }
  return context;
}
