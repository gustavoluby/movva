const WEEKDAYS = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];

const MONTHS = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

export function formatEventDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return `${WEEKDAYS[date.getDay()]}, ${d} de ${MONTHS[m - 1]}`;
}

export function eventWeekday(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return WEEKDAYS[date.getDay()];
}

// "19h em diante" → "19h em diante"
// "19h30 às 22h"  → "19h30"
export function eventStartTime(timeStr: string | null): string {
  if (!timeStr) return "";
  return timeStr.split(" às ")[0];
}

export function formatPrice(cents: number): string {
  return `R$ ${Math.round(cents / 100)}`;
}
