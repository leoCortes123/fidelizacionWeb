import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_LEGAL_SITE_URL,
  LEGAL_CONTACT,
  LEGAL_OWNER,
  LEGAL_PATHS,
  LEGAL_TAX,
  LEGAL_URLS,
  LEGAL_VERSIONS,
  MIN_AGE,
  legalSiteUrl,
  legalUrl,
} from "@/config/legal.config";

describe("legal.config", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("define versiones legales válidas en formato YYYY-MM-DD", () => {
    expect(Object.keys(LEGAL_VERSIONS).sort()).toEqual([
      "cookies",
      "dpa",
      "privacy_policy",
      "terms_business",
      "terms_customer",
    ]);
    for (const version of Object.values(LEGAL_VERSIONS)) {
      expect(version).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("define edad mínima y datos base del titular, contacto y régimen tributario", () => {
    expect(MIN_AGE).toBe(18);
    expect(LEGAL_OWNER.brandName).toBe("Fideliapp");
    expect(LEGAL_OWNER.personType).toBe("persona_natural");
    expect(LEGAL_OWNER.fullName).toBe("Leonardo Cortés Prieto");
    expect(LEGAL_OWNER.documentNumber).toBe("1.023.906.172");
    expect(LEGAL_OWNER.nit).toBe("1023906172-2");
    expect(LEGAL_OWNER.notificationAddress).toContain("TODO_LEGAL");

    expect(LEGAL_CONTACT.phoneHref).toBe("tel:+573181760717");
    expect(LEGAL_CONTACT.supportEmail).toBe("soporte.fideli@outlook.com");
    expect(LEGAL_CONTACT.privacyEmail).toBe("datos.fideliapp@outlook.com");
    expect(LEGAL_CONTACT.responseTimeBusinessDays).toEqual({ inquiries: 10, claims: 15 });
    expect(LEGAL_CONTACT.authority.url).toBe("https://www.sic.gov.co");

    expect(LEGAL_TAX.vatResponsible).toBe(false);
    expect(LEGAL_TAX.currency).toBe("COP");
    expect(LEGAL_TAX.pricingNote).toContain("no responsable de IVA");
  });

  it("resuelve URLs legales dinámicamente con el valor por defecto y VITE_LEGAL_SITE_URL", () => {
    vi.stubEnv("VITE_LEGAL_SITE_URL", "");
    expect(legalSiteUrl()).toBe(DEFAULT_LEGAL_SITE_URL);
    expect(legalUrl(LEGAL_PATHS.privacyPolicy)).toBe(`${DEFAULT_LEGAL_SITE_URL}/privacidad`);
    expect(LEGAL_URLS.privacyPolicy).toBe(`${DEFAULT_LEGAL_SITE_URL}/privacidad`);
    expect(LEGAL_URLS.termsCustomer).toBe(`${DEFAULT_LEGAL_SITE_URL}/terminos`);
    expect(LEGAL_URLS.termsBusiness).toBe(`${DEFAULT_LEGAL_SITE_URL}/terminos-negocios`);
    expect(LEGAL_URLS.dpa).toBe(`${DEFAULT_LEGAL_SITE_URL}/dpa`);
    expect(LEGAL_URLS.cookies).toBe(`${DEFAULT_LEGAL_SITE_URL}/cookies`);
    expect(LEGAL_URLS.accountDeletion).toBe(`${DEFAULT_LEGAL_SITE_URL}/eliminar-cuenta`);
    expect(LEGAL_URLS.contact).toBe(`${DEFAULT_LEGAL_SITE_URL}/contacto`);

    vi.stubEnv("VITE_LEGAL_SITE_URL", "https://legal.example.com///");
    expect(legalSiteUrl()).toBe("https://legal.example.com");
    expect(legalUrl(LEGAL_PATHS.dpa)).toBe("https://legal.example.com/dpa");
    expect(LEGAL_URLS.dpa).toBe("https://legal.example.com/dpa");
    expect(LEGAL_URLS.privacyPolicy).toBe("https://legal.example.com/privacidad");

    vi.stubEnv("VITE_LEGAL_SITE_URL", "http://127.0.0.1:5174/");
    expect(legalSiteUrl()).toBe("http://127.0.0.1:5174");
    expect(LEGAL_URLS.contact).toBe("http://127.0.0.1:5174/contacto");
  });

  it("descarta valores inválidos, con credenciales, query, hash o esquemas inseguros", () => {
    const invalidUrls = [
      "   ",
      "//evil.example.com",
      "javascript:alert(1)",
      "ftp://example.com",
      "https://",
      "sin-protocolo",
      "https://legal.example.com?foo=bar",
      "https://legal.example.com#section",
      "https://user:pass@legal.example.com",
      "https://legal.example.com\\@evil.com",
    ];
    for (const invalid of invalidUrls) {
      vi.stubEnv("VITE_LEGAL_SITE_URL", invalid);
      expect(legalSiteUrl()).toBe(DEFAULT_LEGAL_SITE_URL);
      expect(LEGAL_URLS.privacyPolicy).toBe(`${DEFAULT_LEGAL_SITE_URL}/privacidad`);
    }
  });
});
