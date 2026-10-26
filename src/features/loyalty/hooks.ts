import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { rpc } from '@/lib/supabase';
import { queryKeys } from '@/lib/queryKeys';
import type {
  Business,
  BusinessJoinResult,
  BusinessMembership,
  BusinessMembershipWithProfile,
  BusinessPublic,
  BusinessProfile,
  BusinessRegisterResult,
  CustomerBusinessSummary,
  LoyaltyProgram,
  LoyaltyReward,
  LoyaltyRewardAvailable,
  LoyaltyRewardType,
  LoyaltyRedemptionWithCustomer,
  LoyaltyPointAccount,
  LoyaltyPointTransaction,
  MyLoyaltyRedemption,
  Product,
  ProductKind,
  ProfileLookup,
  RedemptionRequestResult,
  RedemptionRedeemResult,
  RedemptionScanContext,
  RedemptionTokenReissueResult,
  RedemptionTokenValidateResult,
  BusinessEconomicDashboard,
  BusinessEconomicProfile,
  BusinessAuditLog,
  BudgetSnapshot,
  EconomicDataStatus,
  EconomicField,
  LoyaltyCampaign,
} from '@/types';

/* ------------------------------------------------------------------ */
/* Negocio                                                            */
/* ------------------------------------------------------------------ */

export function useBusinesses() {
  return useQuery<Business[]>({
    queryKey: queryKeys.businesses,
    queryFn: () => rpc<Business[]>('businesses_list'),
  });
}

/**
 * Resumen del cliente por negocio: saldo, recompensas listas, solicitudes
 * pendientes, última compra y frecuencia. El servidor solo devuelve las
 * membresías del usuario autenticado.
 */
export function useCustomerBusinessesSummary() {
  return useQuery<CustomerBusinessSummary[]>({
    queryKey: queryKeys.customerBusinessesSummary,
    queryFn: () => rpc<CustomerBusinessSummary[]>('customer_businesses_summary'),
  });
}

export function useRegisterBusiness() {
  const queryClient = useQueryClient();
  return useMutation<BusinessRegisterResult, Error, { name: string; slug: string; timezone?: string }>({
    mutationFn: (params) =>
      rpc<BusinessRegisterResult>('business_register', {
        p_business_name: params.name,
        p_slug: params.slug,
        p_timezone: params.timezone ?? 'America/Bogota',
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.businesses });
      void queryClient.invalidateQueries({ queryKey: queryKeys.roles });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.customerBusinessesSummary,
      });
    },
  });
}

export interface BusinessUpdateResult {
  business_id: string;
  name: string;
  slug: string;
  timezone: string;
  operating_days: number[];
  updated_at: string;
}

export function useUpdateBusiness() {
  const queryClient = useQueryClient();
  return useMutation<BusinessUpdateResult, Error, {
    businessId: string;
    name: string;
    timezone: string;
    operatingDays: number[];
  }>({
    mutationFn: (params) =>
      rpc<BusinessUpdateResult>('business_update', {
        p_business_id: params.businessId,
        p_name: params.name,
        p_timezone: params.timezone,
        p_operating_days: params.operatingDays,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.businesses });
    },
  });
}

export function useBusinessProfile(businessId: string) {
  return useQuery<BusinessProfile>({
    queryKey: queryKeys.businessProfile(businessId),
    queryFn: () =>
      rpc<BusinessProfile>('business_profile_get', {
        p_business_id: businessId,
      }),
    enabled: Boolean(businessId),
  });
}

export interface BusinessProfilePayload {
  businessId: string;
  name: string;
  description: string;
  address: string;
  neighborhood: string;
  city: string;
  phoneWhatsapp: string;
  phone: string;
  instagram: string;
  website: string;
}

export function useUpdateBusinessProfile() {
  const queryClient = useQueryClient();
  return useMutation<BusinessProfile, Error, BusinessProfilePayload>({
    mutationFn: (params) =>
      rpc<BusinessProfile>('business_profile_update', {
        p_business_id: params.businessId,
        p_name: params.name,
        p_description: params.description,
        p_address: params.address,
        p_neighborhood: params.neighborhood,
        p_city: params.city,
        p_phone_whatsapp: params.phoneWhatsapp,
        p_phone: params.phone,
        p_instagram: params.instagram,
        p_website: params.website,
      }),
    onSuccess: (_, vars) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.businessProfile(vars.businessId),
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.businesses });
      void queryClient.invalidateQueries({ queryKey: ['business-public'] });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.businessAuditLogPrefix(vars.businessId),
      });
    },
  });
}

export function useSetBusinessLogo() {
  const queryClient = useQueryClient();
  return useMutation<{ business_id: string; logo_url: string | null }, Error, {
    businessId: string;
    logoUrl: string | null;
  }>({
    mutationFn: (params) =>
      rpc<{ business_id: string; logo_url: string | null }>('business_logo_set', {
        p_business_id: params.businessId,
        p_logo_url: params.logoUrl,
      }),
    onSuccess: (_, vars) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.businessProfile(vars.businessId),
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.businesses });
      void queryClient.invalidateQueries({ queryKey: ['business-public'] });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.businessAuditLogPrefix(vars.businessId),
      });
    },
  });
}

export function useBusinessPublic(slug: string) {  return useQuery<BusinessPublic | null>({
    queryKey: queryKeys.businessPublic(slug),
    queryFn: () =>
      rpc<BusinessPublic[] | BusinessPublic>('business_public_get', {
        p_slug: slug,
      }).then((result) => (Array.isArray(result) ? result[0] ?? null : result)),
    enabled: Boolean(slug),
  });
}

export function useJoinBusiness() {
  const queryClient = useQueryClient();
  return useMutation<BusinessJoinResult, Error, { slug: string }>({
    mutationFn: (params) =>
      rpc<BusinessJoinResult>('business_join', { p_slug: params.slug }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.businesses });
      void queryClient.invalidateQueries({ queryKey: queryKeys.roles });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.customerBusinessesSummary,
      });
    },
  });
}

/* ------------------------------------------------------------------ */
/* Membresías                                                         */
/* ------------------------------------------------------------------ */

export function useBusinessMemberships(businessId: string) {
  return useQuery<BusinessMembershipWithProfile[]>({
    queryKey: queryKeys.businessMemberships(businessId),
    queryFn: () => rpc<BusinessMembershipWithProfile[]>('business_memberships_list', { p_business_id: businessId }),
    enabled: Boolean(businessId),
  });
}

export function useCreateBusinessMembership() {
  const queryClient = useQueryClient();
  return useMutation<BusinessMembership, Error, {
    businessId: string;
    userId: string;
    role: 'admin' | 'encargado' | 'cliente';
    canApproveRedemptions: boolean;
  }>({
    mutationFn: (params) =>
      rpc<BusinessMembership>('business_membership_create', {
        p_business_id: params.businessId,
        p_user_id: params.userId,
        p_role: params.role,
        p_can_approve_redemptions: params.canApproveRedemptions,
      }),
    onSuccess: (_, vars) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.businessMemberships(vars.businessId) });
    },
  });
}

export function useUpdateBusinessMembership() {
  const queryClient = useQueryClient();
  return useMutation<BusinessMembership, Error, {
    businessId: string;
    userId: string;
    canApproveRedemptions: boolean;
  }>({
    mutationFn: (params) =>
      rpc<BusinessMembership>('business_membership_update', {
        p_business_id: params.businessId,
        p_user_id: params.userId,
        p_can_approve_redemptions: params.canApproveRedemptions,
      }),
    onSuccess: (_, vars) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.businessMemberships(vars.businessId) });
    },
  });
}

export function useSearchProfiles(businessId: string, query: string) {
  const trimmed = query.trim();
  return useQuery<ProfileLookup[]>({
    queryKey: queryKeys.profileSearch(businessId, trimmed),
    queryFn: () =>
      rpc<ProfileLookup[]>('business_search_profiles', {
        p_business_id: businessId,
        p_query: trimmed,
      }),
    enabled: Boolean(businessId) && trimmed.length >= 2,
  });
}

/* ------------------------------------------------------------------ */
/* Programa de loopoints                                                 */
/* ------------------------------------------------------------------ */

export function useLoyaltyProgram(businessId: string) {
  return useQuery<LoyaltyProgram>({
    queryKey: queryKeys.loyaltyProgram(businessId),
    queryFn: () => rpc<LoyaltyProgram>('loyalty_program_get', { p_business_id: businessId }),
    enabled: Boolean(businessId),
  });
}

export function useConfigureLoyaltyProgram() {
  const queryClient = useQueryClient();
  return useMutation<LoyaltyProgram, Error, {
    businessId: string;
    copPerPointUnit: number;
    pointsPerCopUnit: number;
    pointsExpiryDays: number;
    budgetRate: number;
    firstPurchaseBonusPoints: number;
    recurrenceBonusPoints: number;
    referralBonusPoints: number;
    qrExpiryHours: number;
    isActive?: boolean;
  }>({
    mutationFn: (params) =>
      rpc<LoyaltyProgram>('loyalty_program_configure', {
        p_business_id: params.businessId,
        p_cop_per_point_unit: params.copPerPointUnit,
        p_points_per_cop_unit: params.pointsPerCopUnit,
        p_points_expiry_days: params.pointsExpiryDays,
        p_budget_rate: params.budgetRate,
        p_first_purchase_bonus_points: params.firstPurchaseBonusPoints,
        p_recurrence_bonus_points: params.recurrenceBonusPoints,
        p_referral_bonus_points: params.referralBonusPoints,
        p_qr_expiry_hours: params.qrExpiryHours,
        p_is_active: params.isActive ?? true,
      }),
    onSuccess: (_, vars) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.loyaltyProgram(vars.businessId) });
    },
  });
}

export interface FrequentCriteriaPayload {
  businessId: string;
  minPurchases: number;
  periodDays: number;
  minSpendCop: number;
  activeDays: number;
  recoveryDays: number;
}

export interface FrequentCriteriaResult {
  business_id: string;
  frequent_min_purchases: number;
  frequent_period_days: number;
  frequent_min_spend_cop: number;
  frequent_active_days: number;
  recovery_inactive_days: number;
}

export function useUpdateFrequentCriteria() {
  const queryClient = useQueryClient();
  return useMutation<FrequentCriteriaResult, Error, FrequentCriteriaPayload>({
    mutationFn: (params) =>
      rpc<FrequentCriteriaResult>('loyalty_program_frequent_update', {
        p_business_id: params.businessId,
        p_min_purchases: params.minPurchases,
        p_period_days: params.periodDays,
        p_min_spend_cop: params.minSpendCop,
        p_active_days: params.activeDays,
        p_recovery_days: params.recoveryDays,
      }),
    onSuccess: (_, vars) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.loyaltyProgram(vars.businessId),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.businessAuditLogPrefix(vars.businessId),
      });
      void queryClient.invalidateQueries({ queryKey: ['staff-customers'] });
      void queryClient.invalidateQueries({ queryKey: ['staff-customer'] });
    },
  });
}

/* ------------------------------------------------------------------ */
/* Productos                                                          */
/* ------------------------------------------------------------------ */

export function useProducts(businessId: string, onlyActive: boolean) {
  return useQuery<Product[]>({
    queryKey: queryKeys.products(businessId, onlyActive),
    queryFn: () => rpc<Product[]>('products_list', { p_business_id: businessId, p_only_active: onlyActive }),
    enabled: Boolean(businessId),
  });
}

export function useUpsertProduct() {
  const queryClient = useQueryClient();
  return useMutation<Product, Error, {
    businessId: string;
    id?: string | null;
    name: string;
    description?: string | null;
    priceCop: number;
    costCop?: number | null;
    isActive: boolean;
    kind?: ProductKind;
  }>({
    mutationFn: (params) =>
      rpc<Product>('product_upsert', {
        p_business_id: params.businessId,
        p_id: params.id ?? null,
        p_name: params.name,
        p_description: params.description ?? null,
        p_price_cop: params.priceCop,
        p_cost_cop: params.costCop ?? null,
        p_is_active: params.isActive,
        p_kind: params.kind ?? 'simple',
      }),
    onSuccess: (_, vars) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.products(vars.businessId, true) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.products(vars.businessId, false) });
    },
  });
}

export function useSetProductCombo() {
  const queryClient = useQueryClient();
  return useMutation<{ product_id: string; combo_items: unknown }, Error, {
    businessId: string;
    productId: string;
    items: Array<{ product_id: string; quantity: number }>;
  }>({
    mutationFn: (params) =>
      rpc<{ product_id: string; combo_items: unknown }>('product_combo_set', {
        p_business_id: params.businessId,
        p_product_id: params.productId,
        p_items: params.items,
      }),
    onSuccess: (_, vars) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.products(vars.businessId, true) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.products(vars.businessId, false) });
    },
  });
}

/* ------------------------------------------------------------------ */
/* Recompensas                                                        */
/* ------------------------------------------------------------------ */

export function useLoyaltyRewards(businessId: string, onlyActive: boolean) {
  return useQuery<LoyaltyReward[]>({
    queryKey: queryKeys.loyaltyRewards(businessId, onlyActive),
    queryFn: () => rpc<LoyaltyReward[]>('loyalty_rewards_list', { p_business_id: businessId, p_only_active: onlyActive }),
    enabled: Boolean(businessId),
  });
}

export function useLoyaltyRewardsAvailable(businessId: string, customerId: string) {
  return useQuery<LoyaltyRewardAvailable[]>({
    queryKey: queryKeys.loyaltyRewardsAvailable(businessId, customerId),
    queryFn: () =>
      rpc<LoyaltyRewardAvailable[]>('loyalty_rewards_available', {
        p_business_id: businessId,
        p_customer_id: customerId,
      }),
    enabled: Boolean(businessId) && Boolean(customerId),
  });
}

export function useUpsertLoyaltyReward() {
  const queryClient = useQueryClient();
  return useMutation<LoyaltyReward, Error, {
    businessId: string;
    id?: string | null;
    type: LoyaltyRewardType;
    productId?: string | null;
    name: string;
    description?: string;
    pointsRequired: number;
    minPurchaseAmount?: number;
    maxDiscountAmount?: number | null;
    discountPercentage?: number | null;
    validFrom?: string | null;
    validUntil?: string | null;
    maxRedemptionsPerCustomer?: number | null;
    maxRedemptionsPerPeriod?: number | null;
    redemptionPeriodDays?: number | null;
    totalRedemptionLimit?: number | null;
    isActive: boolean;
  }>({
    mutationFn: (params) =>
      rpc<LoyaltyReward>('loyalty_reward_upsert', {
        p_business_id: params.businessId,
        p_id: params.id ?? null,
        p_type: params.type,
        p_product_id: params.productId ?? null,
        p_name: params.name,
        p_description: params.description ?? '',
        p_points_required: params.pointsRequired,
        p_min_purchase_amount: params.minPurchaseAmount ?? 0,
        p_max_discount_amount: params.maxDiscountAmount ?? null,
        p_discount_percentage: params.discountPercentage ?? null,
        p_valid_from: params.validFrom ?? null,
        p_valid_until: params.validUntil ?? null,
        p_max_redemptions_per_customer: params.maxRedemptionsPerCustomer ?? null,
        p_max_redemptions_per_period: params.maxRedemptionsPerPeriod ?? null,
        p_redemption_period_days: params.redemptionPeriodDays ?? null,
        p_total_redemption_limit: params.totalRedemptionLimit ?? null,
        p_is_active: params.isActive,
      }),
    onSuccess: (_, vars) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.loyaltyRewards(vars.businessId, true) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.loyaltyRewards(vars.businessId, false) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.rewards });
    },
  });
}

/* ------------------------------------------------------------------ */
/* Loopoints y cuenta                                                    */
/* ------------------------------------------------------------------ */

export function useLoyaltyPointAccount(businessId: string, customerId: string) {
  return useQuery<LoyaltyPointAccount>({
    queryKey: queryKeys.loyaltyPointAccount(businessId, customerId),
    queryFn: () =>
      rpc<{ balance: number }>('loyalty_account_balance', {
        p_business_id: businessId,
        p_customer_id: customerId,
      }).then((r) => ({
        id: '',
        business_id: businessId,
        customer_id: customerId,
        balance: r.balance,
        created_at: '',
        updated_at: '',
      })),
    enabled: Boolean(businessId) && Boolean(customerId),
  });
}

export function useLoyaltyPointTransactions(businessId: string, customerId: string) {
  return useQuery<LoyaltyPointTransaction[]>({
    queryKey: queryKeys.loyaltyPointTransactions(businessId, customerId),
    queryFn: () =>
      rpc<LoyaltyPointTransaction[]>('loyalty_account_transactions', {
        p_business_id: businessId,
        p_customer_id: customerId,
      }),
    enabled: Boolean(businessId) && Boolean(customerId),
  });
}

/* ------------------------------------------------------------------ */
/* Redenciones                                                        */
/* ------------------------------------------------------------------ */

export function useRequestRedemption() {
  const queryClient = useQueryClient();
  return useMutation<RedemptionRequestResult, Error, {
    businessId: string;
    rewardId: string;
    idempotencyKey: string;
  }>({
    mutationFn: (params) =>
      rpc<RedemptionRequestResult>('reward_request_redemption', {
        p_business_id: params.businessId,
        p_reward_id: params.rewardId,
        p_idempotency_key: params.idempotencyKey,
      }),
    onSuccess: (_, vars) => {
      // Invalidación por prefijo: las claves reales incluyen el cliente y el estado.
      void queryClient.invalidateQueries({
        queryKey: ['loyalty-rewards-available', vars.businessId],
      });
      void queryClient.invalidateQueries({
        queryKey: ['loyalty-redemptions', vars.businessId],
      });
      void queryClient.invalidateQueries({
        queryKey: ['loyalty-point-account', vars.businessId],
      });
      void queryClient.invalidateQueries({
        queryKey: ['loyalty-point-transactions', vars.businessId],
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.myLoyaltyRedemptions });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.customerBusinessesSummary,
      });
    },
  });
}

export function useLoyaltyRedemptions(
  businessId: string,
  status: string,
  origin: string = '',
) {
  return useQuery<LoyaltyRedemptionWithCustomer[]>({
    queryKey: queryKeys.loyaltyRedemptions(businessId, status, origin),
    queryFn: () =>
      rpc<LoyaltyRedemptionWithCustomer[]>('loyalty_redemptions_list', {
        p_business_id: businessId,
        p_status: status || null,
        p_origin: origin || null,
      }),
    enabled: Boolean(businessId),
  });
}

export function useMyLoyaltyRedemptions() {
  return useQuery<MyLoyaltyRedemption[]>({
    queryKey: queryKeys.myLoyaltyRedemptions,
    queryFn: () =>
      rpc<MyLoyaltyRedemption[]>('loyalty_my_redemptions', {
        p_limit: 100,
        p_offset: 0,
      }),
  });
}

export function useReissueRedemptionToken() {
  const queryClient = useQueryClient();
  return useMutation<RedemptionTokenReissueResult, Error, { redemptionId: string }>({
    mutationFn: (params) =>
      rpc<RedemptionTokenReissueResult>('redemption_token_reissue', {
        p_redemption_id: params.redemptionId,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.myLoyaltyRedemptions });
      void queryClient.invalidateQueries({ queryKey: ['loyalty-redemptions'] });
    },
  });
}

export function useValidateRedemptionToken() {
  return useMutation<RedemptionTokenValidateResult, Error, {
    businessId: string;
    token: string;
  }>({
    mutationFn: (params) =>
      rpc<RedemptionTokenValidateResult>('redemption_token_validate', {
        p_business_id: params.businessId,
        p_token: params.token,
      }),
  });
}

/**
 * Resuelve el negocio y la recompensa de un token QR. El navegador no envía
 * `business_id`: el servidor lo deriva del token y valida la membresía.
 */
export function useRedemptionScanContext(token: string) {
  return useQuery<RedemptionScanContext>({
    queryKey: ['redemption-scan', token],
    queryFn: () =>
      rpc<RedemptionScanContext>('redemption_token_context', { p_token: token }),
    enabled: Boolean(token),
    retry: false,
    staleTime: 0,
    refetchOnWindowFocus: false,
  });
}

export function useRedeemRedemptionByToken() {
  const queryClient = useQueryClient();
  return useMutation<RedemptionRedeemResult, Error, { token: string }>({
    mutationFn: (params) =>
      rpc<RedemptionRedeemResult>('redemption_redeem_by_token', {
        p_token: params.token,
      }),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: ['redemption-scan'] });
      void queryClient.invalidateQueries({
        queryKey: ['loyalty-redemptions', result.business_id],
      });
      void queryClient.invalidateQueries({
        queryKey: ['loyalty-point-account', result.business_id],
      });
      void queryClient.invalidateQueries({
        queryKey: ['loyalty-point-transactions', result.business_id],
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.myLoyaltyRedemptions });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.customerBusinessesSummary,
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.businessAuditLogPrefix(result.business_id),
      });
    },
  });
}

export function useApproveRedemption() {
  const queryClient = useQueryClient();
  return useMutation<{ status: string }, Error, {
    businessId: string;
    redemptionId: string;
    approve: boolean;
  }>({
    mutationFn: (params) =>
      rpc<{ status: string }>('redemption_approve', {
        p_business_id: params.businessId,
        p_redemption_id: params.redemptionId,
        p_approve: params.approve,
      }),
    onSuccess: (_, vars) => {
      void queryClient.invalidateQueries({
        queryKey: ['loyalty-redemptions', vars.businessId],
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.myLoyaltyRedemptions });
    },
  });
}

export function useDeliverRedemption() {
  const queryClient = useQueryClient();
  return useMutation<{ status: string }, Error, {
    businessId: string;
    redemptionId: string;
  }>({
    mutationFn: (params) =>
      rpc<{ status: string }>('redemption_deliver', {
        p_business_id: params.businessId,
        p_redemption_id: params.redemptionId,
      }),
    onSuccess: (_, vars) => {
      void queryClient.invalidateQueries({
        queryKey: ['loyalty-redemptions', vars.businessId],
      });
      void queryClient.invalidateQueries({
        queryKey: ['loyalty-point-account', vars.businessId],
      });
      void queryClient.invalidateQueries({
        queryKey: ['loyalty-point-transactions', vars.businessId],
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.myLoyaltyRedemptions });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.customerBusinessesSummary,
      });
    },
  });
}

export function useCancelRedemption() {
  const queryClient = useQueryClient();
  return useMutation<{ status: string; points_refunded: number }, Error, {
    businessId: string;
    redemptionId: string;
    reason: string;
  }>({
    mutationFn: (params) =>
      rpc<{ status: string; points_refunded: number }>('redemption_cancel', {
        p_business_id: params.businessId,
        p_redemption_id: params.redemptionId,
        p_reason: params.reason,
      }),
    onSuccess: (_, vars) => {
      void queryClient.invalidateQueries({
        queryKey: ['loyalty-redemptions', vars.businessId],
      });
      void queryClient.invalidateQueries({
        queryKey: ['loyalty-point-account', vars.businessId],
      });
      void queryClient.invalidateQueries({
        queryKey: ['loyalty-point-transactions', vars.businessId],
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.myLoyaltyRedemptions });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.customerBusinessesSummary,
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.businessAuditLogPrefix(vars.businessId),
      });
    },
  });
}

/* ------------------------------------------------------------------ */
/* Perfil económico                                                   */
/* ------------------------------------------------------------------ */

export function useBusinessEconomicDashboard(businessId: string) {
  return useQuery<BusinessEconomicDashboard>({
    queryKey: queryKeys.businessEconomicDashboard(businessId),
    queryFn: () => rpc<BusinessEconomicDashboard>('business_dashboard_economic', { p_business_id: businessId }),
    enabled: Boolean(businessId),
  });
}

export function useBusinessEconomicProfile(businessId: string) {
  return useQuery<BusinessEconomicProfile | null>({
    queryKey: queryKeys.businessEconomicProfile(businessId),
    queryFn: () =>
      rpc<BusinessEconomicProfile | null>('business_economic_profile_get', {
        p_business_id: businessId,
      }),
    enabled: Boolean(businessId),
  });
}

export interface EconomicProfilePayload {
  businessId: string;
  dailyAvgSales: number | null;
  monthlyOperationDays: number | null;
  dailyGain: number | null;
  grossMargin: number | null;
  avgCustomersPerDay: number | null;
  maxMonthlyRewardBudget: number | null;
  dataStatus: Partial<Record<EconomicField, EconomicDataStatus>>;
}

export function useUpsertEconomicProfile() {
  const queryClient = useQueryClient();
  return useMutation<{ business_id: string; updated_at: string }, Error, EconomicProfilePayload>({
    mutationFn: (params) =>
      rpc<{ business_id: string; updated_at: string }>('business_economic_profile_upsert', {
        p_business_id: params.businessId,
        p_daily_avg_sales: params.dailyAvgSales,
        p_monthly_operation_days: params.monthlyOperationDays,
        p_daily_gain: params.dailyGain,
        p_gross_margin: params.grossMargin,
        p_avg_customers_per_day: params.avgCustomersPerDay,
        p_max_monthly_reward_budget: params.maxMonthlyRewardBudget,
        p_data_status: params.dataStatus,
      }),
    onSuccess: (_, vars) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.businessEconomicProfile(vars.businessId),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.businessEconomicDashboard(vars.businessId),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.businessAuditLogPrefix(vars.businessId),
      });
    },
  });
}

export function useBusinessAuditLog(
  businessId: string,
  operation = '',
  limit = 50,
  offset = 0,
) {
  return useQuery<BusinessAuditLog[]>({
    queryKey: queryKeys.businessAuditLog(businessId, operation, limit, offset),
    queryFn: () =>
      rpc<BusinessAuditLog[]>('business_audit_log_page', {
        p_business_id: businessId,
        p_operation: operation || null,
        p_limit: limit,
        p_offset: offset,
      }),
    enabled: Boolean(businessId),
  });
}

/* ------------------------------------------------------------------ */
/* Campañas                                                           */
/* ------------------------------------------------------------------ */

export function useLoyaltyCampaigns(businessId: string, onlyActive = false) {
  return useQuery<LoyaltyCampaign[]>({
    queryKey: queryKeys.loyaltyCampaigns(businessId, onlyActive),
    queryFn: () =>
      rpc<LoyaltyCampaign[]>('loyalty_campaign_list', {
        p_business_id: businessId,
        p_only_active: onlyActive,
      }),
    enabled: Boolean(businessId),
  });
}

export interface LoyaltyCampaignPayload {
  businessId: string;
  id?: string | null;
  name: string;
  description?: string;
  multiplier: number;
  bonusPoints: number;
  minPurchaseAmount: number;
  validFrom: string;
  validUntil?: string | null;
  isActive: boolean;
}

export function useUpsertLoyaltyCampaign() {
  const queryClient = useQueryClient();
  return useMutation<LoyaltyCampaign, Error, LoyaltyCampaignPayload>({
    mutationFn: (params) =>
      rpc<LoyaltyCampaign>('loyalty_campaign_upsert', {
        p_business_id: params.businessId,
        p_id: params.id ?? null,
        p_name: params.name,
        p_description: params.description ?? '',
        p_multiplier: params.multiplier,
        p_bonus_points: params.bonusPoints,
        p_min_purchase_amount: params.minPurchaseAmount,
        p_valid_from: params.validFrom,
        p_valid_until: params.validUntil ?? null,
        p_is_active: params.isActive,
      }),
    onSuccess: (_, vars) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.loyaltyCampaigns(vars.businessId, false),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.loyaltyCampaigns(vars.businessId, true),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.businessAuditLogPrefix(vars.businessId),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.loyaltyProgram(vars.businessId),
      });
    },
  });
}

export function useDeleteLoyaltyCampaign() {
  const queryClient = useQueryClient();
  return useMutation<{ campaign_id: string; deleted: boolean }, Error, {
    businessId: string;
    campaignId: string;
  }>({
    mutationFn: (params) =>
      rpc<{ campaign_id: string; deleted: boolean }>('loyalty_campaign_delete', {
        p_business_id: params.businessId,
        p_campaign_id: params.campaignId,
      }),
    onSuccess: (_, vars) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.loyaltyCampaigns(vars.businessId, false),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.loyaltyCampaigns(vars.businessId, true),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.businessAuditLogPrefix(vars.businessId),
      });
    },
  });
}

/* ------------------------------------------------------------------ */
/* Vencimiento de loopoints                                              */
/* ------------------------------------------------------------------ */

export interface PointsExpiryResult {
  lots_expired: number;
  accounts_affected: number;
  points_expired: number;
}

export function useExpirePointsDue() {
  const queryClient = useQueryClient();
  return useMutation<PointsExpiryResult, Error, { businessId: string }>({
    mutationFn: (params) =>
      rpc<PointsExpiryResult>('points_expire_due', {
        p_business_id: params.businessId,
      }),
    onSuccess: (_, vars) => {
      void queryClient.invalidateQueries({
        queryKey: ['loyalty-point-account', vars.businessId],
      });
      void queryClient.invalidateQueries({
        queryKey: ['loyalty-point-transactions', vars.businessId],
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.businessEconomicDashboard(vars.businessId),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.businessAuditLogPrefix(vars.businessId),
      });
    },
  });
}

/* ------------------------------------------------------------------ */
/* Snapshots de presupuesto                                           */
/* ------------------------------------------------------------------ */

export function useBudgetSnapshots(businessId: string, limit = 12) {
  return useQuery<BudgetSnapshot[]>({
    queryKey: queryKeys.budgetSnapshots(businessId, limit),
    queryFn: () =>
      rpc<BudgetSnapshot[]>('loyalty_budget_snapshot_list', {
        p_business_id: businessId,
        p_limit: limit,
        p_offset: 0,
      }),
    enabled: Boolean(businessId),
  });
}

export function useCreateBudgetSnapshot() {
  const queryClient = useQueryClient();
  return useMutation<BudgetSnapshot, Error, { businessId: string }>({
    mutationFn: (params) =>
      rpc<BudgetSnapshot>('loyalty_budget_snapshot_create', {
        p_business_id: params.businessId,
      }),
    onSuccess: (_, vars) => {
      void queryClient.invalidateQueries({
        queryKey: ['budget-snapshots', vars.businessId],
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.businessEconomicDashboard(vars.businessId),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.businessAuditLogPrefix(vars.businessId),
      });
    },
  });
}
