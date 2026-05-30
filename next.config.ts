import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Cache de navegação do client: ao voltar pra uma aba já visitada dentro
    // desse tempo, o Next reusa o render em vez de rebuscar no Supabase —
    // troca de aba fica instantânea. Curto o bastante pra não servir dado velho.
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
    // Server Actions aceitam até 10 MB de body. O padrão do Next é só 1 MB,
    // o que rejeitava upload de foto de celular (fotos têm 2–8 MB) antes mesmo
    // do check de 8 MB na action rodar. 10 MB dá folga pro overhead do
    // multipart e deixa o erro amigável de "máx. 8 MB" aparecer quando passa.
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
