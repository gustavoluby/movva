import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="auth-shell">
      <Link href="/" className="auth-back">
        ← Voltar pra Experiências
      </Link>
      <div className="auth-logo">Movva</div>
      <div className="auth-tagline">experiências pra florescer juntas</div>
      {children}
    </div>
  );
}
