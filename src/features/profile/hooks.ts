import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { rpc } from "@/lib/supabase";
import { queryKeys } from "@/lib/queryKeys";
import type { MyProfile } from "@/types";

/**
 * Perfil del usuario autenticado. Antes de leerlo se garantiza el nickname
 * (el servidor lo genera si el perfil es heredado y no cuenta como cambio).
 */
export function useMyProfile(enabled = true) {
  return useQuery<MyProfile>({
    queryKey: queryKeys.profile,
    queryFn: async () => {
      try {
        await rpc<string>("profile_nickname_ensure");
      } catch {
        // Una API anterior no tiene la RPC: el perfil se muestra sin alias.
      }
      return rpc<MyProfile>("get_my_profile");
    },
    enabled,
    staleTime: 60_000,
  });
}

export function useNicknameAvailable(nickname: string) {
  const value = nickname.trim().toLowerCase();
  return useQuery<boolean>({
    queryKey: queryKeys.nicknameAvailable(value),
    queryFn: () => rpc<boolean>("profile_nickname_available", { p_nickname: value }),
    enabled: value.length >= 3,
    staleTime: 15_000,
  });
}

export interface ProfileUpdateResult {
  id: string;
  full_name: string;
  email: string;
  nickname: string | null;
  nickname_changes: number;
  nickname_changes_left: number;
  phone?: string | null;
  birth_date?: string | null;
  business_count: number;
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation<
    ProfileUpdateResult,
    Error,
    {
      fullName: string;
      nickname: string | null;
      phone?: string | null;
      birthDate?: string | null;
      clearBirthDate?: boolean;
    }
  >({
    mutationFn: (params) =>
      rpc<ProfileUpdateResult>("profile_update", {
        p_full_name: params.fullName,
        p_nickname: params.nickname,
        ...(params.phone !== undefined ? { p_phone: params.phone } : {}),
        ...(params.birthDate !== undefined ? { p_birth_date: params.birthDate } : {}),
        ...(params.clearBirthDate ? { p_clear_birth_date: true } : {}),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData<MyProfile>(queryKeys.profile, (current) =>
        current ? { ...current, ...data } : current,
      );
      void queryClient.invalidateQueries({ queryKey: queryKeys.profile });
    },
  });
}
