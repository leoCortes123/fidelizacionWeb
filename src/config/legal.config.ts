/**
 * Configuración legal central de Fideliapp.
 *
 * IMPORTANTE: Mantener este archivo idéntico entre:
 * - fidelizacionWeb/src/config/legal.config.ts
 * - fidelizacionWebPage/src/config/legal.config.ts
 *
 * Antes de salir a producción, buscar y resolver todos los marcadores `TODO_LEGAL`.
 */

export const DEFAULT_LEGAL_SITE_URL = "https://fideliapp.pages.dev";
export const DEFAULT_APP_URL = "https://fideli-app.vercel.app";

/** Edad mínima requerida para crear y mantener cualquier cuenta en Fideliapp. */
export const MIN_AGE = 18;

/**
 * Versiones vigentes de los documentos legales (formato YYYY-MM-DD).
 * Debe coincidir exactamente con `legal_current_versions()` en PostgreSQL (S2).
 */
export const LEGAL_VERSIONS = {
  terms_customer: "2026-11-25",
  terms_business: "2026-11-25",
  privacy_policy: "2026-11-25",
  dpa: "2026-11-25",
  cookies: "2026-11-25",
} as const;

export type LegalVersionKey = keyof typeof LEGAL_VERSIONS;

/** Datos de identificación del responsable del tratamiento y prestador del servicio. */
export const LEGAL_OWNER = {
  personType: "persona_natural",
  personTypeLabel: "Persona natural (programador independiente)",
  brandName: "Fideliapp",
  fullName: "Leonardo Cortés Prieto",
  documentType: "C.C.",
  documentNumber: "1.023.906.172",
  // TODO_LEGAL: confirmar dígito de verificación (-2) contra el RUT antes de salir a producción.
  nit: "1023906172-2",
  domicile: "Bogotá D.C., Colombia",
  // TODO_LEGAL: reemplazar por la dirección física de notificación judicial y Habeas Data (RUT u oficina virtual).
  notificationAddress: "TODO_LEGAL: Dirección física de notificación (Bogotá D.C., Colombia)",
} as const;

/** Canales oficiales de soporte, Habeas Data / PQR y autoridad de control. */
export const LEGAL_CONTACT = {
  phone: "318 176 0717",
  phoneHref: "tel:+573181760717",
  supportEmail: "soporte.fideli@outlook.com",
  privacyEmail: "datos.fideliapp@outlook.com",
  businessHours: "Lunes a viernes, 8:00 a. m. – 5:00 p. m. (hora Colombia)",
  responseTimeBusinessDays: {
    inquiries: 10,
    claims: 15,
  },
  authority: {
    name: "Superintendencia de Industria y Comercio (SIC)",
    shortName: "SIC",
    url: "https://www.sic.gov.co",
  },
} as const;

/** Régimen tributario aplicable a precios publicados en el sitio comercial. */
export const LEGAL_TAX = {
  vatResponsible: false,
  currency: "COP",
  legalBasis: "Art. 437 parágrafo 3 del Estatuto Tributario",
  pricingNote:
    "Precio final en pesos colombianos. No se cobra IVA: el prestador es persona natural no responsable de IVA.",
} as const;

/** Rutas públicas de las páginas legales en el sitio comercial. */
export const LEGAL_PATHS = {
  privacyPolicy: "/privacidad",
  termsCustomer: "/terminos",
  termsBusiness: "/terminos-negocios",
  dpa: "/dpa",
  cookies: "/cookies",
  accountDeletion: "/eliminar-cuenta",
  contact: "/contacto",
} as const;

export type LegalPathKey = keyof typeof LEGAL_PATHS;
export type LegalPath = (typeof LEGAL_PATHS)[LegalPathKey];

function resolveHttpBaseUrl(raw: string | undefined, fallback: string): string {
  const normalizedFallback = fallback.replace(/\/+$/, "");
  const candidate = raw?.trim();
  if (!candidate || !/^https?:\/\//i.test(candidate) || candidate.includes("\\")) {
    return normalizedFallback;
  }
  try {
    const parsed = new URL(candidate);
    if (
      (parsed.protocol !== "http:" && parsed.protocol !== "https:") ||
      parsed.username ||
      parsed.password ||
      parsed.search ||
      parsed.hash
    ) {
      return normalizedFallback;
    }
    return `${parsed.origin}${parsed.pathname.replace(/\/+$/, "")}`;
  } catch {
    return normalizedFallback;
  }
}

/** URL base del sitio comercial donde residen las páginas legales. */
export function legalSiteUrl(): string {
  return resolveHttpBaseUrl(import.meta.env.VITE_LEGAL_SITE_URL, DEFAULT_LEGAL_SITE_URL);
}

/** Construye la URL absoluta de una página legal a partir de su ruta. */
export function legalUrl(path: LegalPath): string {
  return `${legalSiteUrl()}${path}`;
}

/** URLs absolutas a todas las páginas legales (evaluadas dinámicamente según `VITE_LEGAL_SITE_URL`). */
export const LEGAL_URLS: Readonly<Record<LegalPathKey, string>> = {
  get privacyPolicy() {
    return legalUrl(LEGAL_PATHS.privacyPolicy);
  },
  get termsCustomer() {
    return legalUrl(LEGAL_PATHS.termsCustomer);
  },
  get termsBusiness() {
    return legalUrl(LEGAL_PATHS.termsBusiness);
  },
  get dpa() {
    return legalUrl(LEGAL_PATHS.dpa);
  },
  get cookies() {
    return legalUrl(LEGAL_PATHS.cookies);
  },
  get accountDeletion() {
    return legalUrl(LEGAL_PATHS.accountDeletion);
  },
  get contact() {
    return legalUrl(LEGAL_PATHS.contact);
  },
};
