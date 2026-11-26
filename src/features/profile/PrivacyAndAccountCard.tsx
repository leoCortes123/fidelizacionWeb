import { useEffect, useId, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Download,
  ExternalLink,
  FileCheck2,
  Loader2,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { LEGAL_URLS } from "@/config/legal.config";
import {
  useDeleteMyAccount,
  useExportMyData,
  useLegalConsentsMyList,
} from "@/features/legal/hooks";
import { errorMessage } from "@/lib/errors";
import { formatDateBogota, todayIsoBogota } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ErrorState, ListSkeleton } from "@/components/shared/States";
import type { LegalDocumentType } from "@/types";

const DOCUMENT_META: Record<LegalDocumentType, { label: string; url?: string }> = {
  terms_customer: {
    label: "Términos y Condiciones (clientes)",
    url: LEGAL_URLS.termsCustomer,
  },
  privacy_policy: {
    label: "Política de Tratamiento de Datos",
    url: LEGAL_URLS.privacyPolicy,
  },
  terms_business: {
    label: "Términos para Comercios",
    url: LEGAL_URLS.termsBusiness,
  },
  dpa: {
    label: "Acuerdo de Encargado (DPA)",
    url: LEGAL_URLS.dpa,
  },
  marketing_whatsapp: { label: "Comunicaciones por WhatsApp" },
  marketing_email: { label: "Comunicaciones por correo" },
  marketing_push: { label: "Notificaciones push" },
};

export function PrivacyAndAccountCard({
  variant = "default",
}: {
  variant?: "default" | "customer";
}) {
  const navigate = useNavigate();
  const consents = useLegalConsentsMyList();
  const exportMyData = useExportMyData();
  const deleteMyAccount = useDeleteMyAccount();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [confirmInput, setConfirmInput] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const deleteButtonRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const confirmInputRef = useRef<HTMLInputElement | null>(null);
  const wasOpenRef = useRef(false);
  const dialogTitleId = useId();
  const confirmInputId = useId();

  useEffect(() => {
    if (!deleteDialogOpen) {
      if (wasOpenRef.current) {
        wasOpenRef.current = false;
        deleteButtonRef.current?.focus();
      }
      return;
    }

    wasOpenRef.current = true;
    const frame = window.requestAnimationFrame(() => {
      confirmInputRef.current?.focus();
    });
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !deleteMyAccount.isPending) {
        setDeleteDialogOpen(false);
        return;
      }
      if (event.key === "Tab" && dialogRef.current) {
        const focusables = Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
          ),
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [deleteDialogOpen, deleteMyAccount.isPending]);

  async function handleExportData() {
    try {
      const payload = await exportMyData.mutateAsync();
      const json = JSON.stringify(payload, null, 2);
      const blob = new Blob([json], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `fideliapp-mis-datos-${todayIsoBogota()}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success("Descargamos tus datos en formato JSON.");
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  function openDeleteDialog() {
    setConfirmInput("");
    setDeleteError(null);
    setDeleteDialogOpen(true);
  }

  async function handleConfirmDelete(event: React.FormEvent) {
    event.preventDefault();
    const normalized = confirmInput.trim();
    if (normalized !== "ELIMINAR") {
      setDeleteError('Escribe exactamente "ELIMINAR" para confirmar.');
      confirmInputRef.current?.focus();
      return;
    }

    setDeleteError(null);
    try {
      await deleteMyAccount.mutateAsync(normalized);
      setDeleteDialogOpen(false);
      toast.success("Tu cuenta fue eliminada y tus datos personales fueron anonimizados.");
      navigate("/login", { replace: true });
    } catch (error) {
      setDeleteError(errorMessage(error));
    }
  }

  const body = (
    <div className="space-y-5">
      {/* Políticas aceptadas */}
      <div className="space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold">
            <FileCheck2 className="size-4 text-primary" aria-hidden="true" />
            Políticas y términos aceptados
          </h3>
          <a
            href={LEGAL_URLS.privacyPolicy}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-primary underline underline-offset-2"
          >
            Ver política vigente
            <ExternalLink className="size-3" aria-hidden="true" />
          </a>
        </div>

        {consents.isLoading ? (
          <ListSkeleton rows={2} />
        ) : consents.isError ? (
          <ErrorState error={consents.error} onRetry={() => void consents.refetch()} />
        ) : !consents.data || consents.data.length === 0 ? (
          <p className="rounded-lg border border-border/70 bg-muted/30 px-3 py-2.5 text-xs text-muted-foreground">
            Aún no registramos aceptaciones de políticas en tu historial.
          </p>
        ) : (
          <ul className="space-y-2" data-testid="legal-consents-list">
            {consents.data.map((item) => {
              const meta = DOCUMENT_META[item.document_type] ?? {
                label: item.document_type,
              };
              return (
                <li
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/70 bg-muted/20 px-3 py-2 text-xs"
                >
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex flex-wrap items-center gap-1.5 font-medium text-foreground">
                      {meta.url ? (
                        <a
                          href={meta.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline decoration-border underline-offset-2 hover:text-primary"
                        >
                          {meta.label}
                        </a>
                      ) : (
                        <span>{meta.label}</span>
                      )}
                      {item.business_name && (
                        <span className="text-muted-foreground">· {item.business_name}</span>
                      )}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      Versión {item.document_version} · Aceptada el{" "}
                      {formatDateBogota(item.accepted_at)}
                    </div>
                  </div>
                  <Badge
                    variant={
                      item.revoked_at
                        ? "outline"
                        : item.is_current_version
                          ? "secondary"
                          : "outline"
                    }
                  >
                    {item.revoked_at
                      ? "Revocada"
                      : item.is_current_version
                        ? "Vigente"
                        : "Versión anterior"}
                  </Badge>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Exportar y eliminar cuenta */}
      <div className="space-y-3 border-t border-border/70 pt-4">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold">Portabilidad y supresión de datos</h3>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Puedes descargar una copia en JSON de tu perfil, consentimientos, compras, canjes y
            movimientos, o eliminar definitivamente tu cuenta y anonimizar tus datos personales.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void handleExportData()}
            disabled={exportMyData.isPending || deleteMyAccount.isPending}
          >
            {exportMyData.isPending ? (
              <Loader2 className="animate-spin" aria-hidden="true" />
            ) : (
              <Download aria-hidden="true" />
            )}
            Descargar mis datos
          </Button>

          <Button
            ref={deleteButtonRef}
            type="button"
            variant="destructive"
            size="sm"
            onClick={openDeleteDialog}
            disabled={exportMyData.isPending || deleteMyAccount.isPending}
          >
            <Trash2 aria-hidden="true" />
            Eliminar mi cuenta
          </Button>
        </div>
      </div>

      {/* Modal de confirmación de eliminación */}
      {deleteDialogOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget && !deleteMyAccount.isPending) {
              setDeleteDialogOpen(false);
            }
          }}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={dialogTitleId}
            className="w-full max-w-md rounded-xl border-2 border-[var(--lp-ink,hsl(var(--border)))] bg-background p-5 shadow-xl"
          >
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-destructive/15 text-destructive">
                <AlertTriangle className="size-5" aria-hidden="true" />
              </div>
              <div className="min-w-0 space-y-1">
                <h2 id={dialogTitleId} className="text-base font-bold text-foreground">
                  Eliminar mi cuenta
                </h2>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Esta acción es <strong>irreversible</strong>. Tus datos personales (nombre,
                  correo, alias, teléfono, fecha de nacimiento y foto) se sobrescribirán de forma
                  permanente y tu sesión se cerrará de inmediato.
                </p>
              </div>
            </div>

            <div className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-xs text-destructive">
              <strong>Pérdida de monedas y canjes:</strong> perderás de forma definitiva todas las
              monedas acumuladas y cualquier canje pendiente en los comercios donde participas.
            </div>

            <form onSubmit={(event) => void handleConfirmDelete(event)} className="mt-4 space-y-3">
              <div className="space-y-1.5">
                <label
                  htmlFor={confirmInputId}
                  className="block text-xs font-medium text-foreground"
                >
                  Para confirmar, escribe <code className="font-mono font-bold">ELIMINAR</code>:
                </label>
                <Input
                  id={confirmInputId}
                  ref={confirmInputRef}
                  value={confirmInput}
                  onChange={(event) => {
                    setConfirmInput(event.target.value);
                    if (deleteError) setDeleteError(null);
                  }}
                  placeholder="ELIMINAR"
                  autoComplete="off"
                  spellCheck={false}
                  disabled={deleteMyAccount.isPending}
                />
              </div>

              {deleteError && (
                <div
                  role="alert"
                  className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive"
                >
                  {deleteError}
                </div>
              )}

              <div className="flex flex-wrap justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteDialogOpen(false)}
                  disabled={deleteMyAccount.isPending}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  size="sm"
                  disabled={deleteMyAccount.isPending || confirmInput.trim() !== "ELIMINAR"}
                >
                  {deleteMyAccount.isPending ? (
                    <Loader2 className="animate-spin" aria-hidden="true" />
                  ) : (
                    <Trash2 aria-hidden="true" />
                  )}
                  Confirmar eliminación
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  if (variant === "customer") {
    return (
      <section className="surface-card space-y-4 p-5 sm:p-6" aria-label="Privacidad y cuenta">
        <div className="flex items-center gap-2 border-b border-border/60 pb-3">
          <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
          <h2 className="font-display text-base font-bold">Privacidad y cuenta</h2>
        </div>
        {body}
      </section>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
          Privacidad y cuenta
        </CardTitle>
      </CardHeader>
      <CardContent>{body}</CardContent>
    </Card>
  );
}
