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

// "há 2h", "há 3 dias", "agora" — tempo relativo pro feed.
export function timeAgo(iso: string | null): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  const diffMs = Date.now() - then;
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min}min`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `há ${days}${days === 1 ? " dia" : " dias"}`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `há ${weeks}sem`;
  const months = Math.floor(days / 30);
  return `há ${months}${months === 1 ? " mês" : " meses"}`;
}

// "19 jul" — pílula de data curta (dia + mês abreviado) a partir de um ISO.
export function shortDay(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const day = d.getDate();
  const mon = MONTHS[d.getMonth()].slice(0, 3);
  return `${day} ${mon}`;
}

// "MAIO" — nome do mês em maiúsculas, p/ o card da jornada.
export function monthNameUpper(date: Date): string {
  return MONTHS[date.getMonth()].toUpperCase();
}

// "2026-05-30" — data de hoje (local) em ISO curto, p/ comparar com event_date.
export function todayISO(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

// "mar/26" — mês abreviado + ano de 2 dígitos, p/ "membro desde".
export function memberSince(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const mon = MONTHS[d.getMonth()].slice(0, 3);
  const yy = String(d.getFullYear()).slice(-2);
  return `${mon}/${yy}`;
}

export function formatPrice(cents: number): string {
  return `R$ ${Math.round(cents / 100)}`;
}

// Com centavos, formato pt-BR: 100 → "R$ 1,00", 17900 → "R$ 179,00"
export function formatPriceFull(cents: number): string {
  return `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;
}
