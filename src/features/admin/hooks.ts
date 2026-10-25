import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { rpc } from '@/lib/supabase';
import { queryKeys } from '@/lib/queryKeys';
import type {
  AdminCancelRedemptionResult,
  AdminRedeemResult,
  AdminReward,
  AdminSettings,
  AuditEntry,
  ConfigHistoryEntry,
  CustomerDetail,
  StaffCustomer,
} from '@/types';

export function useAdminSettings() {
  return useQuery({
    queryKey: queryKeys.adminSettings,
    queryFn: () => rpc<AdminSettings>('admin_get_settings'),
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (settings: Record<string, unknown>) =>
      rpc<AdminSettings>('admin_update_settings', { p_settings: settings }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.adminSettings });
      void queryClient.invalidateQueries({ queryKey: queryKeys.settings });
      void queryClient.invalidateQueries({ queryKey: queryKeys.configHistory });
      void queryClient.invalidateQueries({ queryKey: queryKeys.auditLog });
    },
  });
}

export function useAdminRewards() {
  return useQuery({
    queryKey: queryKeys.adminRewards,
    queryFn: () => rpc<AdminReward[]>('admin_list_rewards'),
  });
}

export function useUpsertReward() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      id?: string | null;
      name: string;
      description: string;
      pointsCost: number;
      imageUrl: string | null;
      isActive: boolean;
    }) =>
      rpc<AdminReward>('admin_upsert_reward', {
        p_id: params.id ?? null,
        p_name: params.name,
        p_description: params.description,
        p_points_cost: params.pointsCost,
        p_image_url: params.imageUrl,
        p_is_active: params.isActive,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.adminRewards });
      void queryClient.invalidateQueries({ queryKey: queryKeys.rewards });
      void queryClient.invalidateQueries({ queryKey: queryKeys.auditLog });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

export function useAuditLog() {
  return useQuery({
    queryKey: queryKeys.auditLog,
    queryFn: () =>
      rpc<AuditEntry[]>('admin_get_audit_log', { p_limit: 100, p_offset: 0 }),
  });
}

export function useConfigHistory() {
  return useQuery({
    queryKey: queryKeys.configHistory,
    queryFn: () =>
      rpc<ConfigHistoryEntry[]>('admin_get_config_history', { p_limit: 30 }),
  });
}

export function useExpirePoints() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      rpc<{ credits_expired: number; points_expired: number; days: number }>(
        'admin_expire_points',
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      void queryClient.invalidateQueries({ queryKey: ['staff-customers'] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.auditLog });
      void queryClient.invalidateQueries({ queryKey: queryKeys.configHistory });
    },
  });
}

// ---------------------------------------------------------------------
// Operación diaria del administrador
// ---------------------------------------------------------------------
export function useAdminCustomers(
  search: string,
  page: number,
  pageSize: number,
  sort: string,
  direction: string,
) {
  return useQuery({
    queryKey: queryKeys.staffCustomers(search, page, sort, direction),
    queryFn: () =>
      rpc<StaffCustomer[]>('staff_list_customers', {
        p_search: search,
        p_limit: pageSize,
        p_offset: page * pageSize,
        p_sort: sort,
        p_direction: direction,
      }),
  });
}

export function useAdminCustomer(customerId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.staffCustomer(customerId ?? ''),
    queryFn: () =>
      rpc<CustomerDetail>('staff_get_customer', {
        p_customer_id: customerId,
      }),
    enabled: Boolean(customerId),
  });
}

export function useAdminRedeemReward() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      customerId: string;
      rewardId: string;
      idempotencyKey: string;
      reason?: string | null;
    }) =>
      rpc<AdminRedeemResult>('admin_redeem_reward', {
        p_customer_id: params.customerId,
        p_reward_id: params.rewardId,
        p_idempotency_key: params.idempotencyKey,
        p_reason: params.reason?.trim() || null,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['staff-customer'] });
      void queryClient.invalidateQueries({ queryKey: ['staff-customers'] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.adminRewards });
      void queryClient.invalidateQueries({ queryKey: queryKeys.auditLog });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      void queryClient.invalidateQueries({ queryKey: queryKeys.myRedemptions });
    },
  });
}

export function useAdminCancelRedemption() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { redemptionId: string; reason: string }) =>
      rpc<AdminCancelRedemptionResult>('admin_cancel_redemption', {
        p_redemption_id: params.redemptionId,
        p_reason: params.reason,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['staff-customer'] });
      void queryClient.invalidateQueries({ queryKey: ['staff-customers'] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.adminRewards });
      void queryClient.invalidateQueries({ queryKey: queryKeys.auditLog });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      void queryClient.invalidateQueries({ queryKey: queryKeys.myRedemptions });
    },
  });
}
