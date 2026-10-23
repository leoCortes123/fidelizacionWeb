const MESSAGES: Record<string, string> = {
  not_authenticated: 'Debes iniciar sesión para continuar.',
  forbidden: 'No tienes permiso para realizar esta operación.',
  invalid_token: 'Este código QR no es válido.',
  purchase_expired: 'Este QR ya expiró. Pide al cajero que genere una compra nueva.',
  purchase_cancelled: 'Esta compra fue cancelada. No se pueden acreditar sus puntos.',
  purchase_already_claimed: 'Esta compra ya fue reclamada por una cuenta.',
  purchase_not_found: 'No encontramos la compra.',
  amount_invalid: 'Introduce un importe mayor que cero.',
  amount_below_minimum: 'El importe no alcanza la compra mínima configurada.',
  amount_too_large: 'El importe supera el máximo permitido.',
  rate_limited: 'Demasiados intentos seguidos. Espera un momento y vuelve a probar.',
  insufficient_points: 'El cliente no tiene puntos suficientes para esta recompensa.',
  reward_unavailable: 'Esta recompensa no está disponible por ahora.',
  reward_not_found: 'La recompensa no existe.',
  reward_name_duplicate: 'Ya existe una recompensa con ese nombre.',
  invalid_reward_name: 'El nombre de la recompensa no es válido.',
  invalid_reward_cost: 'El costo en puntos no es válido.',
  invalid_reward_description: 'La descripción no puede superar 500 caracteres.',
  invalid_image_url: 'La URL de imagen debe iniciar con http:// o https://.',
  invalid_idempotency_key: 'No se pudo procesar el canje. Intenta de nuevo.',
  redemption_not_found: 'No encontramos un canje con ese código.',
  redemption_already_redeemed: 'Este código ya fue entregado.',
  redemption_cancelled: 'Este canje fue cancelado.',
  redemption_not_pending: 'Este canje ya no está pendiente de entrega.',
  customer_not_found: 'No encontramos el cliente.',
  invalid_reason: 'Escribe un motivo válido (máximo 300 caracteres).',
  invalid_role: 'Rol no permitido.',
  user_not_found: 'No encontramos ese usuario.',
  role_not_found: 'El usuario no tiene ese rol.',
  last_admin: 'No puedes eliminar al último administrador.',
  cannot_revoke_own_admin: 'No puedes quitarte a ti mismo el rol de administrador.',
  invalid_settings: 'La configuración enviada no es válida.',
  expiry_disabled: 'El vencimiento de puntos está desactivado en la configuración.',
  negative_points_balance: 'La operación dejaría un saldo negativo.',
  points_ledger_is_immutable: 'El historial de puntos es inmutable.',
  invalid_credentials: 'Correo o contraseña incorrectos.',
  email_not_confirmed: 'Debes confirmar tu correo antes de entrar.',
  'Invalid login credentials': 'Correo o contraseña incorrectos.',
  'User already registered': 'Ya existe una cuenta con ese correo. Inicia sesión.',
  'Password should be at least 6 characters':
    'La contraseña debe tener al menos 6 caracteres.',
  redemption_requires_admin:
    'Un administrador debe aplicar el canje desde el panel.',
  'Auth session missing': 'Tu sesión expiró. Vuelve a iniciar sesión.',
  'Failed to fetch': 'No se pudo conectar con el servidor. Revisa tu conexión.',
  'NetworkError': 'No se pudo conectar con el servidor. Revisa tu conexión.',
  'tardó demasiado':
    'El servidor tardó demasiado en responder. Revisa tu conexión e inténtalo de nuevo.',
  'TimeoutError':
    'El servidor tardó demasiado en responder. Revisa tu conexión e inténtalo de nuevo.',
};

export function errorCode(error: unknown): string {
  if (!error || typeof error !== 'object') return '';
  const candidate = error as { message?: string; code?: string; details?: string };
  return `${candidate.message ?? ''} ${candidate.details ?? ''}`.trim();
}

export function errorMessage(error: unknown): string {
  if (!error) return 'Ocurrió un error inesperado.';
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : errorCode(error);

  for (const [key, message] of Object.entries(MESSAGES)) {
    if (raw.includes(key)) return message;
  }

  if (raw.toLowerCase().includes('permission denied')) {
    return 'No tienes permiso para realizar esta operación.';
  }
  if (raw.toLowerCase().includes('duplicate key')) {
    return 'La operación ya fue registrada.';
  }
  if (
    raw.toLowerCase().includes('failed to fetch') ||
    raw.toLowerCase().includes('networkerror')
  ) {
    return 'No se pudo conectar con el servidor. Revisa tu conexión.';
  }

  return raw || 'Ocurrió un error inesperado.';
}

export function isBusinessError(error: unknown): boolean {
  const text = errorCode(error);
  return Object.keys(MESSAGES).some((key) => text.includes(key));
}
