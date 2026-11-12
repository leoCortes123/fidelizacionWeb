import { Link, useLocation } from "react-router-dom";
import { QrCode } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Acceso rápido móvil a registrar venta. Se oculta en la propia pantalla de
 * venta para no duplicar la acción.
 */
export function PurchaseFab({ className }: { className?: string }) {
  const { pathname } = useLocation();
  if (pathname.startsWith("/admin/purchases/new")) return null;

  return (
    <Link
      to="/admin/purchases/new"
      aria-label="Registrar compra"
      className={cn(
        "fixed right-4 z-40 inline-flex size-14 items-center justify-center rounded-full border-2 border-black bg-amber-400 text-black shadow-lg transition-transform hover:scale-105 hover:bg-amber-300 active:scale-95 md:hidden dark:bg-amber-400 dark:hover:bg-amber-300",
        "bottom-[calc(4.75rem+env(safe-area-inset-bottom))]",
        className,
      )}
    >
      <QrCode className="size-6 text-black" aria-hidden="true" />
    </Link>
  );
}
