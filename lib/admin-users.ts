import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

// Emails ficam em auth.users (não em profiles). Só o service-role enxerga via
// a API admin. Pagina até esgotar e devolve um mapa user_id → email.
export async function fetchUserEmails(
  admin: SupabaseClient,
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const perPage = 1000;
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    const users = data?.users ?? [];
    if (error || users.length === 0) break;
    for (const u of users) if (u.email) map.set(u.id, u.email);
    if (users.length < perPage) break;
  }
  return map;
}
