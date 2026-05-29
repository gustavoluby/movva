import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database.types";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Chamado de um Server Component (contexto read-only) — não dá pra
            // setar cookie aqui. OK ignorar: o refresh do token roda no browser
            // client (ver components/auth/session-sync.tsx), que grava os
            // cookies novos. Em Server Actions/Route Handlers o setAll funciona.
          }
        },
      },
    },
  );
}
