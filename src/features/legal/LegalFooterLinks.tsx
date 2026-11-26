import { LEGAL_URLS } from "@/config/legal.config";
import { cn } from "@/lib/utils";

export function LegalFooterLinks({
  variant = "customer",
  className,
}: {
  variant?: "customer" | "business";
  className?: string;
}) {
  const linkClass =
    "underline underline-offset-4 hover:text-foreground focus-visible:outline focus-visible:outline-[2px] focus-visible:outline-offset-2 focus-visible:outline-[var(--lp-focus-ring,var(--focus-ring))]";

  return (
    <footer
      aria-label="Enlaces legales"
      className={cn(
        "no-print mt-8 border-t border-border/60 pt-4 text-center text-xs text-muted-foreground",
        className,
      )}
    >
      <nav
        aria-label="Documentos legales"
        className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5"
      >
        <a
          href={LEGAL_URLS.termsCustomer}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClass}
        >
          Términos
        </a>
        {variant === "business" && (
          <>
            <a
              href={LEGAL_URLS.termsBusiness}
              target="_blank"
              rel="noopener noreferrer"
              className={linkClass}
            >
              Términos negocios
            </a>
            <a
              href={LEGAL_URLS.dpa}
              target="_blank"
              rel="noopener noreferrer"
              className={linkClass}
            >
              DPA
            </a>
          </>
        )}
        <a
          href={LEGAL_URLS.privacyPolicy}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClass}
        >
          Privacidad
        </a>
        <a
          href={LEGAL_URLS.cookies}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClass}
        >
          Cookies
        </a>
        <a
          href={LEGAL_URLS.contact}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClass}
        >
          Contacto y PQR
        </a>
      </nav>
    </footer>
  );
}
