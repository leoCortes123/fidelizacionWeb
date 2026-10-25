import { useEffect, useState } from 'react';

export interface Countdown {
  remainingMs: number;
  expired: boolean;
  label: string;
}

export function formatRemaining(remainingMs: number): string {
  if (remainingMs <= 0) return 'Vencido';
  const totalSeconds = Math.floor(remainingMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) return `${hours} h ${minutes} min`;
  if (minutes > 0) return `${minutes} min ${seconds} s`;
  return `${seconds} s`;
}

/**
 * Cuenta atrás reactiva para la vigencia del QR. Se actualiza cada segundo y
 * se detiene sola cuando el plazo termina.
 */
export function useCountdown(expiresAt: string | null | undefined): Countdown {
  const target = expiresAt ? new Date(expiresAt).getTime() : Number.NaN;
  const valid = Number.isFinite(target);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!valid) return;
    setNow(Date.now());
    if (target <= Date.now()) return;
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [target, valid]);

  if (!valid) {
    return { remainingMs: 0, expired: false, label: 'Sin vencimiento' };
  }

  const remainingMs = Math.max(target - now, 0);
  return {
    remainingMs,
    expired: remainingMs <= 0,
    label: formatRemaining(remainingMs),
  };
}
