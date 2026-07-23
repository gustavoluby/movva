import type { GaleriaAlbum } from "@/lib/galeria";
import { PhotoRail } from "@/components/galeria/photo-rail";

/**
 * Prova social na página do evento: fotos de um encontro que já rolou no mesmo
 * espaço. Só fotos (o vídeo fica na galeria da home) — aqui o peso importa,
 * é a página que converte.
 *
 * Sem link pro álbum: essa seção é prova, não desvio. A pessoa está na página
 * que converte — nada aqui pode tirá-la do evento que ela está vendo. Ampliar
 * a foto não fere isso: abre por cima e fecha de volta no mesmo lugar.
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

      <PhotoRail
        items={fotos}
        railClassName="galeria-rail proof-rail"
        sizes="200px"
      />
    </section>
  );
}
