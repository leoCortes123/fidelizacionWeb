import { useMutation, useQueryClient } from '@tanstack/react-query';
import { rpc } from '@/lib/supabase';
import { queryKeys } from '@/lib/queryKeys';
import type { ClaimResult } from '@/types';

export function useClaimPurchase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (token: string) =>
      rpc<ClaimResult>('claim_purchase', { p_token: token }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      void queryClient.invalidateQueries({ queryKey: queryKeys.rewards });
      void queryClient.invalidateQueries({ queryKey: ['my-purchases'] });
    },
  });
}
