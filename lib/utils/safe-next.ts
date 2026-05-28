// Garante que um destino de redirect ("next") é um caminho INTERNO do app.
// Sem isso, ?next=https://site-malicioso.com viraria um open redirect após
// o login/signup. Aceita só caminhos que começam com "/" e bloqueia
// protocol-relative ("//host" e "/\\host") que o browser trata como externo.
export function safeNext(
  next: string | null | undefined,
  fallback = "/",
): string {
  if (!next || typeof next !== "string") return fallback;
  if (!next.startsWith("/")) return fallback;
  if (next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}
