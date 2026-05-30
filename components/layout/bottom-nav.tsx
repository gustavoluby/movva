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

// Pino de localização com check — aba "Checkins".
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
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <polyline points="8.5 9.8 11 12.3 15.5 7.8" />
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

export function BottomNav({ loggedIn }: { loggedIn: boolean }) {
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
        { href: "/comunidade", label: "Checkins", icon: ICON_COMMUNITY },
        { href: "/minhas", label: "Minhas", icon: ICON_BOOKMARK },
        { href: "/perfil", label: "Perfil", icon: ICON_PROFILE },
      ]
    : [
        { href: "/", label: "Experiências", icon: ICON_SEARCH },
        { href: "/comunidade", label: "Checkins", icon: ICON_COMMUNITY },
        { href: "/login", label: "Entrar", icon: ICON_LOGIN },
      ];

  return (
    <nav className="bottom-nav">
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
    </nav>
  );
}
