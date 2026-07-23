import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { getNicoleWhatsAppLink } from "@/lib/whatsapp";
import {
  SITE_NAME,
  SITE_CITY,
  SITE_REGION,
  absoluteUrl,
} from "@/lib/site";

export const metadata: Metadata = {
  title: "O que é o Moodpass",
  description:
    "O Moodpass é uma curadoria de experiências de bem-estar para mulheres em Curitiba — yoga, autocuidado, drenagem, brunchs e encontros em turmas pequenas. Participe ou leve a sua experiência pra plataforma.",
  alternates: { canonical: absoluteUrl("/sobre") },
  openGraph: {
    url: absoluteUrl("/sobre"),
    title: `${SITE_NAME} · Experiências de bem-estar para mulheres em Curitiba`,
    description:
      "Uma curadoria de yoga, autocuidado e encontros em turmas pequenas. Crie sua conta ou leve a sua experiência pro Moodpass.",
  },
};

// O que a pessoa encontra — lista rítmica (não é grid de cards).
const OFERTAS: { titulo: string; texto: string }[] = [
  {
    titulo: "Yoga & movimento",
    texto: "Aulas pra reconectar corpo e respiração, no seu ritmo.",
  },
  {
    titulo: "Autocuidado & beleza",
    texto: "Drenagem, skincare e rituais pra se cuidar de verdade.",
  },
  {
    titulo: "Brunchs & encontros",
    texto: "Mesas e rodas pra mulheres se encontrarem e trocarem.",
  },
  {
    titulo: "Turmas pequenas",
    texto: "Poucos lugares, muita presença. Nada de sala lotada.",
  },
];

export default async function SobrePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const loggedIn = !!user;

  // Fotos reais das experiências pra galeria e hero. Publicadas, com imagem.
  const { data: eventos } = await supabase
    .from("events")
    .select("slug, title, location_short, image_url, thumb_url, is_featured")
    .eq("status", "published")
    .not("image_url", "is", null)
    .order("is_featured", { ascending: false })
    .order("event_date", { ascending: false })
    .limit(7);

  const lista = eventos ?? [];
  const hero = lista[0] ?? null;
  const galeria = (hero ? lista.slice(1) : lista).slice(0, 6);

  const organizarHref = getNicoleWhatsAppLink(
    "Olá! Organizo experiências pra mulheres e quero publicar a minha no Moodpass. Pode me contar como funciona?",
  );

  return (
    <div className="moodpass-shell">
      <div className="scroll-area lp">
        {/* ---- Topo ---- */}
        <header className="lp-topbar">
          <Link href="/" aria-label="Ir pra home do Moodpass">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/moodpass-logo-horizontal.webp"
              alt="Moodpass"
              className="lp-logo"
              width={116}
              height={29}
            />
          </Link>
          <nav className="lp-topbar-nav">
            {loggedIn ? (
              // Já logado: "Acessar" já leva pras experiências — dispensa o
              // "Ver experiências" (seria o mesmo destino).
              <Link href="/" className="lp-topbar-link">
                Acessar
              </Link>
            ) : (
              <>
                <Link
                  href="/"
                  className="lp-topbar-link lp-topbar-link-ghost"
                >
                  Ver experiências
                </Link>
                <Link href="/login" className="lp-topbar-link">
                  Entrar
                </Link>
              </>
            )}
          </nav>
        </header>

        {/* ---- Hero ---- */}
        <section className="lp-hero">
          <span className="lp-chip lp-reveal">
            ✦ {SITE_CITY} · {SITE_REGION}
          </span>
          <h1 className="lp-h1 lp-reveal lp-reveal-1">
            Experiências de bem-estar pra mulheres florescerem juntas.
          </h1>
          <p className="lp-lede lp-reveal lp-reveal-2">
            Yoga, autocuidado, drenagem e encontros cuidadosamente selecionados
            em {SITE_CITY}. Turmas reduzidas, presença de verdade.
          </p>

          {hero?.image_url && (
            <div className="lp-hero-img lp-reveal lp-reveal-3">
              <Image
                src={hero.image_url}
                alt={`Experiência ${hero.title} — Moodpass em ${SITE_CITY}`}
                fill
                priority
                sizes="(max-width: 480px) 100vw, 480px"
                style={{ objectFit: "cover" }}
              />
              <span className="lp-hero-caption">
                {hero.title}
                {hero.location_short ? ` · ${hero.location_short}` : ""}
              </span>
            </div>
          )}
        </section>

        {/* ---- CTA participante (ciente de login) ---- */}
        <section className="lp-join">
          <div className="lp-join-inner">
            {loggedIn ? (
              <>
                <h2 className="lp-join-title">
                  Pronta pra próxima experiência?
                </h2>
                <p className="lp-join-text">
                  Você já tem conta — é só escolher sua próxima experiência e
                  garantir seu lugar.
                </p>
                <Link href="/" className="lp-btn lp-btn-primary">
                  Ver as experiências
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="M5 12h14M13 5l7 7-7 7" />
                  </svg>
                </Link>
              </>
            ) : (
              <>
                <h2 className="lp-join-title">
                  Quero viver essas experiências
                </h2>
                <p className="lp-join-text">
                  Crie sua conta gratuita e garanta seu lugar nas próximas
                  experiências do Moodpass.
                </p>
                <Link href="/signup" className="lp-btn lp-btn-primary">
                  Criar minha conta
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="M5 12h14M13 5l7 7-7 7" />
                  </svg>
                </Link>
                <Link href="/" className="lp-link-quiet">
                  Só quero dar uma olhada nas experiências
                </Link>
              </>
            )}
          </div>
        </section>

        {/* ---- O que é ---- */}
        <section className="lp-about">
          <h2 className="lp-section-title">O que é o Moodpass</h2>
          <p className="lp-about-lead">
            Uma curadoria das experiências de bem-estar mais especiais de{" "}
            {SITE_CITY}, reunidas num só lugar.
          </p>
          <p className="lp-about-body">
            A gente cuida de cada detalhe pra você só chegar, respirar e
            aproveitar. Aqui os encontros são íntimos — pensados pra mulheres se
            reconectarem com o corpo, com a calma e umas com as outras.
          </p>
        </section>

        {/* ---- O que você encontra ---- */}
        <section className="lp-ofertas">
          <h2 className="lp-section-title">O que você encontra</h2>
          <dl className="lp-oferta-list">
            {OFERTAS.map((o) => (
              <div key={o.titulo} className="lp-oferta">
                <span className="lp-oferta-dot" aria-hidden />
                <div>
                  <dt className="lp-oferta-titulo">{o.titulo}</dt>
                  <dd className="lp-oferta-texto">{o.texto}</dd>
                </div>
              </div>
            ))}
          </dl>
        </section>

        {/* ---- Galeria de experiências reais ---- */}
        {galeria.length > 0 && (
          <section className="lp-gallery">
            <h2 className="lp-section-title lp-gallery-title">
              Um gostinho do que já rolou
            </h2>
            <div className="lp-gallery-strip">
              {galeria.map((e) => (
                <Link
                  key={e.slug}
                  href={`/eventos/${e.slug}`}
                  className="lp-gallery-card"
                >
                  <div className="lp-gallery-img">
                    {(e.thumb_url ?? e.image_url) && (
                      <Image
                        src={(e.thumb_url ?? e.image_url) as string}
                        alt={`${e.title} — Moodpass`}
                        fill
                        sizes="240px"
                        style={{ objectFit: "cover" }}
                      />
                    )}
                  </div>
                  <div className="lp-gallery-meta">
                    <span className="lp-gallery-name">{e.title}</span>
                    {e.location_short && (
                      <span className="lp-gallery-place">
                        {e.location_short}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ---- CTA organizadora (mundo visual próprio: sage) ---- */}
        <section className="lp-organizer">
          <h2 className="lp-organizer-title">
            Organiza experiências pra mulheres?
          </h2>
          <p className="lp-organizer-text">
            Leve a sua pro Moodpass. A gente cuida da divulgação, das reservas e
            do pagamento — você foca em criar um encontro inesquecível.
          </p>
          <a
            href={organizarHref}
            target="_blank"
            rel="noopener noreferrer"
            className="lp-btn lp-btn-wa"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 0 1 8.413 3.488 11.82 11.82 0 0 1 3.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 0 1-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 0 0 1.51 5.26l-.999 3.648 3.978-1.07zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.71.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
            </svg>
            Falar com a gente
          </a>
          <span className="lp-organizer-note">
            Resposta rápida, de gente pra gente.
          </span>
        </section>

        {/* ---- Rodapé ---- */}
        <footer className="lp-footer">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/moodpass-logo-horizontal.webp"
            alt="Moodpass"
            className="lp-footer-logo"
            width={128}
            height={32}
          />
          <p className="lp-footer-tag">
            Feito em {SITE_CITY}, com carinho — pra mulheres florescerem juntas.
          </p>
          <div className="lp-footer-links">
            <a
              href="https://www.instagram.com/moodpasss/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Instagram
            </a>
            <span aria-hidden>·</span>
            <a href={organizarHref} target="_blank" rel="noopener noreferrer">
              WhatsApp
            </a>
            <span aria-hidden>·</span>
            <Link href="/">Experiências</Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
