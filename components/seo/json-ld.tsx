// Injeta um bloco de structured data (JSON-LD) no HTML server-rendered.
// Aceita um objeto (um @type) ou um array (@graph de vários).
export function JsonLd({ data }: { data: object | object[] }) {
  return (
    <script
      type="application/ld+json"
      // JSON serializado — sem input do usuário não sanitizado além de dados
      // já controlados do banco; escapamos "<" pra evitar quebra da tag.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
