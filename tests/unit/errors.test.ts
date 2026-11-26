import { describe, expect, it } from "vitest";
import { errorMessage, isBusinessError } from "@/lib/errors";

describe("mensajes de error", () => {
  it("traduce códigos de negocio del servidor", () => {
    expect(errorMessage(new Error("purchase_already_claimed"))).toContain("ya fue reclamada");
    expect(errorMessage({ message: "insufficient_points" })).toContain("monedas suficientes");
    expect(errorMessage(new Error("purchase_expired"))).toContain("expiró");
  });

  it("traduce errores de permisos de PostgreSQL", () => {
    expect(errorMessage(new Error("permission denied for table points_ledger"))).toContain(
      "permiso",
    );
  });

  it("conserva mensajes desconocidos", () => {
    expect(errorMessage(new Error("algo raro"))).toBe("algo raro");
  });

  it("detecta errores de negocio para no reintentar", () => {
    expect(isBusinessError(new Error("rate_limited"))).toBe(true);
    expect(isBusinessError(new Error("TypeError: fetch failed"))).toBe(false);
  });

  it("explica los límites de canje y descuentos", () => {
    expect(errorMessage(new Error("reward_period_limit_reached"))).toContain("periodo");
    expect(errorMessage(new Error("reward_total_limit_reached"))).toContain("límite total");
    expect(errorMessage(new Error("discount_exceeds_min_purchase"))).toContain(
      "no puede superar la compra mínima",
    );
  });

  it("explica los timeouts de conexión", () => {
    expect(errorMessage(new Error("La conexión con el servidor tardó demasiado."))).toContain(
      "tardó demasiado en responder",
    );
  });

  it("explica la restricción de edad mínima en la fecha de nacimiento", () => {
    expect(errorMessage(new Error("underage_birth_date"))).toContain("mayor de 18 años");
    expect(isBusinessError(new Error("underage_birth_date"))).toBe(true);
  });

  it("explica los códigos de consentimiento legal y revocación", () => {
    expect(errorMessage(new Error("LEGAL_CONSENT_REQUIRED"))).toContain("DPA");
    expect(isBusinessError(new Error("LEGAL_CONSENT_REQUIRED"))).toBe(true);
    expect(errorMessage(new Error("consent_revoke_requires_account_deletion"))).toContain(
      "eliminar tu cuenta",
    );
    expect(isBusinessError(new Error("consent_revoke_requires_account_deletion"))).toBe(true);
    expect(errorMessage(new Error("invalid_legal_documents"))).toContain("documento legal");
    expect(isBusinessError(new Error("invalid_legal_documents"))).toBe(true);
    expect(errorMessage(new Error("invalid_source_route"))).toContain("aceptación legal");
    expect(isBusinessError(new Error("invalid_source_route"))).toBe(true);
    expect(errorMessage(new Error("profile_not_found"))).toContain("perfil");
    expect(isBusinessError(new Error("profile_not_found"))).toBe(true);
    expect(errorMessage(new Error("legal_consents_are_immutable"))).toContain("inmutable");
    expect(isBusinessError(new Error("legal_consents_are_immutable"))).toBe(true);
  });

  it("explica los códigos de exportación y eliminación de cuenta", () => {
    expect(errorMessage(new Error("ACCOUNT_LAST_ADMIN"))).toContain("único administrador activo");
    expect(isBusinessError(new Error("ACCOUNT_LAST_ADMIN"))).toBe(true);
    expect(errorMessage(new Error("invalid_delete_confirmation"))).toContain("ELIMINAR");
    expect(isBusinessError(new Error("invalid_delete_confirmation"))).toBe(true);
    expect(errorMessage(new Error("account_deleted"))).toContain("fue eliminada");
    expect(isBusinessError(new Error("account_deleted"))).toBe(true);
    expect(errorMessage(new Error("account_already_deleted"))).toContain("ya fue eliminada");
    expect(isBusinessError(new Error("account_already_deleted"))).toBe(true);
    expect(errorMessage(new Error("account_deletion_log_is_immutable"))).toContain("inmutable");
    expect(isBusinessError(new Error("account_deletion_log_is_immutable"))).toBe(true);
  });
});
