const MESSAGES: Record<string, string> = {
  not_authenticated: 'Debes iniciar sesión para continuar.',
  forbidden: 'No tienes permiso para realizar esta operación.',
  invalid_token: 'Este código QR no es válido.',
  purchase_expired: 'Este QR ya expiró. Pide al cajero que genere una compra nueva.',
  purchase_cancelled: 'Esta compra fue cancelada. No se pueden acreditar sus loopoints.',
  purchase_already_claimed: 'Esta compra ya fue reclamada por una cuenta.',
  purchase_not_found: 'No encontramos la compra.',
  amount_invalid: 'Introduce un importe mayor que cero.',
  amount_below_minimum: 'El importe no alcanza la compra mínima configurada.',
  amount_too_large: 'El importe supera el máximo permitido.',
  rate_limited: 'Demasiados intentos seguidos. Espera un momento y vuelve a probar.',
  insufficient_points: 'El cliente no tiene loopoints suficientes para esta recompensa.',
  reward_unavailable: 'Esta recompensa no está disponible por ahora.',
  reward_not_found: 'La recompensa no existe.',
  reward_name_duplicate: 'Ya existe una recompensa con ese nombre.',
  invalid_reward_name: 'El nombre de la recompensa no es válido.',
  invalid_reward_cost: 'El costo en loopoints no es válido.',
  invalid_reward_description: 'La descripción no puede superar 500 caracteres.',
  invalid_image_url: 'La URL de imagen debe iniciar con http:// o https://.',
  invalid_idempotency_key: 'No se pudo procesar el canje. Intenta de nuevo.',
  redemption_not_found: 'No encontramos un canje con ese código.',
  redemption_already_redeemed: 'Este código ya fue entregado.',
  redemption_cancelled: 'Este canje fue cancelado.',
  redemption_not_pending: 'Este canje ya no está pendiente de validación.',
  redemption_already_delivered: 'Este canje ya fue entregado.',
  redemption_expired: 'Este canje expiró. El cliente debe solicitarlo de nuevo.',
  redemption_not_approved:
    'Primero debes aprobar la solicitud antes de confirmar la entrega.',
  redemption_not_reissuable:
    'Solo puedes reemitir el QR mientras la solicitud esté pendiente.',
  token_not_found: 'Este QR ya no está disponible. Pide al cliente que lo reemita.',
  token_expired: 'El QR venció. Pide al cliente que reemita uno nuevo.',
  token_already_consumed: 'Este QR ya fue utilizado.',
  token_reissue_limit:
    'Se reemitió el QR demasiadas veces en la última hora. Espera un momento.',
  program_not_active:
    'El programa de loopoints está inactivo. Actívalo antes de canjear.',
  account_not_found: 'No tienes una cuenta de loopoints en este negocio.',
  reward_not_yet_valid: 'Esta recompensa aún no está vigente.',
  reward_expired: 'Esta recompensa expiró.',
  reward_customer_limit_reached:
    'Ya alcanzaste el máximo de canjes permitidos para esta recompensa.',
  reward_period_limit_reached:
    'Ya alcanzaste el máximo de canjes de esta recompensa para el periodo.',
  reward_total_limit_reached:
    'Esta recompensa agotó su límite total de canjes.',
  customer_not_found: 'No encontramos el cliente.',
  invalid_reason: 'Escribe un motivo válido (máximo 300 caracteres).',
  invalid_role: 'Rol no permitido.',
  user_not_found: 'No encontramos ese usuario.',
  role_not_found: 'El usuario no tiene ese rol.',
  last_admin: 'No puedes eliminar al último administrador.',
  cannot_revoke_own_admin: 'No puedes quitarte a ti mismo el rol de administrador.',
  invalid_settings: 'La configuración enviada no es válida.',
  business_not_found: 'No encontramos ese negocio o ya no está disponible.',
  business_not_found_or_no_access: 'No tienes acceso a este negocio.',
  membership_not_found: 'No encontramos esa membresía.',
  invalid_approval_permission:
    'Solo los encargados pueden tener permiso de aprobación.',
  invalid_cop_per_point_unit:
    'El valor por loopoint debe estar entre $100 y $1.000.000.',
  invalid_points_per_cop_unit:
    'Los loopoints por $1.000 deben estar entre 1 y 1.000.000.',
  invalid_points_expiry_days:
    'El vencimiento de loopoints debe estar entre 1 y 3.650 días.',
  invalid_budget_rate: 'La tasa de presupuesto debe estar entre 0 % y 100 %.',
  invalid_qr_expiry_hours: 'La vigencia del QR debe estar entre 1 y 168 horas.',
  invalid_business_name: 'El nombre del negocio no es válido.',
  invalid_full_name: 'Escribe tu nombre completo (2 a 120 caracteres).',
  invalid_nickname:
    'El alias debe tener entre 3 y 24 caracteres: minúsculas, números, punto, guion o guion bajo.',
  nickname_reserved: 'Ese alias está reservado. Elige otro.',
  nickname_taken: 'Ese alias ya está en uso. Prueba con otro.',
  nickname_change_limit:
    'Ya usaste tus 2 cambios de alias. El alias actual se mantiene.',
  invalid_business_description: 'La descripción no puede superar 500 caracteres.',
  invalid_business_address:
    'La dirección, el barrio o la ciudad superan 160 caracteres.',
  invalid_whatsapp: 'El WhatsApp no es válido (7 a 15 dígitos).',
  invalid_phone: 'El teléfono no es válido (7 a 15 dígitos).',
  invalid_instagram: 'El usuario de Instagram no es válido.',
  invalid_website: 'La dirección web no es válida.',
  invalid_logo_url: 'El logo debe ser una URL pública del almacenamiento de Loopoint.',
  logo_outside_business: 'El logo debe pertenecer a este negocio.',
  invalid_frequent_min_purchases:
    'El número de compras para ser frecuente debe estar entre 1 y 100.',
  invalid_frequent_period_days:
    'La ventana de frecuencia debe estar entre 7 y 3.650 días.',
  invalid_frequent_min_spend:
    'El gasto mínimo debe estar entre $0 y $50.000.000.',
  invalid_frequent_active_days:
    'Los días para seguir activo deben estar entre 1 y 365.',
  invalid_recovery_inactive_days:
    'Los días para recuperación deben ser mayores que los días de actividad (7 a 3.650).',
  invalid_business_slug: 'El identificador del negocio no es válido.',
  invalid_timezone: 'La zona horaria no es válida.',
  invalid_operating_days: 'Selecciona al menos un día de operación válido.',
  business_slug_duplicate: 'Ya existe un negocio con ese identificador.',
  invalid_product_name: 'El nombre del producto no es válido (2 a 120 caracteres).',
  invalid_product_price: 'El precio del producto debe ser mayor que cero.',
  invalid_product_cost: 'El costo del producto no puede ser negativo.',
  product_not_found: 'No encontramos ese producto en la carta.',
  invalid_amount: 'Introduce un importe mayor que cero.',
  invalid_eligible_amount:
    'El importe elegible no puede ser negativo ni superar el importe de la compra.',
  invalid_customer: 'Elige un cliente afiliado al negocio.',
  invalid_data_status: 'El estado de los datos económicos no es válido.',
  purchase_event_not_found: 'No encontramos esa compra registrada.',
  idempotency_key_conflict:
    'La operación entra en conflicto con otra compra registrada. Inténtalo de nuevo.',
  invalid_sales: 'Las ventas diarias no pueden ser negativas.',
  invalid_operation_days: 'Los días de operación deben estar entre 1 y 31.',
  invalid_daily_gain: 'La ganancia diaria no puede ser negativa.',
  invalid_gross_margin: 'El margen bruto debe estar entre 0 y 100.',
  invalid_avg_customers: 'El número de clientes por día no puede ser negativo.',
  invalid_budget: 'El presupuesto mensual no puede ser negativo.',
  invalid_campaign_name: 'El nombre de la campaña no es válido (2 a 120 caracteres).',
  invalid_campaign_multiplier: 'El multiplicador debe estar entre 1 y 10.',
  invalid_campaign_bonus: 'El bono de loopoints no es válido.',
  invalid_campaign_min_purchase: 'La compra mínima de la campaña no es válida.',
  invalid_campaign_validity: 'La fecha de fin debe ser posterior al inicio.',
  invalid_campaign_description: 'La descripción no puede superar 500 caracteres.',
  campaign_not_found: 'No encontramos esa campaña.',
  free_product_requires_product:
    'Elige el producto que se entrega con esta recompensa.',
  invalid_reward_points: 'Los loopoints requeridos no son válidos.',
  invalid_min_purchase: 'La compra mínima no es válida.',
  invalid_discount_percentage: 'El porcentaje de descuento debe estar entre 1 y 100.',
  invalid_max_discount: 'El descuento máximo no es válido.',
  discount_exceeds_min_purchase:
    'El descuento no puede superar la compra mínima de la recompensa.',
  invalid_reward_validity: 'La fecha de fin debe ser posterior al inicio.',
  invalid_redemption_period:
    'Indica los días del periodo cuando configures un límite por periodo.',
  invalid_redemption_limit: 'Los límites de canje deben ser mayores que cero.',
  expiry_disabled: 'El vencimiento de loopoints está desactivado en la configuración.',
  negative_points_balance: 'La operación dejaría un saldo negativo.',
  points_ledger_is_immutable: 'El historial de loopoints es inmutable.',
  invalid_credentials: 'Correo o contraseña incorrectos.',
  email_not_confirmed: 'Debes confirmar tu correo antes de entrar.',
  'Invalid login credentials': 'Correo o contraseña incorrectos.',
  'User already registered': 'Ya existe una cuenta con ese correo. Inicia sesión.',
  'Password should be at least 6 characters':
    'La contraseña debe tener al menos 6 caracteres.',
  invalid_origin: 'El origen del canje no es válido.',
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
