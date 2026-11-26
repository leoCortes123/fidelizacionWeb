/**
 * Nombre visible de la moneda de la plataforma. En base de datos y RPC se sigue
 * usando `points`; solo cambia el texto que ve el usuario.
 */
export const coinSingular = "moneda";
export const coinPlural = "monedas";

export function coinWord(value: number): string {
  return Math.abs(value) === 1 ? coinSingular : coinPlural;
}

export function coinLabel(value: number): string {
  return `${value} ${coinWord(value)}`;
}
