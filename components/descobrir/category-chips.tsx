import Link from "next/link";

export type Chip = {
  key: string;
  label: string;
  href: string;
  active: boolean;
};

// Chips de filtro da home. Cada um é um link pra /?cat=<key> (e "/" pro Tudo).
// A lista de chips é montada na page só com categorias que têm evento.
export function CategoryChips({ chips }: { chips: Chip[] }) {
  return (
    <div className="categories">
      {chips.map((c) => (
        <Link
          key={c.key}
          href={c.href}
          scroll={false}
          className={`cat-chip${c.active ? " active" : ""}`}
        >
          {c.label}
        </Link>
      ))}
    </div>
  );
}
