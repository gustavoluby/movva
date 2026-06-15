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
    // O padrão do Next é 1 MB de body em Server Actions; subimos pra 10 MB.
    // ATENÇÃO: a Vercel ainda impõe um teto de plataforma de ~4.5 MB no corpo
    // da requisição (retorna 413 antes do Next), então isso sozinho não basta
    // pra foto de celular (HEIC/alta resolução passa de 4.5 MB). A garantia
    // real é a compressão no cliente (components/comunidade/checkin-form.tsx
    // → compressImage), que reduz a foto pra ~centenas de KB antes do upload.
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
