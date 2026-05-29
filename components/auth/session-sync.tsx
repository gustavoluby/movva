"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Sem middleware (quebrado no Next 15.5.18 na Vercel — ver memória de deploy),
// o refresh do token Supabase fica por conta do BROWSER client: com
// autoRefreshToken ligado (padrão), ele renova o access token em background e
// grava nos cookies, que o servidor lê na próxima request. Este componente só
// observa as trocas de token e re-renderiza os Server Components quando o token
// muda de fato — sem isso, a UI server-side ficaria com a sessão antiga.
export function SessionSync() {
  const router = useRouter();
  const accessToken = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const supabase = createClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const token = session?.access_token ?? null;

      // Primeira emissão (INITIAL_SESSION no mount): só registra o estado
      // atual, sem forçar re-render — evita refresh redundante a cada navegação.
      if (accessToken.current === undefined) {
        accessToken.current = token;
        return;
      }

      // Token mudou (refresh, login ou logout em outra aba) → sincroniza o
      // server. Comparar o token evita loop e refreshes à toa.
      if (token !== accessToken.current) {
        accessToken.current = token;
        router.refresh();
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  return null;
}
