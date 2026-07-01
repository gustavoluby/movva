// Constantes de marca/SEO usadas em metadata, JSON-LD, sitemap, robots e llms.txt.
// Uma fonte única pra não divergir entre arquivos.

export const SITE_URL = "https://www.moodpass.com.br";
export const SITE_NAME = "Moodpass";

// Descritor da marca — sempre junto do nome pra desambiguar a entidade
// (há homônimos): curadoria + bem-estar + mulheres + Curitiba.
export const SITE_TAGLINE =
  "Curadoria de experiências de bem-estar para mulheres em Curitiba";

export const SITE_DESCRIPTION =
  "Yoga, autocuidado, drenagem, brunchs e encontros para mulheres florescerem juntas. Descubra as próximas experiências de bem-estar da Moodpass em Curitiba.";

export const SITE_LOGO = `${SITE_URL}/moodpass-logo.webp`;
// OG padrão (placeholder: logo horizontal). Ideal trocar por arte 1200×630.
export const SITE_OG_IMAGE = `${SITE_URL}/moodpass-logo-horizontal.webp`;

export const SITE_LOCALE = "pt_BR";
export const SITE_CITY = "Curitiba";
export const SITE_REGION = "PR";

// Contato oficial (WhatsApp de suporte da Moodpass).
export const WHATSAPP_NUMBER = "5541999458878";

// Perfis sociais oficiais pra sameAs (desambiguação de entidade).
// TODO: preencher com o Instagram oficial da marca quando confirmado.
export const SOCIAL_LINKS: string[] = [];

// URL absoluta a partir de um path relativo.
export function absoluteUrl(path = "/"): string {
  return new URL(path, SITE_URL).toString();
}
