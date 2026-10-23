import { useQuery } from '@tanstack/react-query';
import { rpc } from '@/lib/supabase';
import { queryKeys } from '@/lib/queryKeys';
import type { CatalogueReward } from '@/types';

export function useRewards() {
  return useQuery({
    queryKey: queryKeys.rewards,
    queryFn: () => rpc<CatalogueReward[]>('list_active_rewards'),
  });
}
