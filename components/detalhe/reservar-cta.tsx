"use client";

import Link from "next/link";
import { useLinkStatus } from "next/link";

// Conteúdo do botão que reage NA HORA do toque: useLinkStatus expõe o estado
// pending do <Link> pai enquanto a próxima tela carrega, então trocamos o
// rótulo pra "Abrindo…" imediatamente, sem esperar o servidor responder.
function CtaContent() {
  const { pending } = useLinkStatus();

  if (pending) {
    return <span className="cta-pending">Abrindo…</span>;
  }

  return (
    <>
      Comprar experiência
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 12h14M13 5l7 7-7 7" />
      </svg>
    </>
  );
}

export function ReservarCta({
  slug,
  soldOut = false,
}: {
  slug: string;
  soldOut?: boolean;
}) {
  if (soldOut) {
    return (
      <button className="cta-btn" disabled aria-disabled>
        Esgotado
      </button>
    );
  }

  return (
    <Link href={`/reservar/${slug}`} prefetch className="cta-btn">
      <CtaContent />
    </Link>
  );
}
