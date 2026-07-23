"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

// Sparkles — estrela principal + estrelinhas, "descobrir novidades".
const ICON_SEARCH = (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
    <path d="M20 3v4" />
    <path d="M22 5h-4" />
    <path d="M4 17v2" />
    <path d="M5 18H3" />
  </svg>
);

const ICON_BOOKMARK = (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
);

const ICON_LOGIN = (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
    <polyline points="10 17 15 12 10 7" />
    <line x1="15" y1="12" x2="3" y2="12" />
  </svg>
);

// Duas pessoas — aba "Elas" (comunidade).
const ICON_COMMUNITY = (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const ICON_PROFILE = (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

// Círculo com "i" — link "Sobre" (só na sidebar de desktop/tablet).
const ICON_INFO = (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

export function BottomNav({
  loggedIn,
  sidebarOnly = false,
}: {
  loggedIn: boolean;
  // "sidebarOnly": some no mobile (a /sobre tem topbar próprio) e só aparece
  // como sidebar no desktop/tablet. Usado fora do grupo (tabs).
  sidebarOnly?: boolean;
}) {
  const pathname = usePathname();

  // Destaque otimista: ao tocar numa aba, ela acende NA HORA, sem esperar a
  // navegação terminar. Quando a rota nova chega, o pathname assume e o
  // estado otimista é zerado.
  const [pending, setPending] = useState<string | null>(null);
  useEffect(() => {
    setPending(null);
  }, [pathname]);

  const current = pending ?? pathname;

  const items = loggedIn
    ? [
        { href: "/", label: "Experiências", icon: ICON_SEARCH },
        { href: "/comunidade", label: "Elas", icon: ICON_COMMUNITY },
        { href: "/minhas", label: "Minhas", icon: ICON_BOOKMARK },
        { href: "/perfil", label: "Perfil", icon: ICON_PROFILE },
      ]
    : [
        { href: "/", label: "Experiências", icon: ICON_SEARCH },
        { href: "/comunidade", label: "Elas", icon: ICON_COMMUNITY },
        { href: "/login", label: "Entrar", icon: ICON_LOGIN },
      ];

  const sobreActive = current.startsWith("/sobre");

  return (
    <nav className={`bottom-nav${sidebarOnly ? " nav-sidebar-only" : ""}`}>
      {/* Marca no topo — só aparece quando a nav vira sidebar (≥768px). */}
      <Link href="/" className="nav-brand" aria-label="Moodpass — início">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/moodpass-logo-horizontal.webp"
          alt="Moodpass"
          className="nav-brand-full"
          width={132}
          height={33}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/moodpass-logo.webp"
          alt="Moodpass"
          className="nav-brand-mark"
          width={50}
          height={31}
        />
      </Link>
      {items.map((item) => {
        const active =
          item.href === "/"
            ? current === "/"
            : current.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch
            onClick={() => setPending(item.href)}
            className={`nav-item${active ? " active" : ""}`}
          >
            {item.icon}
            <span>{item.label}</span>
          </Link>
        );
      })}

      {/* "Sobre" — só aparece quando a nav é sidebar (desktop/tablet).
          No mobile fica escondido via CSS (.nav-item-desktop). */}
      <Link
        href="/sobre"
        prefetch
        className={`nav-item nav-item-desktop${sobreActive ? " active" : ""}`}
      >
        {ICON_INFO}
        <span>Sobre</span>
      </Link>
    </nav>
  );
}
