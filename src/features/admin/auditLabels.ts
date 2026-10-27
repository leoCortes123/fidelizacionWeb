import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  BadgeCheck,
  Building2,
  CalendarClock,
  Clock,
  Gift,
  Megaphone,
  Package,
  PiggyBank,
  QrCode,
  RefreshCw,
  ScanLine,
  Settings,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Store,
  Ticket,
  UserPlus,
  Users,
  Wallet,
  XCircle,
} from 'lucide-react';
import {
  formatCOP,
  formatDateTimeBogota,
  formatLoopoints,
  formatNumber,
} from '@/lib/format';
import type { BusinessAuditLog } from '@/types';

export type AuditSeverity = 'success' | 'info' | 'warning' | 'danger' | 'neutral';

export type AuditCategoryId =
  | 'purchase'
  | 'redemption'
  | 'campaign'
  | 'configuration'
  | 'team'
  | 'rewards'
  | 'points'
  | 'budget';

export interface AuditCategory {
  id: AuditCategoryId;
  label: string;
  /** Prefijo(s) que entiende `business_audit_log_page`; varios separados por coma. */
  prefix: string;
  icon: LucideIcon;
}

export interface AuditLabel {
  label: string;
  description: string;
  icon: LucideIcon;
  severity: AuditSeverity;
  category: AuditCategoryId;
  entityLabel: string;
}

export interface AuditField {
  label: string;
  value: string;
}

export interface AuditChange {
  label: string;
  before: string;
  after: string;
}

export interface AuditDescription {
  fields: AuditField[];
  changes: AuditChange[];
}

export const AUDIT_CATEGORIES: AuditCategory[] = [
  { id: 'purchase', label: 'Compras', prefix: 'purchase.', icon: ShoppingBag },
  { id: 'redemption', label: 'Canjes', prefix: 'redemption.', icon: Ticket },
  { id: 'campaign', label: 'Campañas', prefix: 'campaign.', icon: Megaphone },
  {
    id: 'configuration',
    label: 'Configuración',
    prefix: 'business.,loyalty_program.,economic_profile.,product.',
    icon: Settings,
  },
  { id: 'team', label: 'Equipo', prefix: 'membership.', icon: Users },
  { id: 'rewards', label: 'Recompensas', prefix: 'reward.', icon: Gift },
  { id: 'points', label: 'Loopoints', prefix: 'points.', icon: Clock },
  { id: 'budget', label: 'Presupuesto', prefix: 'budget.', icon: PiggyBank },
];

const CATEGORY_BY_PREFIX: Array<{ prefix: string; id: AuditCategoryId }> = [
  { prefix: 'purchase.', id: 'purchase' },
  { prefix: 'redemption.', id: 'redemption' },
  { prefix: 'campaign.', id: 'campaign' },
  { prefix: 'business.', id: 'configuration' },
  { prefix: 'loyalty_program.', id: 'configuration' },
  { prefix: 'economic_profile.', id: 'configuration' },
  { prefix: 'product.', id: 'configuration' },
  { prefix: 'membership.', id: 'team' },
  { prefix: 'reward.', id: 'rewards' },
  { prefix: 'points.', id: 'points' },
  { prefix: 'budget.', id: 'budget' },
  { prefix: 'role.', id: 'team' },
  { prefix: 'settings.', id: 'configuration' },
];

const ENTITY_LABELS: Record<string, string> = {
  business: 'Negocio',
  business_economic_profile: 'Datos económicos',
  business_membership: 'Miembro del equipo',
  loyalty_budget_snapshot: 'Presupuesto',
  loyalty_campaign: 'Campaña',
  loyalty_point_transactions: 'Loopoints',
  loyalty_program: 'Programa de loopoints',
  loyalty_purchase_event: 'Compra',
  loyalty_redemption: 'Canje',
  loyalty_reward: 'Recompensa',
  product: 'Producto',
  program_settings: 'Configuración global',
  purchase: 'Compra',
  redemption: 'Canje',
  reward: 'Recompensa',
  user_role: 'Rol de plataforma',
};

const FIELD_LABELS: Record<string, string> = {
  accounts_affected: 'Clientes afectados',
  address: 'Dirección',
  after: 'Ahora',
  amount_cop: 'Valor de la compra',
  avg_customers_per_day: 'Clientes por día',
  balance: 'Saldo resultante',
  balance_after: 'Saldo resultante',
  before: 'Antes',
  bonus_points: 'Bono de loopoints',
  budget_rate: 'Tasa de presupuesto',
  can_approve_redemptions: 'Puede aprobar canjes',
  channel: 'Canal',
  city: 'Ciudad',
  code: 'Código del canje',
  cop_per_point_unit: 'COP por loopoint',
  customer_nickname: 'Cliente',
  customer_email: 'Correo del cliente',
  daily_avg_sales: 'Ventas diarias promedio',
  daily_gain: 'Ganancia diaria',
  data_status: 'Estado de los datos',
  description: 'Descripción',
  discount_percentage: 'Porcentaje de descuento',
  eligible_amount_cop: 'Valor elegible',
  expires_at: 'Vence',
  first_purchase_bonus_points: 'Bono por primera compra',
  frequent_active_days: 'Días para seguir activo',
  frequent_min_purchases: 'Compras mínimas',
  frequent_min_spend_cop: 'Gasto mínimo',
  frequent_period_days: 'Ventana de evaluación (días)',
  gross_margin: 'Margen bruto',
  instagram: 'Instagram',
  is_active: 'Activa',
  items: 'Componentes del combo',
  items_count: 'Productos',
  joined: 'Afiliación creada',
  logo_url: 'Logo',
  lots_expired: 'Lotes vencidos',
  max_budget_cop: 'Presupuesto máximo',
  max_monthly_reward_budget: 'Presupuesto mensual de recompensas',
  monthly_operation_days: 'Días de operación al mes',
  monthly_sales_cop: 'Ventas del mes',
  multiplier: 'Multiplicador',
  name: 'Nombre',
  neighborhood: 'Barrio',
  operating_days: 'Días de operación',
  period_start: 'Periodo',
  phone: 'Teléfono',
  phone_whatsapp: 'WhatsApp',
  points_awarded: 'Loopoints acreditados',
  points_earned: 'Loopoints sumados',
  points_expired: 'Loopoints vencidos',
  points_per_cop_unit: 'Loopoints por COP',
  points_preview: 'Loopoints estimados',
  points_refunded: 'Loopoints devueltos',
  points_required: 'Loopoints requeridos',
  points_reversed: 'Loopoints descontados',
  points_spent: 'Loopoints canjeados',
  points_expiry_days: 'Días de vencimiento',
  previous_status: 'Estado anterior',
  previous_logo_url: 'Logo anterior',
  product_price_cop: 'Precio del producto',
  product_cost_cop: 'Costo del producto',
  qr_expiry_hours: 'Vigencia del QR',
  reason: 'Motivo',
  recurrence_bonus_points: 'Bono por recurrencia',
  recovery_inactive_days: 'Días para recuperar',
  referral_bonus_points: 'Bono por referido',
  reward_name: 'Recompensa',
  role: 'Rol',
  slug: 'Enlace',
  source: 'Origen',
  timezone: 'Zona horaria',
  type: 'Tipo',
  updated_at: 'Última actualización',
  valid_from: 'Vigente desde',
  valid_until: 'Vigente hasta',
  via: 'Canal',
  website: 'Sitio web',
};

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  encargado: 'Encargado',
  cliente: 'Cliente',
};

const REWARD_TYPE_LABELS: Record<string, string> = {
  free_product: 'Producto gratuito',
  fixed_discount: 'Descuento fijo',
  percentage_discount: 'Descuento porcentual',
  configurable_benefit: 'Beneficio configurable',
};

const CHANNEL_LABELS: Record<string, string> = {
  qr_scan: 'Escaneo de QR',
  manual: 'Manual',
  purchase_qr: 'Compra con QR',
  admin: 'Administración',
};

const ECONOMIC_STATUS_LABELS: Record<string, string> = {
  confirmed: 'Confirmado',
  estimated: 'Estimado',
  unknown: 'Desconocido',
};

const DAY_NAMES: Record<number, string> = {
  1: 'Lun',
  2: 'Mar',
  3: 'Mié',
  4: 'Jue',
  5: 'Vie',
  6: 'Sáb',
  7: 'Dom',
};

const DATE_KEYS = new Set([
  'expires_at',
  'valid_from',
  'valid_until',
  'period_start',
  'configured_at',
  'created_at',
  'updated_at',
]);

const POINT_KEYS = new Set([
  'balance',
  'balance_after',
  'bonus_points',
  'first_purchase_bonus_points',
  'points_awarded',
  'points_earned',
  'points_expired',
  'points_preview',
  'points_refunded',
  'points_required',
  'points_reversed',
  'points_spent',
  'recurrence_bonus_points',
  'referral_bonus_points',
]);

const TECHNICAL_KEYS = new Set([
  'account_id',
  'actor_id',
  'business_id',
  'campaign_id',
  'created_at',
  'created_by',
  'configured_by',
  'customer_id',
  'id',
  'membership_id',
  'redemption_id',
  'reward_id',
  'updated_by',
  'updated_at',
  'user_id',
]);

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function op(
  label: string,
  description: string,
  icon: LucideIcon,
  severity: AuditSeverity,
  category: AuditCategoryId,
  entityLabel: string,
): AuditLabel {
  return { label, description, icon, severity, category, entityLabel };
}

export const AUDIT_LABELS: Record<string, AuditLabel> = {
  'business.created': op(
    'Negocio registrado',
    'Se creó el negocio y su cuenta de administrador.',
    Store,
    'success',
    'configuration',
    'Negocio',
  ),
  'business.updated': op(
    'Datos del negocio actualizados',
    'Se cambiaron el nombre, la zona horaria o los días de operación.',
    Building2,
    'info',
    'configuration',
    'Negocio',
  ),
  'business.profile_updated': op(
    'Ficha pública actualizada',
    'Se editó la descripción, ubicación o datos de contacto del negocio.',
    Building2,
    'info',
    'configuration',
    'Negocio',
  ),
  'business.logo_updated': op(
    'Logo actualizado',
    'Se cambió la imagen del negocio.',
    Building2,
    'info',
    'configuration',
    'Negocio',
  ),
  'business.logo_removed': op(
    'Logo eliminado',
    'Se quitó la imagen del negocio.',
    Building2,
    'warning',
    'configuration',
    'Negocio',
  ),
  'loyalty_program.configured': op(
    'Programa de loopoints actualizado',
    'Se guardaron las reglas de acumulación, vencimiento y presupuesto.',
    SlidersHorizontal,
    'info',
    'configuration',
    'Programa de loopoints',
  ),
  'loyalty_program.frequent_updated': op(
    'Criterios de cliente frecuente actualizados',
    'Se ajustaron las compras, el gasto o los días que definen a un cliente frecuente.',
    SlidersHorizontal,
    'info',
    'configuration',
    'Programa de loopoints',
  ),
  'economic_profile.updated': op(
    'Datos económicos actualizados',
    'Se guardaron las ventas, el margen o el presupuesto de recompensas.',
    Wallet,
    'info',
    'configuration',
    'Datos económicos',
  ),
  'product.combo_updated': op(
    'Combo actualizado',
    'Se cambiaron los productos que componen un combo de la carta.',
    Package,
    'info',
    'configuration',
    'Producto',
  ),
  'purchase.registered': op(
    'Compra registrada',
    'Se registró una compra y se sumaron loopoints al cliente.',
    ShoppingBag,
    'success',
    'purchase',
    'Compra',
  ),
  'purchase.reverted': op(
    'Compra anulada',
    'Se anuló una compra y se descontaron los loopoints que había sumado.',
    XCircle,
    'danger',
    'purchase',
    'Compra',
  ),
  'purchase.qr_created': op(
    'QR de compra generado',
    'Se creó un QR para que el cliente reclame los loopoints de su compra.',
    QrCode,
    'info',
    'purchase',
    'Compra',
  ),
  'purchase.qr_claimed': op(
    'Compra reclamada con QR',
    'El cliente reclamó el QR de su compra y recibió los loopoints.',
    BadgeCheck,
    'success',
    'purchase',
    'Compra',
  ),
  'purchase.qr_cancelled': op(
    'QR de compra cancelado',
    'Se canceló un QR de compra antes de que el cliente lo reclamara.',
    XCircle,
    'warning',
    'purchase',
    'Compra',
  ),
  'points.expired': op(
    'Loopoints vencidos',
    'Se vencieron loopoints por antigüedad y se ajustaron los saldos.',
    Clock,
    'warning',
    'points',
    'Loopoints',
  ),
  'reward.created': op(
    'Recompensa creada',
    'Se añadió una recompensa canjeable al catálogo.',
    Gift,
    'success',
    'rewards',
    'Recompensa',
  ),
  'reward.updated': op(
    'Recompensa actualizada',
    'Se editó el costo, las condiciones o la vigencia de una recompensa.',
    Gift,
    'info',
    'rewards',
    'Recompensa',
  ),
  'redemption.requested': op(
    'Canje solicitado',
    'El cliente pidió una recompensa; los loopoints quedaron reservados.',
    Ticket,
    'info',
    'redemption',
    'Canje',
  ),
  'redemption.approved': op(
    'Canje aprobado',
    'Se aprobó la solicitud de canje para entregar la recompensa.',
    BadgeCheck,
    'success',
    'redemption',
    'Canje',
  ),
  'redemption.delivered': op(
    'Recompensa entregada',
    'Se entregó la recompensa y el canje quedó cerrado.',
    BadgeCheck,
    'success',
    'redemption',
    'Canje',
  ),
  'redemption.cancelled': op(
    'Canje cancelado',
    'Se canceló el canje y se devolvieron los loopoints reservados.',
    XCircle,
    'warning',
    'redemption',
    'Canje',
  ),
  'redemption.scanned': op(
    'QR de canje escaneado',
    'El negocio escaneó el QR de un canje para verificarlo.',
    ScanLine,
    'info',
    'redemption',
    'Canje',
  ),
  'redemption.token_reissued': op(
    'QR de canje reemitido',
    'El cliente generó un nuevo código porque el anterior se perdió o venció.',
    RefreshCw,
    'info',
    'redemption',
    'Canje',
  ),
  'membership.admin': op(
    'Administrador añadido',
    'Se añadió un administrador al equipo del negocio.',
    ShieldCheck,
    'warning',
    'team',
    'Miembro del equipo',
  ),
  'membership.created': op(
    'Miembro añadido',
    'Se añadió una persona al equipo del negocio.',
    UserPlus,
    'info',
    'team',
    'Miembro del equipo',
  ),
  'membership.joined': op(
    'Cliente afiliado',
    'Un cliente se unió al negocio por invitación o por una compra con QR.',
    UserPlus,
    'success',
    'team',
    'Miembro del equipo',
  ),
  'membership.permission_updated': op(
    'Permiso de aprobación cambiado',
    'Se cambió si un miembro puede aprobar canjes.',
    ShieldCheck,
    'warning',
    'team',
    'Miembro del equipo',
  ),
  'campaign.created': op(
    'Campaña creada',
    'Se añadió una campaña con multiplicador o bono de loopoints.',
    Megaphone,
    'success',
    'campaign',
    'Campaña',
  ),
  'campaign.updated': op(
    'Campaña actualizada',
    'Se editaron las reglas o la vigencia de una campaña.',
    Megaphone,
    'info',
    'campaign',
    'Campaña',
  ),
  'campaign.deleted': op(
    'Campaña eliminada',
    'Se borró una campaña del negocio.',
    Megaphone,
    'warning',
    'campaign',
    'Campaña',
  ),
  'budget.snapshot': op(
    'Corte de presupuesto guardado',
    'Se guardó una foto mensual del presupuesto de recompensas.',
    CalendarClock,
    'neutral',
    'budget',
    'Presupuesto',
  ),
};

/**
 * Operaciones de la tabla legada `audit_log`, que sigue alimentando la
 * pestaña «Avanzado» (ajustes globales de plataforma). No forman parte del
 * filtro por negocio, por eso viven en un catálogo aparte.
 */
export const LEGACY_AUDIT_LABELS: Record<string, AuditLabel> = {
  'purchase.claimed': op(
    'Compra reclamada',
    'El cliente reclamó su compra y recibió los loopoints.',
    BadgeCheck,
    'success',
    'purchase',
    'Compra',
  ),
  'purchase.created': op(
    'Compra creada',
    'Se generó una compra pendiente de reclamar.',
    ShoppingBag,
    'info',
    'purchase',
    'Compra',
  ),
  'purchase.cancelled': op(
    'Compra cancelada',
    'Se canceló una compra y se descontaron los loopoints que había sumado.',
    XCircle,
    'warning',
    'purchase',
    'Compra',
  ),
  'redemption.created': op(
    'Canje creado',
    'El cliente pidió una recompensa; los loopoints quedaron reservados.',
    Ticket,
    'info',
    'redemption',
    'Canje',
  ),
  'redemption.applied_by_admin': op(
    'Canje aplicado por administración',
    'Un administrador aplicó el canje en nombre de un cliente.',
    ShieldCheck,
    'warning',
    'redemption',
    'Canje',
  ),
  'redemption.cancelled_by_admin': op(
    'Canje cancelado por administración',
    'Un administrador canceló el canje y devolvió los loopoints reservados.',
    XCircle,
    'warning',
    'redemption',
    'Canje',
  ),
  'role.granted': op(
    'Rol concedido',
    'Se concedió un rol de plataforma a un usuario.',
    ShieldCheck,
    'warning',
    'team',
    'Rol de plataforma',
  ),
  'role.revoked': op(
    'Rol revocado',
    'Se quitó un rol de plataforma a un usuario.',
    ShieldCheck,
    'warning',
    'team',
    'Rol de plataforma',
  ),
  'settings.updated': op(
    'Configuración global actualizada',
    'Se cambiaron las reglas generales de la plataforma.',
    Settings,
    'info',
    'configuration',
    'Configuración global',
  ),
};

export const AUDIT_SEVERITY_STYLES: Record<
  AuditSeverity,
  { icon: string; label: string }
> = {
  success: {
    icon: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
    label: 'Positiva',
  },
  info: {
    icon: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
    label: 'Informativa',
  },
  warning: {
    icon: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
    label: 'Requiere atención',
  },
  danger: {
    icon: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
    label: 'Crítica',
  },
  neutral: {
    icon: 'bg-muted text-muted-foreground',
    label: 'Neutra',
  },
};

/**
 * Etiqueta de una operación. Busca primero en el catálogo por negocio y
 * después en el de la auditoría legada de plataforma.
 */
export function getAuditLabel(operation: string): AuditLabel {
  return (
    AUDIT_LABELS[operation] ??
    LEGACY_AUDIT_LABELS[operation] ?? {
      label: humanize(operation.replace('.', ' · ')),
      description: 'Operación registrada en el negocio.',
      icon: Activity,
      severity: 'neutral',
      category: categoryForOperation(operation),
      entityLabel: 'Registro',
    }
  );
}

export function getAuditEntityLabel(entityType: string): string {
  return ENTITY_LABELS[entityType] ?? humanize(entityType);
}

export function getAuditCategory(operation: string): AuditCategory {
  const id = categoryForOperation(operation);
  return AUDIT_CATEGORIES.find((category) => category.id === id) ?? AUDIT_CATEGORIES[0];
}

export function auditOperationsByCategory(categoryId: AuditCategoryId): string[] {
  return Object.entries(AUDIT_LABELS)
    .filter(([, label]) => label.category === categoryId)
    .map(([operation]) => operation);
}

/** Texto corto y humano que resume la fila en la tabla. */
export function auditSubject(
  entry: Pick<BusinessAuditLog, 'operation' | 'metadata'>,
): string {
  const metadata = isRecord(entry.metadata) ? entry.metadata : {};
  const amount = asNumber(metadata.amount_cop);
  const points = asNumber(
    metadata.points_earned ??
      metadata.points_awarded ??
      metadata.points_spent ??
      metadata.points_expired ??
      metadata.points_reversed ??
      metadata.points_refunded,
  );
  const reward = asString(metadata.reward_name);
  const name = asString(metadata.name);
  const nickname = asString(metadata.customer_nickname);
  const role = asString(metadata.role);

  switch (entry.operation) {
    case 'purchase.registered':
    case 'purchase.qr_claimed':
    case 'purchase.qr_created':
    case 'purchase.qr_cancelled': {
      const parts = [
        amount !== null ? `Compra por ${formatCOP(amount)}` : null,
        points !== null ? formatLoopoints(points) : null,
      ].filter(Boolean);
      return parts.length > 0 ? parts.join(' · ') : 'Compra';
    }
    case 'purchase.reverted': {
      const parts = [
        amount !== null ? `Compra por ${formatCOP(amount)}` : null,
        points !== null ? `${formatLoopoints(points)} descontados` : null,
      ].filter(Boolean);
      return parts.length > 0 ? parts.join(' · ') : 'Compra anulada';
    }
    case 'redemption.requested':
    case 'redemption.approved':
    case 'redemption.delivered':
    case 'redemption.scanned': {
      const parts = [
        reward,
        points !== null ? formatLoopoints(points) : null,
      ].filter(Boolean);
      return parts.length > 0 ? parts.join(' · ') : 'Canje';
    }
    case 'redemption.cancelled': {
      const parts = [
        reward,
        points !== null ? `${formatLoopoints(points)} devueltos` : null,
      ].filter(Boolean);
      return parts.length > 0 ? parts.join(' · ') : 'Canje cancelado';
    }
    case 'reward.created':
    case 'reward.updated':
    case 'campaign.created':
    case 'campaign.updated':
    case 'campaign.deleted':
      return name ?? 'Sin nombre';
    case 'membership.admin':
    case 'membership.created':
    case 'membership.joined':
    case 'membership.permission_updated':
      return role ? ROLE_LABELS[role] ?? humanize(role) : 'Miembro del equipo';
    case 'points.expired': {
      const accounts = asNumber(metadata.accounts_affected);
      return [
        points !== null ? formatLoopoints(points) : null,
        accounts !== null ? `${formatNumber(accounts)} clientes` : null,
      ]
        .filter(Boolean)
        .join(' · ');
    }
    case 'budget.snapshot': {
      const period = asString(metadata.period_start);
      return period ? formatDateTimeBogota(period) : 'Corte mensual';
    }
    case 'product.combo_updated': {
      const items = metadata.items;
      return Array.isArray(items)
        ? `${formatNumber(items.length)} componentes`
        : 'Componentes del combo';
    }
    case 'business.created':
    case 'business.updated':
    case 'business.profile_updated':
      return name ?? 'Datos del negocio';
    case 'loyalty_program.configured':
      return 'Reglas de acumulación y presupuesto';
    case 'loyalty_program.frequent_updated':
      return 'Criterios de cliente frecuente';
    case 'economic_profile.updated':
      return 'Ventas, margen y presupuesto';
    case 'business.logo_updated':
      return 'Imagen del negocio actualizada';
    case 'business.logo_removed':
      return 'Imagen del negocio eliminada';
    case 'redemption.token_reissued':
      return 'Nuevo código de canje';
    case 'purchase.claimed':
    case 'purchase.created':
    case 'purchase.cancelled': {
      const parts = [
        amount !== null ? `Compra por ${formatCOP(amount)}` : null,
        points !== null ? formatLoopoints(points) : null,
      ].filter(Boolean);
      return parts.length > 0 ? parts.join(' · ') : 'Compra';
    }
    case 'redemption.created':
    case 'redemption.applied_by_admin':
    case 'redemption.cancelled_by_admin': {
      const parts = [
        reward,
        points !== null ? formatLoopoints(points) : null,
      ].filter(Boolean);
      return parts.length > 0 ? parts.join(' · ') : 'Canje';
    }
    case 'role.granted':
    case 'role.revoked':
      return role ? ROLE_LABELS[role] ?? humanize(role) : 'Rol de plataforma';
    case 'settings.updated':
      return 'Reglas generales de la plataforma';
    default:
      return nickname ?? getAuditEntityLabel(String(metadata.entity_type ?? ''));
  }
}

/** Campos legibles de la metadata y cambios antes/después. */
export function describeAudit(
  entry: Pick<BusinessAuditLog, 'operation' | 'metadata'>,
): AuditDescription {
  const metadata = isRecord(entry.metadata) ? entry.metadata : {};
  const fields: AuditField[] = [];
  const changes: AuditChange[] = [];

  for (const [key, value] of Object.entries(metadata)) {
    if (key === 'before' || key === 'after') continue;

    if (key === 'items' && Array.isArray(value)) {
      fields.push({
        label: FIELD_LABELS.items,
        value:
          value.length === 0
            ? 'Sin componentes'
            : `${formatNumber(value.length)} producto${value.length === 1 ? '' : 's'} del combo`,
      });
      continue;
    }

    if (key === 'data_status' && isRecord(value)) {
      for (const [field, status] of Object.entries(value)) {
        const label = ECONOMIC_STATUS_LABELS[String(status)];
        if (label) {
          fields.push({
            label: fieldLabel(field),
            value: label,
          });
        }
      }
      continue;
    }

    if (isTechnical(key, value)) continue;

    const formatted = formatAuditValue(key, value);
    if (formatted !== null) {
      fields.push({ label: fieldLabel(key), value: formatted });
    }
  }

  const before = isRecord(metadata.before) ? metadata.before : null;
  const after = isRecord(metadata.after) ? metadata.after : null;

  if (before && after) {
    changes.push(...diffAudit(before, after));
  } else if (after) {
    fields.push(...objectFields(after));
  } else if (before) {
    fields.push(...objectFields(before));
  }

  return { fields, changes };
}

function diffAudit(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): AuditChange[] {
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  const changes: AuditChange[] = [];

  for (const key of keys) {
    if (isTechnical(key, before[key]) || isTechnical(key, after[key])) continue;
    const beforeValue = formatAuditValue(key, before[key]);
    const afterValue = formatAuditValue(key, after[key]);
    if (beforeValue === null && afterValue === null) continue;
    if (beforeValue === afterValue) continue;
    changes.push({
      label: fieldLabel(key),
      before: beforeValue ?? 'Sin definir',
      after: afterValue ?? 'Sin definir',
    });
  }

  return changes;
}

function objectFields(value: Record<string, unknown>): AuditField[] {
  const fields: AuditField[] = [];
  for (const [key, item] of Object.entries(value)) {
    if (isTechnical(key, item)) continue;
    const formatted = formatAuditValue(key, item);
    if (formatted !== null) {
      fields.push({ label: fieldLabel(key), value: formatted });
    }
  }
  return fields;
}

function formatAuditValue(key: string, value: unknown): string | null {
  if (value === null || value === undefined || value === '') return 'Sin definir';
  if (typeof value === 'boolean') return value ? 'Sí' : 'No';

  if (typeof value === 'number') {
    if (key.endsWith('_cop') || key === 'amount_cop') return formatCOP(value);
    if (POINT_KEYS.has(key)) return formatLoopoints(value);
    if (key === 'budget_rate') return `${(value * 100).toFixed(2)} %`;
    if (key === 'discount_percentage' || key === 'gross_margin') {
      return `${formatNumber(value)} %`;
    }
    if (key === 'multiplier') return `${formatNumber(value)}×`;
    return formatNumber(value);
  }

  if (typeof value === 'string') {
    if (UUID_RE.test(value)) return null;
    if (DATE_KEYS.has(key)) return formatDateTimeBogota(value);
    if (key === 'role') return ROLE_LABELS[value] ?? humanize(value);
    if (key === 'type') return REWARD_TYPE_LABELS[value] ?? humanize(value);
    if (key === 'channel' || key === 'via' || key === 'source') {
      return CHANNEL_LABELS[value] ?? humanize(value);
    }
    if (key === 'slug') return `/${value}`;
    if (key === 'logo_url') return 'Imagen cargada';
    if (key === 'previous_logo_url') return 'Imagen anterior';
    return value;
  }

  if (Array.isArray(value)) {
    if (key === 'operating_days') {
      if (value.length === 0) return 'Ninguno';
      if (value.length === 7) return 'Todos los días';
      return value
        .map((day) => DAY_NAMES[Number(day)] ?? String(day))
        .join(' · ');
    }
    if (key === 'items') {
      return `${formatNumber(value.length)} componentes`;
    }
    return `${formatNumber(value.length)} elementos`;
  }

  if (isRecord(value)) {
    return `${formatNumber(Object.keys(value).length)} campos`;
  }

  return String(value);
}

function isTechnical(key: string, value: unknown): boolean {
  if (TECHNICAL_KEYS.has(key) || key.endsWith('_id')) return true;
  return typeof value === 'string' && UUID_RE.test(value);
}

function fieldLabel(key: string): string {
  return FIELD_LABELS[key] ?? humanize(key);
}

function humanize(value: string): string {
  const clean = value.replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
  if (!clean) return 'Registro';
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

function categoryForOperation(operation: string): AuditCategoryId {
  return (
    CATEGORY_BY_PREFIX.find(({ prefix }) => operation.startsWith(prefix))?.id ??
    'configuration'
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}
