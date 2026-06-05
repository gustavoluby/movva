// Dispara um e-mail de boas-vindas REAL via Resend, pra teste manual.
// Uso: npx tsx --tsconfig ./tsconfig.emails.json --env-file=.env.local \
//        scripts/send-test-welcome.tsx [email-destino]
// (não usa lib/email/client.ts pra evitar o import "server-only" do Next)
import { render } from "@react-email/render";
import { Resend } from "resend";
import { WelcomeEmail } from "@/emails/WelcomeEmail";

const to = process.argv[2] || "gustavo@leadster.com.br";
const FROM = process.env.EMAIL_FROM || "Moodpass <noreply@moodpass.com.br>";
const REPLY_TO = process.env.EMAIL_REPLY_TO || "gustavo@leadster.com.br";

async function main() {
  const key = process.env.RESEND_API_KEY;
  console.log("FROM:", FROM);
  console.log("TO:", to);
  console.log("RESEND_API_KEY:", key ? "presente" : "AUSENTE (não envia)");
  if (!key) return;

  const html = await render(
    <WelcomeEmail user={{ fullName: "Gustavo Teste", email: to }} events={[]} />,
    { pretty: false },
  );

  const resend = new Resend(key);
  const { data, error } = await resend.emails.send({
    from: FROM,
    to,
    replyTo: REPLY_TO,
    subject: "Bem-vinda à Moodpass 🌸",
    html,
  });
  console.log("data:", data);
  console.log("error:", error);
}

main();
