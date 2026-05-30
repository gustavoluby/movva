import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BottomNav } from "@/components/layout/bottom-nav";
import { ProfileForm } from "@/components/perfil/profile-form";
import { logoutAction } from "@/app/actions/logout";
import { memberSince } from "@/lib/utils/date";

export const dynamic = "force-dynamic";

export default async function PerfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/perfil");

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "full_name, handle, instagram, avatar_url, created_at, total_experiences, total_friends, total_badges",
    )
    .eq("id", user.id)
    .maybeSingle();

  const stats = [
    { n: profile?.total_experiences ?? 0, label: "experiências" },
    { n: profile?.total_friends ?? 0, label: "amigas" },
    { n: profile?.total_badges ?? 0, label: "selos" },
  ];

  return (
    <div className="movva-shell">
      <div className="scroll-area with-nav">
        <ProfileForm
          fullName={profile?.full_name ?? ""}
          instagram={profile?.instagram ?? null}
          avatarUrl={profile?.avatar_url ?? null}
          handle={profile?.handle ?? null}
          since={memberSince(profile?.created_at ?? user.created_at)}
          stats={stats}
        />

        <div className="profile-account">
          <div className="profile-section-label">Sua conta</div>
          <form action={logoutAction}>
            <button type="submit" className="profile-logout">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Sair da conta
            </button>
          </form>
        </div>

        <div className="h-12" />
      </div>
      <BottomNav loggedIn={!!user} />
    </div>
  );
}
