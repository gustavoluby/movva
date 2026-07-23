/**
 * Galeria "Momentos" — fotos e vídeos reais das experiências que já rolaram.
 *
 * Os arquivos moram em /public/galeria (webp p/ foto, mp4 sem áudio p/ vídeo).
 * Pra publicar um álbum novo: exporte as mídias, adicione um objeto aqui no
 * topo da lista (mais recente primeiro) e pronto — a home e a /sobre pegam
 * sozinhas.
 *
 * `ratio` é a proporção real do arquivo. O trilho tem altura fixa, então a
 * proporção é quem define a largura de cada card — é daí que vem o ritmo
 * visual (o 9/16 fica mais estreito que o 3/4).
 */

export type GaleriaItem =
  | {
      type: "video";
      src: string;
      poster: string;
      alt: string;
      ratio: `${number} / ${number}`;
    }
  | {
      type: "photo";
      src: string;
      alt: string;
      ratio: `${number} / ${number}`;
    };

export type GaleriaAlbum = {
  /** Slug do evento (vira link pro detalhe). null = sem página. */
  slug: string | null;
  title: string;
  /** Quando rolou, já escrito por extenso. */
  when: string;
  place: string;
  items: GaleriaItem[];
};

export const GALERIA_ALBUNS: GaleriaAlbum[] = [
  {
    slug: "wellness-day",
    title: "Wellness Day",
    when: "12 de julho",
    place: "Oncè Studio · Batel",
    items: [
      {
        type: "photo",
        src: "/galeria/wellness-day-01.webp",
        alt: "Mesa de brunch com limonada e bolo, e a turma de yoga ao fundo no Wellness Day",
        ratio: "3 / 4",
      },
      {
        type: "video",
        src: "/galeria/wellness-day.mp4",
        poster: "/galeria/wellness-day-video-poster.webp",
        alt: "Arara de roupas do Wellness Day, no Oncè Studio",
        ratio: "9 / 16",
      },
      {
        type: "photo",
        src: "/galeria/wellness-day-02.webp",
        alt: "Mesa com velas aromáticas, flores e arara de roupas ao fundo",
        ratio: "3 / 4",
      },
      {
        type: "photo",
        src: "/galeria/wellness-day-03.webp",
        alt: "Sessão de drenagem linfática durante o Wellness Day",
        ratio: "9 / 16",
      },
      {
        type: "photo",
        src: "/galeria/wellness-day-04.webp",
        alt: "Tapetes de yoga posicionados no salão de tijolinho vermelho",
        ratio: "3 / 4",
      },
      {
        type: "photo",
        src: "/galeria/wellness-day-05.webp",
        alt: "Mesa de produtos com pomanders, flores e velas",
        ratio: "3 / 4",
      },
      {
        type: "photo",
        src: "/galeria/wellness-day-06.webp",
        alt: "Sala de massagem preparada, com luz baixa e macas prontas",
        ratio: "3 / 4",
      },
    ],
  },
];
