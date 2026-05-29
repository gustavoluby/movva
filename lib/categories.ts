// Categorias dos eventos pros chips de filtro da home.
//
// O campo `category` no banco é texto livre e inconsistente (ex.: o evento de
// pilates está como "Encontro de Mulheres · Bundle"), então classificamos pelo
// TÍTULO via palavras-chave. Um chip só aparece se houver evento publicado que
// caia nele — assim "só ficam ativas as tags que têm evento".
//
// Keywords escolhidas pra não colidir (ex.: "cuidado" bateria em
// "Autocuidado" do pilates, então fica de fora).
export type CategoryDef = { key: string; label: string; keywords: string[] };

export const CATEGORY_DEFS: CategoryDef[] = [
  { key: "yoga", label: "Yoga", keywords: ["yoga"] },
  { key: "pilates", label: "Pilates", keywords: ["pilates"] },
  {
    key: "encontros",
    label: "Encontros",
    keywords: ["encontro", "roda", "clube", "depois do não", "mães"],
  },
  {
    key: "bem-estar",
    label: "Bem-estar",
    keywords: ["drenagem", "autoestima", "espiritual", "ensaio"],
  },
  {
    key: "ar-livre",
    label: "Ao ar livre",
    keywords: ["piquenique", "vôlei", "futevôlei", "barigui", "trilha", "ar livre"],
  },
];

// Chaves de categoria que um evento atende (pelo título).
export function eventCategories(title: string): string[] {
  const t = (title ?? "").toLowerCase();
  return CATEGORY_DEFS.filter((c) => c.keywords.some((k) => t.includes(k))).map(
    (c) => c.key,
  );
}
