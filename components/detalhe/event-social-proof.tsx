import Image from "next/image";
import type { GaleriaAlbum } from "@/lib/galeria";

/**
 * Prova social na página do evento: fotos de um encontro que já rolou no mesmo
 * espaço. Só fotos (o vídeo fica na galeria da home) — aqui o peso importa,
 * é a página que converte.
 *
 * Sem link pro álbum: essa seção é prova, não desvio. A pessoa está na página
 * que converte — nada aqui pode tirá-la do evento que ela está vendo.
 */
export function EventSocialProof({ album }: { album: GaleriaAlbum }) {
  const fotos = album.items.filter((i) => i.type === "photo");
  if (fotos.length === 0) return null;

  return (
    <section className="proof-section">
      <h2 className="faq-title">Já rolou aqui</h2>
      <p className="proof-sub">
        Fotos do <strong>{album.title}</strong>, {album.when} — no mesmo espaço.
      </p>

      <div className="galeria-rail proof-rail">
        {fotos.map((f) => (
          <figure
            key={f.src}
            className="galeria-card"
            style={{ aspectRatio: f.ratio }}
          >
            <Image
              className="galeria-media"
              src={f.src}
              alt={f.alt}
              fill
              sizes="200px"
            />
          </figure>
        ))}
      </div>
    </section>
  );
}
