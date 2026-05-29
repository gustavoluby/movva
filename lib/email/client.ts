import "server-only";
import { render } from "@react-email/render";
import { Resend } from "resend";
import type { ReactElement } from "react";
import { writeFile } from "node:fs/promises";

const FROM = process.env.EMAIL_FROM || "Movva <noreply@movva.com.br>";
const REPLY_TO = process.env.EMAIL_REPLY_TO || "contato@movva.com.br";

export type SendResult =
  | { ok: true; id?: string; mock?: boolean; previewPath?: string }
  | { ok: false; error: string };

// Envia um email. Em MOCK (sem RESEND_API_KEY) não quebra: loga e salva o
// HTML renderizado em /tmp pra abrir no browser. Com a key, envia de verdade.
export async function sendEmail(
  to: string,
  subject: string,
  react: ReactElement,
): Promise<SendResult> {
  const html = await render(react, { pretty: false });
  const apiKey = process.env.RESEND_API_KEY;

  // ---- MOCK / DRY-RUN ----
  if (!apiKey) {
    let previewPath: string | undefined;
    try {
      previewPath = `/tmp/email-${Date.now()}.html`;
      await writeFile(previewPath, html, "utf8");
    } catch {
      previewPath = undefined;
    }
    console.log(
      `📧 MOCK: email enviado pra ${to} com assunto "${subject}"` +
        (previewPath ? ` → preview: ${previewPath}` : ""),
    );
    return { ok: true, mock: true, previewPath };
  }

  // ---- ENVIO REAL ----
  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from: FROM,
      to,
      replyTo: REPLY_TO,
      subject,
      html,
    });
    if (error) {
      console.error(`📧 ERRO enviando email pra ${to}:`, error);
      return { ok: false, error: error.message ?? String(error) };
    }
    console.log(`📧 email enviado pra ${to} (id: ${data?.id})`);
    return { ok: true, id: data?.id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`📧 EXCEÇÃO enviando email pra ${to}:`, msg);
    return { ok: false, error: msg };
  }
}
