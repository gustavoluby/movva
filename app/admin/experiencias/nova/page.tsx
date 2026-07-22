import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";
import { EventForm } from "../event-form";

export const dynamic = "force-dynamic";

export default async function NovaExperienciaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/experiencias/nova");
  if (!isAdmin(user.email)) redirect("/perfil");

  return (
    <div className="moodpass-shell">
      <div className="scroll-area">
        <header className="aprovar-head">
          <Link
            href="/admin/experiencias"
            className="hero-btn"
            aria-label="Voltar pras experiências"
          >
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
          <div>
            <div className="greeting-label">admin</div>
            <div className="greeting-name">Nova experiência</div>
          </div>
        </header>

        <EventForm />
      </div>
    </div>
  );
}
