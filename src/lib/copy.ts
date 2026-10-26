/**
 * Nombre visible de la moneda de la plataforma. En base de datos y RPC se sigue
 * usando `points`; solo cambia el texto que ve el usuario.
 */
export const loopointSingular = 'loopoint';
export const loopointPlural = 'loopoints';

export function loopointWord(value: number): string {
  return Math.abs(value) === 1 ? loopointSingular : loopointPlural;
}

export function loopointLabel(value: number): string {
  return `${value} ${loopointWord(value)}`;
}
