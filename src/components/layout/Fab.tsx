import { Link, useLocation } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Acceso rápido móvil a registrar compra. Se oculta en la propia pantalla de
 * compra para no duplicar la acción.
 */
export function PurchaseFab({ className }: { className?: string }) {
  const { pathname } = useLocation();
  if (pathname.startsWith('/admin/purchases/new')) return null;

  return (
    <Link
      to="/admin/purchases/new"
      aria-label="Registrar compra"
      className={cn(
        'fixed right-4 z-40 inline-flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 transition-transform hover:scale-105 active:scale-95 md:hidden',
        'bottom-[calc(4.75rem+env(safe-area-inset-bottom))]',
        className,
      )}
    >
      <Plus className="size-6" aria-hidden="true" />
    </Link>
  );
}
