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
  },
};

export default nextConfig;
