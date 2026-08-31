import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";
import { CandidaturaForm } from "./candidatura-form";
import { MetaTrack } from "@/components/analytics/meta-events";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Quero publicar uma experiência",
  robots: { index: false },
};

export default async function OrganizadoraPage({
  searchParams,
}: {
  searchParams: Promise<{ enviado?: string }>;
}) {
  const { enviado } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/perfil/organizadora");

  const [{ data: profile }, { data: candidatura }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, instagram, phone, role")
      .eq("id", user.id)
      .maybeSingle(),
    // A policy da tabela é "veja só a sua" — o client da usuária basta.
    supabase
      .from("organizer_applications")
      .select("event_idea, about, instagram, phone, status, admin_note, created_at")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  // Quem já tem o acesso não precisa se candidatar.
  const jaEOrganizadora = isAdmin(user.email) || profile?.role === "organizer";
  const status = candidatura?.status ?? null;

  return (
    <div className="moodpass-shell">
      <div className="scroll-area">
        <header className="aprovar-head">
          <Link href="/perfil" className="hero-btn" aria-label="Voltar pro perfil">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5" />
              <path d="M12 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="greeting-name">Publicar uma experiência</div>
        </header>

        <div className="organizadora-page">
          {jaEOrganizadora ? (
            <section className="organizadora-status is-ok">
              <h2 className="organizadora-status-title">Você já pode publicar ✦</h2>
              <p className="organizadora-status-text">
                Sua conta tem acesso de organizadora. É só criar a experiência —
                a gente revisa e publica.
              </p>
              <Link href="/admin/experiencias" className="cta-btn">
                Ir pras minhas experiências
              </Link>
            </section>
          ) : (
            <>
              {enviado && status === "pending" && (
                <>
                  {/* Lead: candidatura de organizadora enviada. Uma por conta —
                      reenviar a mesma candidatura não gera outro lead. */}
                  <MetaTrack
                    event="Lead"
                    once={`lead-organizadora:${user.id}`}
                    params={{
                      content_name: "Quero publicar uma experiência",
                      content_category: "organizadora",
                      currency: "BRL",
                      value: 0,
                    }}
                  />
                  <p className="exp-saved">
                    Recebemos sua candidatura. A gente te chama no WhatsApp ✦
                  </p>
                </>
              )}

              {status === "pending" ? (
                <section className="organizadora-status">
                  <h2 className="organizadora-status-title">Em análise</h2>
                  <p className="organizadora-status-text">
                    A gente lê tudo e responde por WhatsApp. Enquanto isso, se
                    quiser mudar alguma coisa, é só editar aqui embaixo e
                    reenviar.
                  </p>
                </section>
              ) : status === "rejected" ? (
                <section className="organizadora-status is-back">
                  <h2 className="organizadora-status-title">
                    Ainda não dessa vez
                  </h2>
                  <p className="organizadora-status-text">
                    {candidatura?.admin_note
                      ? candidatura.admin_note
                      : "Dá uma olhada na ideia, ajusta o que fizer sentido e manda de novo — a gente adora ver de novo."}
                  </p>
                </section>
              ) : (
                <section className="organizadora-intro">
                  <h2 className="organizadora-intro-title">
                    Tem uma experiência pra criar?
                  </h2>
                  <p className="organizadora-intro-text">
                    Conta pra gente o que você quer fazer. Se fizer sentido pro
                    Moodpass, sua conta ganha acesso pra criar a experiência,
                    editar os detalhes e acompanhar quem comprou. A gente revisa
                    antes de publicar e cuida do pagamento.
                  </p>
                </section>
              )}

              <CandidaturaForm
                eventIdea={candidatura?.event_idea}
                about={candidatura?.about}
                instagram={candidatura?.instagram ?? profile?.instagram}
                phone={candidatura?.phone ?? profile?.phone}
                reenvio={!!status}
              />
            </>
          )}
        </div>

        <div className="h-12" />
      </div>
    </div>
  );
}
