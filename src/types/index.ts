export type AppRole = 'customer' | 'registrar' | 'admin';
export type PurchaseStatus = 'pending_claim' | 'claimed' | 'expired' | 'cancelled';
export type RedemptionStatus = 'pending_delivery' | 'redeemed' | 'cancelled';
export type PointsMovementType =
  | 'purchase_credit'
  | 'redemption_debit'
  | 'redemption_refund'
  | 'expiry_debit'
  | 'admin_adjustment'
  | 'bonus_credit';

export interface ProgramSettings {
  cop_per_point_unit: number;
  min_purchase_amount: number;
  max_points_per_purchase: number;
  qr_expiry_hours: number;
  points_expiry_days: number | null;
  history_page_size: number;
}

export interface AdminSettings extends ProgramSettings {
  id?: boolean;
  updated_at?: string;
  updated_by?: string | null;
  updated_by_email?: string | null;
}

export interface MyProfile {
  id: string;
  full_name: string;
  email: string;
  nickname: string | null;
  nickname_changes: number;
  nickname_changes_left: number;
  business_count: number;
  created_at: string;
}

export interface Dashboard {
  points_balance: number;
  purchase_count: number;
  total_spent_cop: number;
  ready_rewards: number;
  pending_redemptions: number;
  next_reward: {
    id: string;
    name: string;
    points_cost: number;
    remaining: number;
    image_url: string | null;
  } | null;
}

export interface MyPurchase {
  id: string;
  amount_cop: number;
  points_awarded: number;
  claimed_at: string;
  created_at: string;
  total_count: number;
}

export interface CatalogueReward {
  id: string;
  name: string;
  description: string;
  image_url: string | null;
  points_cost: number;
  balance: number;
  remaining: number;
  can_redeem: boolean;
}

export interface MyRedemption {
  id: string;
  reward_name: string;
  points_spent: number;
  code: string;
  status: RedemptionStatus;
  created_at: string;
  delivered_at: string | null;
  cancelled_at: string | null;
}

export interface ClaimResult {
  purchase_id: string;
  business_id: string;
  business_name: string;
  business_slug: string;
  amount_cop: number;
  points_awarded: number;
  balance: number;
  claimed_at: string;
  duplicate: boolean;
}

/** Datos del QR de venta que se muestran antes de iniciar sesión. */
export interface PurchaseQrPreview {
  purchase_id: string;
  business_id: string;
  business_name: string;
  business_slug: string;
  business_logo_url?: string | null;
  amount_cop: number;
  points_preview: number;
  status: PurchaseStatus;
  claimed: boolean;
  expires_at: string;
  items: PurchaseLine[];
  items_count: number;
}

/** Resultado de generar el QR de una venta en caja. */
export interface PurchaseQrCreateResult {
  purchase_id: string;
  token: string;
  business_id: string;
  business_name: string;
  amount_cop: number;
  points_preview: number;
  expires_at: string;
  status: 'pending_claim';
  items?: PurchaseLine[];
}

/** Venta del negocio en el historial de compras. */
export interface BusinessPurchase {
  id: string;
  amount_cop: number;
  status: PurchaseStatus;
  points_awarded: number;
  created_at: string;
  expires_at: string;
  claimed_at: string | null;
  customer_name: string | null;
  customer_email: string | null;
  registrar_name: string | null;
  total_count: number;
}

export interface StaffCustomer {
  id: string;
  full_name: string;
  email: string;
  nickname: string | null;
  points_balance: number;
  purchase_count: number;
  total_spent: number;
  is_frequent: boolean;
  is_frequent_active: boolean;
  last_purchase_at: string | null;
  created_at: string;
  total_count: number;
}

export interface CustomerPurchase {
  id: string;
  amount_cop: number;
  points_awarded: number;
  claimed_at: string;
  status: PurchaseStatus;
  items_count?: number;
  source?: 'qr' | 'manual';
}

export interface CustomerMovement {
  id: string;
  movement_type: PointsMovementType;
  points: number;
  reason: string | null;
  created_at: string;
}

export interface CustomerRedemption {
  id: string;
  reward_name: string;
  points_spent: number;
  code: string;
  status: RedemptionStatus;
  created_at: string;
  delivered_at: string | null;
  cancelled_at: string | null;
}

export interface CustomerDetail {
  profile: {
    id: string;
    full_name: string;
    email: string;
    nickname?: string | null;
    created_at: string;
  };
  business_id?: string | null;
  is_frequent?: boolean;
  is_frequent_active?: boolean;
  is_recovering?: boolean;
  last_purchase_at?: string | null;
  points_balance: number;
  purchase_count: number;
  total_spent: number;
  purchases: CustomerPurchase[];
  movements: CustomerMovement[];
  redemptions: CustomerRedemption[];
}

export interface StaffRedemption {
  id: string;
  reward_name: string;
  points_spent: number;
  code: string;
  status: RedemptionStatus;
  created_at: string;
  delivered_at: string | null;
  cancelled_at: string | null;
  customer_name: string;
  customer_email: string;
}

export interface RedemptionLookup {
  id: string;
  code: string;
  status: RedemptionStatus;
  reward_name: string;
  points_spent: number;
  created_at: string;
  delivered_at: string | null;
  cancelled_at: string | null;
  customer_name: string;
  customer_email: string;
}

export interface AdminReward {
  id: string;
  name: string;
  description: string;
  image_url: string | null;
  points_cost: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  times_redeemed: number;
}

export interface StaffMember {
  user_id: string;
  full_name: string;
  email: string;
  roles: string[];
  created_at: string;
}

export interface ProfileSearchResult {
  user_id: string;
  full_name: string;
  email: string;
  roles: string[];
  created_at: string;
}

export interface AuditEntry {
  id: string;
  actor_email: string | null;
  operation: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface ConfigHistoryEntry {
  id: number;
  changed_by_email: string | null;
  before_value: Record<string, unknown>;
  after_value: Record<string, unknown>;
  created_at: string;
}

export interface AdminRedeemResult {
  redemption_id: string;
  reward_name: string;
  points_spent: number;
  code: string;
  balance: number;
  created_at: string;
  duplicate: boolean;
}

export interface AdminCancelRedemptionResult {
  redemption_id: string;
  status: RedemptionStatus;
  points_refunded: number;
  balance: number;
}

// ---------------------------------------------------------------------
// Negocio y membresías (aislamiento multiempresa)
// ---------------------------------------------------------------------
export type BusinessRole = 'admin' | 'encargado' | 'cliente';

export interface Business {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  operating_days: number[];
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  /** Rol del usuario autenticado en este negocio (lo devuelve businesses_list). */
  role: BusinessRole;
  can_approve_redemptions: boolean;
}

export interface BusinessMembership {
  id: string;
  business_id: string;
  user_id: string;
  role: BusinessRole;
  can_approve_redemptions: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface BusinessMembershipWithProfile extends BusinessMembership {
  full_name: string;
  email: string;
}

export interface BusinessRegisterResult {
  business_id: string;
  membership_id: string;
  role: BusinessRole;
  created_at: string;
}

// ---------------------------------------------------------------------
// Programa de loopoints y productos (por negocio)
// ---------------------------------------------------------------------
export interface LoyaltyProgram {
  id: string;
  business_id: string;
  cop_per_point_unit: number;
  points_per_cop_unit: number;
  points_expiry_days: number;
  budget_rate: number;
  first_purchase_bonus_points: number;
  recurrence_bonus_points: number;
  referral_bonus_points: number;
  qr_expiry_hours: number;
  frequent_min_purchases: number;
  frequent_period_days: number;
  frequent_min_spend_cop: number;
  frequent_active_days: number;
  recovery_inactive_days: number;
  is_active: boolean;
  configured_by: string | null;
  configured_at: string | null;
  created_at: string;
  updated_at: string;
}

export type LoyaltyRewardType =
  | 'free_product'
  | 'fixed_discount'
  | 'percentage_discount'
  | 'configurable_benefit';

export interface LoyaltyReward {
  id: string;
  business_id: string;
  product_id: string | null;
  type: LoyaltyRewardType;
  name: string;
  description: string;
  points_required: number;
  min_purchase_amount: number;
  max_discount_amount: number | null;
  discount_percentage: number | null;
  product_price_cop: number | null;
  product_cost_cop: number | null;
  is_active: boolean;
  valid_from: string | null;
  valid_until: string | null;
  max_redemptions_per_customer: number | null;
  max_redemptions_per_period: number | null;
  redemption_period_days: number | null;
  total_redemption_limit: number | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  times_redeemed: number;
}

export interface LoyaltyRewardAvailable extends LoyaltyReward {
  balance: number;
  remaining: number;
  can_redeem: boolean;
}

export type ProductKind = 'simple' | 'combo';

export interface ComboItem {
  product_id: string;
  name: string;
  quantity: number;
  unit_price_cop: number;
}

export interface Product {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  price_cop: number;
  cost_cop: number | null;
  is_active: boolean;
  kind: ProductKind;
  combo_items: ComboItem[];
  created_at: string;
  updated_at: string;
}

/** Línea snapshot de una compra. */
export interface PurchaseLine {
  id: string;
  product_id: string | null;
  name: string;
  quantity: number;
  unit_price_cop: number;
  line_total_cop: number;
  is_combo: boolean;
  combo_detail: ComboItem[];
}

export interface PurchaseDetail {
  purchase: {
    id: string;
    business_id: string;
    amount_cop: number;
    status: PurchaseStatus;
    points_awarded: number;
    created_at: string;
    expires_at?: string;
    claimed_at: string | null;
    cancelled_at?: string | null;
    cancellation_reason?: string | null;
  };
  business: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
  };
  customer?: {
    id: string;
    full_name: string;
    nickname: string | null;
    email: string;
  } | null;
  registrar?: {
    id: string;
    full_name: string;
    email: string;
  } | null;
  items: PurchaseLine[];
  items_count: number;
}

export interface BusinessPurchasePageRow extends BusinessPurchase {
  customer_nickname: string | null;
  items_count: number;
}

export interface MyPurchasePageRow {
  id: string;
  business_id: string;
  business_name: string;
  business_slug: string;
  business_logo_url: string | null;
  amount_cop: number;
  points_awarded: number;
  claimed_at: string | null;
  created_at: string;
  items_count: number;
  total_count: number;
}

export interface DashboardSummary {
  business_id: string;
  points_outstanding: number;
  points_issued_total: number;
  points_redeemed_total: number;
  pending_redemptions: number;
  approved_pending_delivery: number;
  frequent_customers: number;
  active_customers: number;
  customers_total: number;
  sales_today_cop: number;
  sales_month_cop: number;
  purchases_today: number;
  purchases_month: number;
  pending_qr_count: number;
  budget_committed_percent: number;
  last_activity_at: string | null;
  calculated_at: string;
}

export interface RecentActivity {
  id: string;
  kind: 'purchase' | 'redemption';
  title: string;
  detail: string;
  points: number | null;
  amount_cop: number | null;
  status: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------
// Cuenta y movimientos de loopoints
// ---------------------------------------------------------------------
export interface LoyaltyPointAccount {
  id: string;
  business_id: string;
  customer_id: string;
  balance: number;
  created_at: string;
  updated_at: string;
}

export type PointMovementType =
  | 'purchase_credit'
  | 'redemption_debit'
  | 'redemption_refund'
  | 'expiry_debit'
  | 'admin_adjustment'
  | 'bonus_credit';

export interface LoyaltyPointTransaction {
  id: string;
  business_id: string;
  account_id: string;
  movement_type: PointMovementType;
  points: number;
  reference_type: string | null;
  reference_id: string | null;
  reason: string | null;
  idempotency_key: string;
  created_by: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------
// Redenciones y tokens QR
// ---------------------------------------------------------------------
export type RedemptionRequestStatus =
  | 'pending'
  | 'approved'
  | 'delivered'
  | 'cancelled'
  | 'expired';

export interface LoyaltyRedemption {
  id: string;
  business_id: string;
  account_id: string;
  reward_id: string;
  reward_name: string;
  reward_type: LoyaltyRewardType;
  points_spent: number;
  code: string;
  status: RedemptionRequestStatus;
  idempotency_key: string;
  created_by: string | null;
  created_at: string;
  approved_by: string | null;
  approved_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  origin: RedemptionOrigin;
}

export interface LoyaltyRedemptionWithCustomer extends LoyaltyRedemption {
  customer_id: string;
  customer_email: string;
  customer_nickname: string | null;
}

export type RedemptionOrigin = 'manual' | 'qr_scan';

/** Contexto de `/scan/:token`: el negocio lo resuelve el servidor. */
export interface RedemptionScanContext {
  business_id: string;
  business_name: string;
  business_slug: string;
  business_logo_url: string | null;
  redemption_id: string;
  code: string;
  reward_name: string;
  reward_type: LoyaltyRewardType;
  points_spent: number;
  customer_id: string;
  customer_nickname: string | null;
  status: RedemptionRequestStatus;
  origin: RedemptionOrigin;
  created_at: string;
  expires_at: string;
  consumed_at: string | null;
  approved_at: string | null;
  delivered_at: string | null;
  can_redeem: boolean;
  reason: string | null;
  role: BusinessRole;
}

export interface RedemptionRedeemResult {
  business_id: string;
  redemption_id: string;
  code: string;
  reward_name: string;
  points_spent: number;
  customer_nickname: string | null;
  status: 'delivered';
  origin: RedemptionOrigin;
  delivered_at: string;
  role: BusinessRole;
}

export interface RedemptionTokenValidateResult {
  redemption_id: string;
  reward_name: string;
  reward_type: LoyaltyRewardType;
  points_spent: number;
  status: RedemptionRequestStatus;
  customer_id: string;
  expires_at: string;
  can_approve: boolean;
}

export interface RedemptionRequestResult {
  redemption_id: string;
  reward_name: string;
  points_spent: number;
  code: string;
  status: RedemptionRequestStatus;
  token: string;
  expires_at: string;
  duplicate: boolean;
}

// ---------------------------------------------------------------------
// Perfil económico del negocio
// ---------------------------------------------------------------------
export type EconomicDataStatus = 'confirmed' | 'estimated' | 'unknown';

export type EconomicField =
  | 'daily_avg_sales'
  | 'monthly_operation_days'
  | 'daily_gain'
  | 'gross_margin'
  | 'avg_customers_per_day'
  | 'max_monthly_reward_budget';

export interface BusinessEconomicProfile {
  id: string;
  business_id: string;
  daily_avg_sales: number | null;
  monthly_operation_days: number | null;
  daily_gain: number | null;
  gross_margin: number | null;
  avg_customers_per_day: number | null;
  max_monthly_reward_budget: number | null;
  data_status: Partial<Record<EconomicField, EconomicDataStatus>>;
  updated_by: string | null;
  updated_at: string;
}

export interface BusinessEconomicDashboard {
  business_id: string;
  monthly_estimated_sales_cop: number;
  reference_budget_cop: number;
  budget_rate: number;
  redeemed_rewards_cost_cop: number;
  pending_rewards_cost_cop: number;
  reserved_rewards_cost_cop: number;
  remaining_budget_cop: number;
  budget_committed_percent: number;
  max_monthly_reward_budget_cop: number;
  data_status: Record<string, unknown>;
  estimated: boolean;
  calculated_at: string;
}

// ---------------------------------------------------------------------
// Evento de compra y auditoría del negocio
// ---------------------------------------------------------------------
export interface LoyaltyPurchaseEvent {
  id: string;
  business_id: string;
  account_id: string;
  purchase_id: string | null;
  amount_cop: number;
  eligible_amount_cop: number;
  points_earned: number;
  rule_version: string | null;
  created_at: string;
}

export interface BusinessAuditLog {
  id: string;
  business_id: string;
  actor_email: string | null;
  operation: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  /** Presente en `business_audit_log_page` (total de filas del filtro). */
  total_count?: number;
}

// ---------------------------------------------------------------------
// Campañas y snapshots de presupuesto
// ---------------------------------------------------------------------
export interface LoyaltyCampaign {
  id: string;
  business_id: string;
  name: string;
  description: string;
  multiplier: number;
  bonus_points: number;
  min_purchase_amount: number;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
  is_current: boolean;
  created_at: string;
  updated_at: string;
}

export interface BudgetSnapshot {
  id: string;
  period_start: string;
  period_end: string;
  monthly_sales_cop: number;
  budget_rate: number;
  reference_budget_cop: number;
  max_budget_cop: number;
  redeemed_cost_cop: number;
  pending_cost_cop: number;
  points_issued: number;
  points_redeemed: number;
  created_at: string;
  total_count?: number;
}

// ---------------------------------------------------------------------
// Afiliación, búsqueda de perfiles y redenciones del cliente
// ---------------------------------------------------------------------
export interface BusinessPublic {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  operating_days: number[];
  is_active: boolean;
  loyalty_active: boolean;
  description: string | null;
  logo_url: string | null;
  address: string | null;
  neighborhood: string | null;
  city: string | null;
  phone_whatsapp: string | null;
  instagram: string | null;
  website: string | null;
}

export interface BusinessProfile {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  operating_days: number[];
  is_active: boolean;
  description: string | null;
  address: string | null;
  neighborhood: string | null;
  city: string | null;
  phone_whatsapp: string | null;
  phone: string | null;
  instagram: string | null;
  website: string | null;
  logo_url: string | null;
  updated_at: string;
}

export interface BusinessCustomerFrequency {
  purchase_count: number;
  total_spent_cop: number;
  last_purchase_at: string | null;
  is_frequent: boolean;
  is_frequent_active: boolean;
  is_recovering: boolean;
}

export interface BusinessJoinResult {
  business_id: string;
  business_name: string;
  slug: string;
  membership_id: string;
  role: BusinessRole;
  already_member: boolean;
}

export interface ProfileLookup {
  user_id: string;
  full_name: string;
  email: string;
  already_member: boolean;
}

/** Fila del resumen multi-negocio del cliente (RPC customer_businesses_summary). */
export interface CustomerBusinessSummary {
  business_id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  role: BusinessRole;
  loyalty_active: boolean;
  balance: number;
  ready_rewards: number;
  pending_redemptions: number;
  last_purchase_at: string | null;
  is_frequent: boolean;
  is_frequent_active: boolean;
}

export interface MyLoyaltyRedemption {
  id: string;
  business_id: string;
  business_name: string;
  business_slug?: string;
  business_logo_url?: string | null;
  reward_name: string;
  reward_type: LoyaltyRewardType;
  points_spent: number;
  code: string;
  status: RedemptionRequestStatus;
  created_at: string;
  approved_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
}

export interface RedemptionTokenReissueResult {
  redemption_id: string;
  token: string;
  expires_at: string;
}

