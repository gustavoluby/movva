import { SignupForm } from "./signup-form";
import { safeNext } from "@/lib/utils/safe-next";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return <SignupForm next={safeNext(next)} />;
}
