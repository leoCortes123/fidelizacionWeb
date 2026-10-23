import { useQuery } from '@tanstack/react-query';
import { rpc } from '@/lib/supabase';
import { queryKeys } from '@/lib/queryKeys';
import type {
  Dashboard,
  MyPurchase,
  MyRedemption,
  ProgramSettings,
} from '@/types';

export function useProgramSettings() {
  return useQuery({
    queryKey: queryKeys.settings,
    queryFn: () => rpc<ProgramSettings>('get_program_settings'),
    staleTime: 60_000,
  });
}

export function useDashboard() {
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: () => rpc<Dashboard>('get_my_dashboard'),
  });
}

export function useMyPurchases(limit: number, offset: number) {
  return useQuery({
    queryKey: queryKeys.myPurchases(limit, offset),
    queryFn: () =>
      rpc<MyPurchase[]>('list_my_purchases', {
        p_limit: limit,
        p_offset: offset,
      }),
  });
}

export function useMyRedemptions() {
  return useQuery({
    queryKey: queryKeys.myRedemptions,
    queryFn: () => rpc<MyRedemption[]>('list_my_redemptions'),
  });
}
