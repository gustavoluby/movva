import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/perfil/profile-form";
import { EmailChange } from "@/components/perfil/email-change";

export const dynamic = "force-dynamic";

export default async function MeusDadosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/perfil/dados");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, instagram, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div className="moodpass-shell">
      <div className="scroll-area perfil-gradient">
        <header className="dados-head">
          <Link href="/perfil" className="dados-back" aria-label="Voltar">
            ←
          </Link>
          <h1 className="dados-title">Meus dados</h1>
        </header>

        <ProfileForm
          fullName={profile?.full_name ?? ""}
          instagram={profile?.instagram ?? null}
          avatarUrl={profile?.avatar_url ?? null}
        />

        <section className="dados-section">
          <EmailChange currentEmail={user.email ?? "—"} />

          <div className="dados-field">
            <label>Senha</label>
            <div className="dados-readonly">••••••••</div>
            <Link
              href="/recuperar-senha"
              className="dados-link-btn"
            >
              Alterar senha
            </Link>
          </div>
        </section>

        <div className="h-12" />
      </div>
    </div>
  );
}
