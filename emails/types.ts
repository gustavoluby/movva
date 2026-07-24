// Tipos das props dos emails — type-safe, desacoplado do schema do banco.
export type EmailUser = {
  fullName: string;
  email?: string;
};

export type EmailEvent = {
  slug: string;
  title: string;
  subtitle?: string | null;
  eventDate: string; // "2026-08-18"
  eventTime?: string | null;
  locationName: string;
  locationAddress?: string | null;
  imageUrl?: string | null;
  // "O que levar": lista (um item por linha) + se a seção deve aparecer.
  whatToBring?: string | null;
  showWhatToBring?: boolean | null;
};

export type EmailBooking = {
  id: string;
  amountCents: number;
  paymentMethod?: string | null; // 'pix' | 'card'
};
