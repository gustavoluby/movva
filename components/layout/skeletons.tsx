// Skeletons que espelham o layout final de cada tela (não "pulam" quando o
// conteúdo real chega). Markup puro — renderizam no servidor, sem JS no client.
// Usam a classe .sk (shimmer em tons quentes) definida no globals.css.

function Bar({
  w = "100%",
  h = 14,
  r = 8,
  mt = 0,
}: {
  w?: string | number;
  h?: number;
  r?: number;
  mt?: number;
}) {
  return (
    <div
      className="sk"
      style={{ width: w, height: h, borderRadius: r, marginTop: mt }}
    />
  );
}

/* ---------- Home / Experiências ---------- */
export function HomeSkeleton() {
  return (
    <div className="scroll-area with-nav" aria-hidden>
      <div style={{ padding: "18px 24px 4px" }}>
        <Bar w={90} h={11} />
        <Bar w={130} h={24} mt={10} />
      </div>
      <div style={{ padding: "12px 24px 4px" }}>
        <Bar w="80%" h={26} />
        <Bar w="55%" h={26} mt={8} />
      </div>
      {/* card destaque */}
      <div style={{ padding: "16px 24px 0" }}>
        <div className="sk" style={{ width: "100%", height: 260, borderRadius: 24 }} />
      </div>
      {/* chips */}
      <div style={{ display: "flex", gap: 8, padding: "18px 24px", overflow: "hidden" }}>
        {[64, 88, 76, 70].map((w, i) => (
          <div key={i} className="sk" style={{ width: w, height: 34, borderRadius: 999, flex: "none" }} />
        ))}
      </div>
      <div style={{ padding: "0 24px" }}>
        <Bar w={150} h={18} />
      </div>
      {/* lista de eventos */}
      <div style={{ padding: "14px 24px 0", display: "flex", flexDirection: "column", gap: 16 }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ borderRadius: 20, overflow: "hidden", background: "var(--surface)", boxShadow: "var(--shadow-sm)" }}>
            <div className="sk" style={{ width: "100%", height: 150, borderRadius: 0 }} />
            <div style={{ padding: 16 }}>
              <Bar w={70} h={10} />
              <Bar w="85%" h={18} mt={10} />
              <Bar w="60%" h={13} mt={10} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Checkins (feed) ---------- */
export function FeedSkeleton() {
  return (
    <div className="scroll-area with-nav" aria-hidden>
      <div style={{ display: "flex", justifyContent: "space-between", padding: "18px 24px 8px" }}>
        <div>
          <Bar w={80} h={11} />
          <Bar w={110} h={24} mt={10} />
        </div>
        <Bar w={80} h={30} r={999} />
      </div>
      <div style={{ padding: "8px 24px 0", display: "flex", flexDirection: "column", gap: 18 }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ borderRadius: 20, padding: 16, background: "var(--surface)", boxShadow: "var(--shadow-sm)" }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div className="sk sk-circle" style={{ width: 40, height: 40 }} />
              <div style={{ flex: 1 }}>
                <Bar w={120} h={13} />
                <Bar w={80} h={10} mt={8} />
              </div>
            </div>
            <Bar w="95%" h={13} mt={14} />
            <Bar w="70%" h={13} mt={8} />
            <div className="sk" style={{ width: "100%", height: 180, borderRadius: 16, marginTop: 14 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Lista genérica (Minhas / Ranking) ---------- */
export function ListSkeleton() {
  return (
    <div className="scroll-area with-nav" aria-hidden>
      <div style={{ padding: "22px 24px 4px" }}>
        <Bar w={140} h={28} />
        <Bar w={200} h={13} mt={12} />
      </div>
      <div style={{ padding: "20px 24px 0" }}>
        <div className="sk" style={{ width: "100%", height: 120, borderRadius: 20 }} />
      </div>
      <div style={{ padding: "20px 24px 0" }}>
        <Bar w={100} h={18} />
      </div>
      <div style={{ padding: "14px 24px 0", display: "flex", flexDirection: "column", gap: 12 }}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={{ display: "flex", gap: 14, alignItems: "center", padding: 12, borderRadius: 16, background: "var(--surface)", boxShadow: "var(--shadow-sm)" }}>
            <div className="sk" style={{ width: 56, height: 56, borderRadius: 14, flex: "none" }} />
            <div style={{ flex: 1 }}>
              <Bar w="70%" h={15} />
              <Bar w="45%" h={11} mt={10} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Perfil ---------- */
export function ProfileSkeleton() {
  return (
    <div className="scroll-area with-nav perfil-gradient" aria-hidden>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 24px 8px" }}>
        <div className="sk sk-circle" style={{ width: 88, height: 88 }} />
        <Bar w={160} h={22} mt={18} />
        <Bar w={200} h={12} mt={12} />
        <div style={{ display: "flex", gap: 32, marginTop: 24 }}>
          {[0, 1].map((i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <Bar w={40} h={24} />
              <Bar w={70} h={11} mt={8} />
            </div>
          ))}
        </div>
      </div>
      <div style={{ padding: "28px 24px 0", display: "flex", flexDirection: "column", gap: 10 }}>
        {[0, 1, 2].map((i) => (
          <div key={i} className="sk" style={{ width: "100%", height: 56, borderRadius: 16 }} />
        ))}
      </div>
    </div>
  );
}

/* ---------- Detalhe do evento ---------- */
export function EventDetailSkeleton() {
  return (
    <div className="scroll-area" aria-hidden>
      <div className="sk" style={{ width: "100%", height: 320, borderRadius: 0 }} />
      <div style={{ padding: "20px 24px 0" }}>
        <Bar w={90} h={11} />
        <Bar w="85%" h={26} mt={12} />
        <Bar w="55%" h={15} mt={12} />
        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <div className="sk" style={{ width: "50%", height: 64, borderRadius: 16 }} />
          <div className="sk" style={{ width: "50%", height: 64, borderRadius: 16 }} />
        </div>
        <Bar w="100%" h={13} mt={24} />
        <Bar w="92%" h={13} mt={10} />
        <Bar w="96%" h={13} mt={10} />
        <Bar w="60%" h={13} mt={10} />
      </div>
    </div>
  );
}
