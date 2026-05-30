"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const TABS = [
  { href: "/comunidade", label: "Checkin" },
  { href: "/comunidade/ideias", label: "Ideias" },
  { href: "/comunidade/ranking", label: "Ranking" },
];

// Sub-abas da aba "Elas". Fica no layout (persistente entre as 3 telas) e
// acende a aba na hora do toque, sem esperar a navegação.
export function CommunityTabs() {
  const pathname = usePathname();
  const [pending, setPending] = useState<string | null>(null);
  useEffect(() => setPending(null), [pathname]);
  const current = pending ?? pathname;

  return (
    <nav className="elas-tabs">
      {TABS.map((t) => {
        const active =
          t.href === "/comunidade"
            ? current === "/comunidade"
            : current.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            prefetch
            onClick={() => setPending(t.href)}
            className={`elas-tab${active ? " active" : ""}`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
