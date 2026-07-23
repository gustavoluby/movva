import Link from "next/link";
import { GALERIA_ALBUNS } from "@/lib/galeria";
import { AlbumRail } from "./album-rail";

/**
 * Galeria das experiências que já rolaram — um trilho horizontal de fotos e
 * vídeos reais. Altura fixa: quem manda na largura de cada card é a proporção
 * do arquivo, então o trilho ganha ritmo sem ficar desalinhado.
 *
 * Usada no rodapé da home e na /sobre.
 */
export function GaleriaMomentos({
  title,
  variant = "home",
}: {
  title: string;
  /** "lp" usa a tipografia de seção da landing (/sobre). */
  variant?: "home" | "lp";
}) {
  if (GALERIA_ALBUNS.length === 0) return null;

  // Na landing é um gostinho, não um catálogo: sem nome/data/local do álbum e
  // sem link — só as fotos. Na home o cabeçalho fica, que ali é navegação.
  const comCabecalhoDeAlbum = variant !== "lp";

  return (
    <section className={`galeria galeria-${variant}`} aria-label={title}>
      <div className="galeria-header">
        {variant === "lp" ? (
          <h2 className="lp-section-title">{title}</h2>
        ) : (
          <>
            <span className="galeria-kicker">✦ álbum</span>
            <h3 className="galeria-title">{title}</h3>
          </>
        )}
      </div>

      {GALERIA_ALBUNS.map((album) => {
        const meta = (
          <>
            <span className="galeria-album-name">{album.title}</span>
            <span className="galeria-album-meta">
              {album.when} · {album.place}
            </span>
          </>
        );

        return (
          <div key={album.title} className="galeria-album">
            {!comCabecalhoDeAlbum ? null : album.slug ? (
              <Link
                href={`/eventos/${album.slug}`}
                className="galeria-album-head is-link"
              >
                {meta}
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </Link>
            ) : (
              <div className="galeria-album-head">{meta}</div>
            )}

            <AlbumRail items={album.items} />
          </div>
        );
      })}
    </section>
  );
}
