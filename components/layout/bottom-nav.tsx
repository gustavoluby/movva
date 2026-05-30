"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/actions/logout";

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
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
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

const ICON_LOGOUT = (
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
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
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
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

export function BottomNav({ loggedIn }: { loggedIn: boolean }) {
  const pathname = usePathname();

  const items = loggedIn
    ? [
        { href: "/", label: "Descobrir", icon: ICON_SEARCH },
        { href: "/comunidade", label: "Comunidade", icon: ICON_COMMUNITY },
        { href: "/minhas", label: "Minhas", icon: ICON_BOOKMARK },
      ]
    : [
        { href: "/", label: "Descobrir", icon: ICON_SEARCH },
        { href: "/comunidade", label: "Comunidade", icon: ICON_COMMUNITY },
        { href: "/login", label: "Entrar", icon: ICON_LOGIN },
      ];

  return (
    <nav className="bottom-nav">
      {items.map((item) => {
        const active =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-item${active ? " active" : ""}`}
          >
            {item.icon}
            <span>{item.label}</span>
          </Link>
        );
      })}

      {/* Logout via POST (Server Action) — não como link, pra evitar que o
          prefetch do <Link> deslogue a pessoa sem clique. */}
      {loggedIn && (
        <form action={logoutAction} className="nav-logout-form">
          <button type="submit" className="nav-item">
            {ICON_LOGOUT}
            <span>Sair</span>
          </button>
        </form>
      )}
    </nav>
  );
}
