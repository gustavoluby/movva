"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Enquanto o pagamento está "em processamento" (Pix ainda compensando, ou
// cartão aguardando a autorização do banco/3DS), atualiza a página sozinha a
// cada 4s. O refresh re-roda o server component, que chama reconcilePayment de
// novo com o ?payment_id da URL — então a tela vira pra "confirmado" assim que
// o MP aprova, sem a pessoa precisar recarregar na mão. Para depois de ~2 min.
export function PendingPoller() {
  const router = useRouter();
  useEffect(() => {
    let count = 0;
    const id = setInterval(() => {
      count++;
      router.refresh();
      if (count >= 30) clearInterval(id);
    }, 4000);
    return () => clearInterval(id);
  }, [router]);
  return null;
}
