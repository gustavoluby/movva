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
      <img
        src="/moodpass-logo.webp"
        alt="Moodpass"
        className="auth-logo-img"
        width={156}
        height={96}
      />
      <div className="auth-tagline">experiências pra florescer juntas</div>
      {children}
    </div>
  );
}
