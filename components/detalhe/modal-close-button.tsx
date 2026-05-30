"use client";

import { useRouter } from "next/navigation";

// Botão "X" no hero quando o detalhe está aberto como modal: fecha o sheet
// (volta pra tela de trás, que continua montada com o scroll preservado).
export function ModalCloseButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      className="hero-btn"
      aria-label="Fechar"
      onClick={() => router.back()}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </button>
  );
}
