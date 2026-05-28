// Sem filtro funcional ainda — só visual. Lógica entra quando tivermos
// > 5 eventos publicados que justifiquem filtrar.
const CATEGORIES = [
  { label: "✦ Tudo", active: true },
  { label: "Yoga" },
  { label: "Pilates" },
  { label: "Encontros" },
  { label: "Bem-estar" },
  { label: "Ao ar livre" },
];

export function CategoryChips() {
  return (
    <div className="categories">
      {CATEGORIES.map((cat) => (
        <div
          key={cat.label}
          className={`cat-chip${cat.active ? " active" : ""}`}
        >
          {cat.label}
        </div>
      ))}
    </div>
  );
}
