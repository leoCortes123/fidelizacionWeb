import { Link, useLocation } from "react-router-dom";
import { QrCode } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Acceso rápido móvil a registrar venta. Se oculta en la propia pantalla de
 * venta para no duplicar la acción.
 */
export function PurchaseFab({ className }: { className?: string }) {
  const { pathname } = useLocation();
  if (pathname.startsWith("/admin/purchases/new") || pathname.startsWith("/encargado/venta")) {
    return null;
  }

  const destination = pathname.startsWith("/encargado")
    ? "/encargado/venta"
    : "/admin/purchases/new";

  return (
    <Link
      to={destination}
      aria-label="Registrar venta"
      className={cn(
        "fixed right-4 z-40 inline-flex size-14 items-center justify-center rounded-full border-2 border-black bg-amber-400 text-[#16262e] shadow-[3px_3px_0_#16262e] transition-transform hover:translate-x-[1px] hover:translate-y-[1px] hover:bg-[#e8bc2c] hover:shadow-[2px_2px_0_#16262e] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none motion-reduce:transition-none motion-reduce:hover:translate-x-0 motion-reduce:hover:translate-y-0 motion-reduce:active:translate-x-0 motion-reduce:active:translate-y-0 md:hidden dark:bg-amber-400 dark:hover:bg-[#e8bc2c]",
        "bottom-[calc(4.75rem+env(safe-area-inset-bottom))]",
        className,
      )}
    >
      <QrCode className="size-6 text-[#16262e]" aria-hidden="true" />
    </Link>
  );
}
