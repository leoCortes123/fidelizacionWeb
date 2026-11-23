import { useEffect } from "react";
import { publicAppUrl } from "@/lib/config";

interface PageMetaOptions {
  title: string;
  description: string;
  path: string;
  breadcrumbLabel?: string;
}

/**
 * Actualiza los metadatos SEO y Open Graph por ruta, junto con el BreadcrumbList JSON-LD,
 * para que cada página pública del sitio tenga título, descripción y URL canónica propios.
 */
export function usePageMeta({ title, description, path, breadcrumbLabel }: PageMetaOptions) {
  useEffect(() => {
    const previousTitle = document.title;
    const baseUrl = publicAppUrl();
    const normalizedPath = path === "/" ? "/" : `/${path.replace(/^\/+/, "")}`;
    const canonicalUrl = `${baseUrl}${normalizedPath === "/" ? "/" : normalizedPath}`;

    document.title = title;

    const setMeta = (selector: string, attr: "name" | "property", key: string, content: string) => {
      let el = document.head.querySelector<HTMLMetaElement>(selector);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    setMeta('meta[name="description"]', "name", "description", description);
    setMeta('meta[property="og:title"]', "property", "og:title", title);
    setMeta('meta[property="og:description"]', "property", "og:description", description);
    setMeta('meta[property="og:url"]', "property", "og:url", canonicalUrl);

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = canonicalUrl;

    const ldId = "route-breadcrumb-ld";
    let ldScript = document.getElementById(ldId) as HTMLScriptElement | null;
    if (normalizedPath !== "/" && breadcrumbLabel) {
      if (!ldScript) {
        ldScript = document.createElement("script");
        ldScript.id = ldId;
        ldScript.type = "application/ld+json";
        document.head.appendChild(ldScript);
      }
      ldScript.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Inicio",
            item: `${baseUrl}/`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: breadcrumbLabel,
            item: canonicalUrl,
          },
        ],
      });
    } else if (ldScript) {
      ldScript.remove();
    }

    return () => {
      document.title = previousTitle;
      document.getElementById(ldId)?.remove();
    };
  }, [title, description, path, breadcrumbLabel]);
}
