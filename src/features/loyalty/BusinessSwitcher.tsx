import { Building2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useBusinessContext } from './businessContext';

const roleLabels: Record<string, string> = {
  admin: 'Admin',
  encargado: 'Encargado',
  cliente: 'Cliente',
};

/**
 * Selector de negocio para las cabeceras. Solo aparece cuando la cuenta
 * participa en más de un negocio; el rol mostrado es el del negocio activo.
 */
export function BusinessSwitcher({ className }: { className?: string }) {
  const { businesses, selectedBusiness, setSelectedBusiness } = useBusinessContext();

  if (businesses.length <= 1) return null;

  const value = selectedBusiness?.id ?? businesses[0]?.id;
  const role = selectedBusiness?.role;

  return (
    <div className={cn('flex min-w-0 items-center gap-2', className)}>
      <Building2 className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <Select
        value={value}
        onValueChange={(id) => {
          const business = businesses.find((item) => item.id === id);
          if (business) setSelectedBusiness(business);
        }}
      >
        <SelectTrigger
          className="h-9 w-full min-w-0 text-xs sm:w-[12.5rem]"
          aria-label="Cambiar de negocio"
        >
          <SelectValue placeholder="Elegir negocio" />
        </SelectTrigger>
        <SelectContent>
          {businesses.map((business) => (
            <SelectItem key={business.id} value={business.id}>
              {business.name}
              <span className="ml-2 text-xs text-muted-foreground">
                {roleLabels[business.role] ?? business.role}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {role && (
        <span className="hidden text-[11px] font-semibold text-muted-foreground lg:inline">
          {roleLabels[role] ?? role}
        </span>
      )}
    </div>
  );
}
