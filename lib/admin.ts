import "server-only";

// Allowlist de admins por email, via env `ADMIN_EMAILS` (csv).
// Sem coluna no banco — simples e reversível. Default cobre o Gustavo
// pra não travar em dev/prod caso a env ainda não esteja setada.
const DEFAULT_ADMINS = ["marketing@leadster.com.br", "gustavo@leadster.com.br"];

function adminList(): string[] {
  const fromEnv = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return fromEnv.length > 0 ? fromEnv : DEFAULT_ADMINS;
}

export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return adminList().includes(email.toLowerCase());
}
