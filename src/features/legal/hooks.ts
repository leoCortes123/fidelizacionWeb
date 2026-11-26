import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient as appQueryClient } from "@/app/queryClient";
import { useAuth } from "@/features/auth/AuthProvider";
import { queryKeys } from "@/lib/queryKeys";
import { rpc, supabase } from "@/lib/supabase";
import type {
  AccountDeletionResult,
  LegalConsentHistoryItem,
  LegalConsentRecordResult,
  LegalConsentStatus,
  LegalDocumentType,
} from "@/types";

export interface RecordLegalConsentInput {
  documents: LegalDocumentType[];
  businessId?: string | null;
  sourceRoute: string;
}

export function useLegalConsentStatus(enabled = true) {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery(
    {
      queryKey: queryKeys.legalConsentStatus(userId ?? "anon"),
      queryFn: () => rpc<LegalConsentStatus>("legal_consent_status"),
      enabled: Boolean(userId) && enabled,
      staleTime: 60_000,
    },
    appQueryClient,
  );
}

export function useRecordLegalConsent() {
  const { user } = useAuth();

  return useMutation(
    {
      mutationFn: ({ documents, businessId = null, sourceRoute }: RecordLegalConsentInput) =>
        rpc<LegalConsentRecordResult>("legal_consent_record", {
          p_documents: documents,
          p_business_id: businessId,
          p_source_route: sourceRoute,
          p_user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
        }),
      onSuccess: async () => {
        await appQueryClient.invalidateQueries({
          queryKey: ["legal-consent-status"],
        });
        if (user?.id) {
          await appQueryClient.invalidateQueries({
            queryKey: queryKeys.legalConsentsMyList(user.id),
          });
        }
      },
    },
    appQueryClient,
  );
}

export function useLegalConsent(statusEnabled = true) {
  const status = useLegalConsentStatus(statusEnabled);
  const recordMutation = useRecordLegalConsent();

  return {
    status,
    recordConsent: recordMutation.mutateAsync,
    isRecording: recordMutation.isPending,
    recordError: recordMutation.error,
  };
}

export function useLegalConsentsMyList(enabled = true) {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery(
    {
      queryKey: queryKeys.legalConsentsMyList(userId ?? "anon"),
      queryFn: () => rpc<LegalConsentHistoryItem[]>("legal_consents_my_list"),
      enabled: Boolean(userId) && enabled,
      staleTime: 60_000,
    },
    appQueryClient,
  );
}

export function useExportMyData() {
  return useMutation(
    {
      mutationFn: () => rpc<Record<string, unknown>>("profile_export_my_data"),
    },
    appQueryClient,
  );
}

export function useDeleteMyAccount() {
  const { signOut } = useAuth();

  return useMutation(
    {
      mutationFn: async (confirmText: string) => {
        const result = await rpc<AccountDeletionResult>("account_delete_my_account", {
          p_confirm: confirmText,
        });
        const cleanPaths = (result.avatar_storage_paths ?? [])
          .map((item) => item.trim())
          .filter(Boolean);
        if (cleanPaths.length > 0) {
          try {
            await supabase.storage.from("business-assets").remove(cleanPaths);
          } catch {
            // Limpieza best-effort: la cuenta ya fue anonimizada en la base de datos.
          }
        }
        await signOut();
        return result;
      },
    },
    appQueryClient,
  );
}
