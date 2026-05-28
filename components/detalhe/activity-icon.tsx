// SVGs portados do legacy/index.html — paths exatos do ICONS object.

type IconName =
  | "yoga"
  | "spa"
  | "makeup"
  | "wine"
  | "camera"
  | "gift"
  | "chat"
  | "coffee"
  | "heart"
  | "basket";

const PATHS: Record<IconName, React.ReactNode> = {
  yoga: (
    <>
      <path d="M12 2C9 5 9 11 12 14" />
      <path d="M12 14C15 11 15 5 12 2Z" />
      <path d="M12 14C9 13 5 11 5 8C9 8 12 9 12 14Z" />
      <path d="M12 14C15 13 19 11 19 8C15 8 12 9 12 14Z" />
      <path d="M12 14V22" />
    </>
  ),
  spa: (
    <>
      <path d="M12 2c-3 4-5 7-5 11a5 5 0 0 0 10 0c0-4-2-7-5-11z" />
      <path d="M12 22v-9" />
    </>
  ),
  makeup: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12z" />
    </>
  ),
  wine: (
    <>
      <path d="M7 2h10v6a5 5 0 0 1-10 0z" />
      <line x1="12" y1="13" x2="12" y2="22" />
      <line x1="8" y1="22" x2="16" y2="22" />
    </>
  ),
  camera: (
    <>
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </>
  ),
  gift: (
    <>
      <polyline points="20 12 20 22 4 22 4 12" />
      <rect x="2" y="7" width="20" height="5" />
      <line x1="12" y1="22" x2="12" y2="7" />
      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
    </>
  ),
  chat: (
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  ),
  coffee: (
    <>
      <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4z" />
      <line x1="6" y1="1" x2="6" y2="4" />
      <line x1="10" y1="1" x2="10" y2="4" />
      <line x1="14" y1="1" x2="14" y2="4" />
    </>
  ),
  heart: (
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  ),
  basket: (
    <>
      <path d="M3 7l3-4h12l3 4" />
      <path d="M3 7v13a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V7" />
      <line x1="3" y1="7" x2="21" y2="7" />
      <path d="M9 11v4M15 11v4" />
    </>
  ),
};

export function ActivityIcon({ name }: { name: string | null | undefined }) {
  const path =
    (name && PATHS[name as IconName]) ?? PATHS.yoga;
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {path}
    </svg>
  );
}
