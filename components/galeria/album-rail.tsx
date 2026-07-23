"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { GaleriaItem } from "@/lib/galeria";
import { AlbumVideo } from "./album-video";

/**
 * Trilho do álbum. As fotos abrem em tela cheia (o vídeo continua tocando no
 * próprio card — abrir vídeo em overlay só atrapalharia).
 *
 * O overlay vai num portal pro <body>: o trilho tem `overflow-x: auto` e, na
 * /sobre, um ancestral anima `transform` — os dois quebram `position: fixed`.
 */
export function AlbumRail({ items }: { items: GaleriaItem[] }) {
  const fotos = items.filter((i) => i.type === "photo");
  const [aberta, setAberta] = useState<number | null>(null);
  // Devolve o foco pro card de onde a foto foi aberta quando o overlay fecha.
  const origem = useRef<HTMLButtonElement | null>(null);

  const abrir = (indice: number) => (e: React.MouseEvent<HTMLButtonElement>) => {
    origem.current = e.currentTarget;
    setAberta(indice);
  };

  const fechar = useCallback(() => {
    setAberta(null);
    origem.current?.focus();
  }, []);

  let indiceFoto = -1;

  return (
    <>
      <div className="galeria-rail">
        {items.map((item) => {
          if (item.type === "video") {
            return (
              <figure
                key={item.src}
                className="galeria-card"
                style={{ aspectRatio: item.ratio }}
              >
                <AlbumVideo
                  src={item.src}
                  poster={item.poster}
                  alt={item.alt}
                />
              </figure>
            );
          }

          indiceFoto += 1;
          const meuIndice = indiceFoto;

          return (
            <button
              key={item.src}
              type="button"
              className="galeria-card galeria-card-btn"
              style={{ aspectRatio: item.ratio }}
              onClick={abrir(meuIndice)}
              aria-label={`Ampliar foto: ${item.alt}`}
            >
              <Image
                className="galeria-media"
                src={item.src}
                alt={item.alt}
                fill
                sizes="260px"
              />
            </button>
          );
        })}
      </div>

      {aberta !== null && (
        <Lightbox fotos={fotos} inicial={aberta} onFechar={fechar} />
      )}
    </>
  );
}

type Foto = Extract<GaleriaItem, { type: "photo" }>;

function Lightbox({
  fotos,
  inicial,
  onFechar,
}: {
  fotos: Foto[];
  inicial: number;
  onFechar: () => void;
}) {
  const [i, setI] = useState(inicial);
  const [montado, setMontado] = useState(false);
  const fecharRef = useRef<HTMLButtonElement>(null);
  const toqueX = useRef<number | null>(null);

  const total = fotos.length;
  // Circular: da última volta pra primeira. Com o contador na tela ninguém se
  // perde, e evita seta morta no fim do álbum.
  const anterior = useCallback(
    () => setI((v) => (v - 1 + total) % total),
    [total],
  );
  const proxima = useCallback(() => setI((v) => (v + 1) % total), [total]);

  useEffect(() => setMontado(true), []);

  // Teclado + trava do scroll de fundo enquanto o overlay está aberto.
  useEffect(() => {
    fecharRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onFechar();
      else if (e.key === "ArrowLeft") anterior();
      else if (e.key === "ArrowRight") proxima();
    };
    document.addEventListener("keydown", onKey);

    const overflowAntes = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflowAntes;
    };
  }, [onFechar, anterior, proxima]);

  const foto = fotos[i];

  const conteudo = (
    <div
      className={`lbox${montado ? " is-open" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label="Foto ampliada"
      onClick={onFechar}
      onTouchStart={(e) => {
        toqueX.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        if (toqueX.current === null) return;
        const dx = e.changedTouches[0].clientX - toqueX.current;
        toqueX.current = null;
        if (Math.abs(dx) < 45) return;
        if (dx > 0) anterior();
        else proxima();
      }}
    >
      <button
        ref={fecharRef}
        type="button"
        className="lbox-btn lbox-close"
        onClick={onFechar}
        aria-label="Fechar"
      >
        <svg viewBox="0 0 24 24" aria-hidden>
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>

      {/* O clique na foto não fecha — só o fundo fecha. A foto é contida
          (object-fit: contain), então retrato e paisagem cabem sem corte. */}
      <figure className="lbox-figura" onClick={(e) => e.stopPropagation()}>
        <Image
          key={foto.src}
          className="lbox-img"
          src={foto.src}
          alt={foto.alt}
          fill
          sizes="(max-width: 700px) 92vw, 700px"
          priority
        />
      </figure>

      {total > 1 && (
        <div className="lbox-nav" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className="lbox-btn"
            onClick={anterior}
            aria-label="Foto anterior"
          >
            <svg viewBox="0 0 24 24" aria-hidden>
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          <span className="lbox-contador">
            {i + 1} <span aria-hidden>/</span> {total}
          </span>

          <button
            type="button"
            className="lbox-btn"
            onClick={proxima}
            aria-label="Próxima foto"
          >
            <svg viewBox="0 0 24 24" aria-hidden>
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );

  return createPortal(conteudo, document.body);
}
