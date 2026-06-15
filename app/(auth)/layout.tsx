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
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/moodpass-logo.png" alt="Moodpass" className="auth-logo-img" />
      <div className="auth-tagline">experiências pra florescer juntas</div>
      {children}
    </div>
  );
}
