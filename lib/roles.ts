import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/admin";

/**
 * Quem está olhando a área administrativa.
 *
 * Dois papéis com acesso ao /admin:
 * - **admin** (allowlist de email em lib/admin.ts): enxerga e mexe em tudo.
 * - **organizer** (profiles.role): só as experiências que ela mesma criou —
 *   cria, edita e vê quem comprou. Publicar depende de aprovação do admin.
 *
 * O papel de admin continua vindo de email (não de coluna) de propósito:
 * ninguém vira admin mexendo em dado.
 */
export type Viewer = {
  userId: string;
  email: string | null;
  isAdmin: boolean;
  isOrganizer: boolean;
};

export async function getViewer(): Promise<Viewer | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = isAdmin(user.email);
  if (admin) {
    return { userId: user.id, email: user.email ?? null, isAdmin: true, isOrganizer: false };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  return {
    userId: user.id,
    email: user.email ?? null,
    isAdmin: false,
    isOrganizer: profile?.role === "organizer",
  };
}

/**
 * Porteiro das páginas do /admin. Sem login manda pro login (e volta depois);
 * logada mas sem papel nenhum, volta pro perfil.
 */
export async function requireStaff(nextPath: string): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  if (!viewer.isAdmin && !viewer.isOrganizer) redirect("/perfil");
  return viewer;
}

/** Só admin (contas, cupons, moderação, estorno). */
export async function requireAdminPage(nextPath: string): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  if (!viewer.isAdmin) redirect("/perfil");
  return viewer;
}

/** Organizadoras cadastradas — pro admin escolher a dona da experiência. */
export async function listOrganizers(): Promise<{ id: string; name: string }[]> {
  const { data } = await createAdminClient()
    .from("profiles")
    .select("id, full_name")
    .eq("role", "organizer")
    .order("full_name", { ascending: true });
  return (data ?? []).map((p) => ({ id: p.id, name: p.full_name || "—" }));
}

/** A organizadora só mexe no que é dela; o admin mexe em tudo. */
export function canEditEvent(
  viewer: Viewer,
  event: { owner_id?: string | null },
): boolean {
  if (viewer.isAdmin) return true;
  return viewer.isOrganizer && !!event.owner_id && event.owner_id === viewer.userId;
}
