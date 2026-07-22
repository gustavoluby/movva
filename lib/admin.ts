import "server-only";

// Allowlist de admins por email. Os fundadores ficam SEMPRE na lista (não
// dependem de env, pra ninguém ficar travado). A env `ADMIN_EMAILS` (csv) só
// ADICIONA admins extras — nunca remove os padrão.
const DEFAULT_ADMINS = [
  "marketing@leadster.com.br",
  "gustavo@leadster.com.br",
  "nicolebenato@hotmail.com",
];

function adminList(): string[] {
  const fromEnv = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return [...new Set([...DEFAULT_ADMINS, ...fromEnv])];
}

export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return adminList().includes(email.toLowerCase());
}
