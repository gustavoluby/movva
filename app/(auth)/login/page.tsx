import { LoginForm } from "./login-form";
import { safeNext } from "@/lib/utils/safe-next";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return <LoginForm next={safeNext(next)} />;
}
