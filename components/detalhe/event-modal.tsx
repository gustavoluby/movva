"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Sheet que sobe de baixo (estilo Instagram) sobre a tela atual. A página de
// trás continua montada (intercepting route), então o scroll dela é preservado.
// Fechar = router.back() (backdrop, ESC ou botão X no hero).
export function EventModal({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") router.back();
    }
    document.addEventListener("keydown", onKey);
    // trava o scroll do fundo enquanto o sheet está aberto
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [router]);

  return (
    <>
      <div
        className="event-modal-backdrop"
        onClick={() => router.back()}
        aria-hidden
      />
      <div className="event-modal-sheet" role="dialog" aria-modal="true">
        {children}
      </div>
    </>
  );
}
