"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/admin";

async function requireAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return isAdmin(user?.email);
}

type CouponFields = {
  discount_type: "percentage" | "fixed";
  discount_value: number;
  event_id: string | null;
  max_uses: number | null;
  valid_until: string | null;
};

// Lê os campos comuns (sem o código) e normaliza pro schema de coupons.
function parseFields(formData: FormData): CouponFields | null {
  const discountType = String(formData.get("discount_type") ?? "");
  if (discountType !== "percentage" && discountType !== "fixed") return null;

  const rawValue = Number(
    String(formData.get("discount_value") ?? "").replace(",", "."),
  );
  if (!Number.isFinite(rawValue) || rawValue <= 0) return null;
  if (discountType === "percentage" && rawValue > 100) return null;
  // percentage: guarda o número (1-100). fixed: admin digita em reais → centavos.
  const discountValue =
    discountType === "percentage"
      ? Math.round(rawValue)
      : Math.round(rawValue * 100);

  const eventId = String(formData.get("event_id") ?? "").trim() || null;

  const maxUsesRaw = String(formData.get("max_uses") ?? "").trim();
  const maxUses =
    maxUsesRaw && Number.isFinite(Number(maxUsesRaw))
      ? Math.max(1, Math.round(Number(maxUsesRaw)))
      : null;

  const validUntilRaw = String(formData.get("valid_until") ?? "").trim();
  // input date "YYYY-MM-DD" → fim do dia em ISO.
  const validUntil = validUntilRaw
    ? new Date(`${validUntilRaw}T23:59:59`).toISOString()
    : null;

  return {
    discount_type: discountType,
    discount_value: discountValue,
    event_id: eventId,
    max_uses: maxUses,
    valid_until: validUntil,
  };
}

export async function criarCupom(formData: FormData): Promise<void> {
  if (!(await requireAdmin())) return;

  const code = String(formData.get("code") ?? "")
    .trim()
    .toUpperCase();
  const fields = parseFields(formData);
  if (!code || !fields) return;

  const admin = createAdminClient();
  await admin.from("coupons").insert({ code, is_active: true, ...fields });

  revalidatePath("/admin/cupons");
}

export async function atualizarCupom(formData: FormData): Promise<void> {
  if (!(await requireAdmin())) return;

  // O código é a PK e não muda na edição (vem como hidden).
  const code = String(formData.get("code") ?? "").trim();
  const fields = parseFields(formData);
  if (!code || !fields) return;

  const admin = createAdminClient();
  await admin.from("coupons").update(fields).eq("code", code);

  revalidatePath("/admin/cupons");
}

// Liga/desliga sem apagar (preserva o histórico de uso).
export async function toggleCupom(formData: FormData): Promise<void> {
  if (!(await requireAdmin())) return;

  const code = String(formData.get("code") ?? "").trim();
  const active = String(formData.get("active") ?? "") === "true";
  if (!code) return;

  const admin = createAdminClient();
  await admin.from("coupons").update({ is_active: !active }).eq("code", code);

  revalidatePath("/admin/cupons");
}

export async function excluirCupom(formData: FormData): Promise<void> {
  if (!(await requireAdmin())) return;

  const code = String(formData.get("code") ?? "").trim();
  if (!code) return;

  const admin = createAdminClient();
  await admin.from("coupons").delete().eq("code", code);

  revalidatePath("/admin/cupons");
}
