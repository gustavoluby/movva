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
 * visual (o 9/16 fica mais estreito que o 3/4 e o 2/3).
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
  /**
   * Palavras-chave do local (minúsculas, sem acento). Um evento futuro no mesmo
   * lugar mostra esse álbum como prova social ("já rolou aqui"). Casar por local
   * e não por slug deixa o álbum reaproveitável em qualquer evento no espaço.
   */
  venueKeywords: string[];
  items: GaleriaItem[];
};

export const GALERIA_ALBUNS: GaleriaAlbum[] = [
  {
    slug: "wellness-day",
    title: "Wellness Day",
    when: "12 de julho",
    place: "Oncè Studio · Batel",
    venueKeywords: ["once", "oncè", "onces"],
    items: [
      {
        type: "photo",
        src: "/galeria/wellness-day-01.webp",
        alt: "Salão de yoga cheio, tapetes e a turma reunida no Wellness Day",
        ratio: "2 / 3",
      },
      {
        type: "photo",
        src: "/galeria/wellness-day-02.webp",
        alt: "Mesa de brunch com limonada, biscoitos e bolo",
        ratio: "2 / 3",
      },
      {
        type: "photo",
        src: "/galeria/wellness-day-03.webp",
        alt: "Turma de yoga com os braços erguidos, sob a luz dourada",
        ratio: "2 / 3",
      },
      {
        type: "photo",
        src: "/galeria/wellness-day-04.webp",
        alt: "Duas mulheres conversando no banco de tijolinho",
        ratio: "2 / 3",
      },
      {
        type: "photo",
        src: "/galeria/wellness-day-05.webp",
        alt: "Mesa posta com flores, salada de frutas e comidinhas",
        ratio: "2 / 3",
      },
      {
        type: "photo",
        src: "/galeria/wellness-day-06.webp",
        alt: "Fila de mulheres alongando no tapete de yoga (preto e branco)",
        ratio: "2 / 3",
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
        src: "/galeria/wellness-day-12.webp",
        alt: "Sessão de drenagem linfática durante o Wellness Day",
        ratio: "9 / 16",
      },
      {
        type: "photo",
        src: "/galeria/wellness-day-07.webp",
        alt: "Duas mulheres conversando, uma de roupão rosa",
        ratio: "2 / 3",
      },
      {
        type: "photo",
        src: "/galeria/wellness-day-08.webp",
        alt: "Roda de meditação sentada nos tapetes",
        ratio: "2 / 3",
      },
      {
        type: "photo",
        src: "/galeria/wellness-day-09.webp",
        alt: "Mulheres perto da mesa de brunch, ao contraluz",
        ratio: "2 / 3",
      },
      {
        type: "photo",
        src: "/galeria/wellness-day-10.webp",
        alt: "Duas mulheres preparando algo no balcão (preto e branco)",
        ratio: "3 / 2",
      },
      {
        type: "photo",
        src: "/galeria/wellness-day-11.webp",
        alt: "Mulher de vestido rosa segurando o tapete de yoga",
        ratio: "2 / 3",
      },
    ],
  },
];

// Normaliza texto de local (minúsculas, sem acento) pra casar por palavra-chave.
function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Álbum que já rolou no mesmo local de um evento — pra prova social na página
 * do evento. Ignora o próprio evento do álbum (não mostra "já rolou aqui" na
 * página do Wellness Day pra ele mesmo).
 */
export function albumForVenue(
  location: string | null | undefined,
  currentSlug?: string,
): GaleriaAlbum | null {
  if (!location) return null;
  const hay = norm(location);
  return (
    GALERIA_ALBUNS.find(
      (a) =>
        a.slug !== currentSlug &&
        a.venueKeywords.some((k) => hay.includes(norm(k))),
    ) ?? null
  );
}
