const MONTHS_DA = ['jan','feb','mar','apr','maj','jun','jul','aug','sep','okt','nov','dec'];

function asDate(input: Date | string): Date {
  return input instanceof Date ? input : new Date(input);
}

export function formatDate(input: Date | string): string {
  const d = asDate(input);
  return `${d.getDate()}. ${MONTHS_DA[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatDateShort(input: Date | string): string {
  const d = asDate(input);
  return `${d.getDate()} · ${MONTHS_DA[d.getMonth()].toUpperCase()}`;
}
