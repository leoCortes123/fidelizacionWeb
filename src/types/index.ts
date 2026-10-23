export type AppRole = 'customer' | 'registrar' | 'admin';
export type PurchaseStatus = 'pending_claim' | 'claimed' | 'expired' | 'cancelled';
export type RedemptionStatus = 'pending_delivery' | 'redeemed' | 'cancelled';
export type PointsMovementType =
  | 'purchase_credit'
  | 'redemption_debit'
  | 'redemption_refund'
  | 'expiry_debit'
  | 'admin_adjustment';

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
  amount_cop: number;
  points_awarded: number;
  balance: number;
  claimed_at: string;
}

export interface CreatePurchaseResult {
  purchase_id: string;
  token: string;
  amount_cop: number;
  points_preview: number;
  expires_at: string;
  status: 'pending_claim';
}

export interface StaffCustomer {
  id: string;
  full_name: string;
  email: string;
  points_balance: number;
  purchase_count: number;
  total_spent: number;
  created_at: string;
  total_count: number;
}

export interface CustomerPurchase {
  id: string;
  amount_cop: number;
  points_awarded: number;
  claimed_at: string;
  status: PurchaseStatus;
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
    created_at: string;
  };
  points_balance: number;
  purchase_count: number;
  total_spent: number;
  purchases: CustomerPurchase[];
  movements: CustomerMovement[];
  redemptions: CustomerRedemption[];
}

export interface StaffPurchase {
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
