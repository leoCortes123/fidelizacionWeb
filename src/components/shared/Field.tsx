import type { ReactNode } from 'react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { HelpHint } from './HelpHint';

interface FieldProps {
  id?: string;
  label: string;
  hint?: string;
  help?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}

/**
 * Campo de formulario con etiqueta, ayuda corta, tooltip y error.
 * Mantiene el mismo patrón visual en toda la configuración.
 */
export function Field({
  id,
  label,
  hint,
  help,
  error,
  required,
  className,
  children,
}: FieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-center gap-1.5">
        <Label htmlFor={id} className="leading-tight">
          {label}
          {required && <span className="ml-0.5 text-destructive">*</span>}
        </Label>
        {help && <HelpHint text={help} />}
      </div>
      {children}
      {error ? (
        <p className="text-xs font-medium text-destructive" role="alert">
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}
