import Link from "next/link";

export const metadata = {
  title: "Política de cancelamento — Movva",
};

export default function PoliticaCancelamentoPage() {
  return (
    <div className="movva-shell">
      <div className="scroll-area">
        <header className="home-header">
          <div>
            <div className="greeting-label">Movva</div>
            <div className="greeting-name">Política de cancelamento</div>
          </div>
        </header>

        <main className="p-6" style={{ padding: "0 24px 40px", lineHeight: 1.6 }}>
          <p style={{ marginBottom: 16 }}>
            A gente quer que sua experiência seja leve do começo ao fim — inclusive
            se você precisar cancelar.
          </p>

          <h3 style={{ margin: "20px 0 8px", fontWeight: 600 }}>
            Cancelamento com até 48h de antecedência
          </h3>
          <p style={{ marginBottom: 16 }}>
            Reembolso integral via Pix, processado em até 10 minutos após a
            confirmação do cancelamento.
          </p>

          <h3 style={{ margin: "20px 0 8px", fontWeight: 600 }}>
            Entre 48h e 24h antes do evento
          </h3>
          <p style={{ marginBottom: 16 }}>
            Reembolso de 50% do valor, ou crédito integral pra usar em outra
            experiência Movva dentro de 90 dias.
          </p>

          <h3 style={{ margin: "20px 0 8px", fontWeight: 600 }}>
            Menos de 24h antes
          </h3>
          <p style={{ marginBottom: 16 }}>
            Não há reembolso, mas você pode transferir sua vaga pra uma amiga —
            é só avisar a anfitriã pelo WhatsApp.
          </p>

          <h3 style={{ margin: "20px 0 8px", fontWeight: 600 }}>
            Evento cancelado pela Movva
          </h3>
          <p style={{ marginBottom: 24 }}>
            Se a gente precisar cancelar um evento, o reembolso é sempre integral
            e automático.
          </p>

          <Link href="/" className="reservar-back">
            ← Voltar pra Experiências
          </Link>
        </main>
      </div>
    </div>
  );
}
