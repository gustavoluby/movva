"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { reservarEPagar, validarCupom, type ReservaState } from "./actions";
import { formatPrice } from "@/lib/utils/date";

type Applied = { code: string; discountCents: number; finalCents: number };

// Tela de pagamento: mostra o total (com "de/por" quando há cupom), o campo de
// cupom e o botão de pagar. O cupom aplicado vai num input escondido do form de
// pagamento — a action revalida o código no servidor antes de cobrar.
export function CheckoutForm({
  slug,
  basePriceCents,
}: {
  slug: string;
  basePriceCents: number;
}) {
  const [state, formAction, paying] = useActionState<ReservaState, FormData>(
    reservarEPagar,
    null,
  );

  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [applied, setApplied] = useState<Applied | null>(null);
  const [couponErr, setCouponErr] = useState<string | null>(null);
  const [validating, startValidate] = useTransition();

  // CPF do pagador — enviado ao antifraude do MP (payer.identification). É o
  // sinal que mais reduz a recusa "pagamento suspeito" no cartão. Não guardamos
  // no banco; só repassamos pro MP na cobrança.
  const [cpf, setCpf] = useState("");
  const cpfDigits = cpf.replace(/\D/g, "");
  const cpfOk = cpfDigits.length === 11;
  const [cpfError, setCpfError] = useState<string | null>(null);
  const cpfRef = useRef<HTMLInputElement>(null);

  const finalCents = applied?.finalCents ?? basePriceCents;

  function aplicar() {
    const c = code.trim();
    if (!c) return;
    setCouponErr(null);
    startValidate(async () => {
      const res = await validarCupom(slug, c);
      if (res.ok) {
        setApplied({
          code: res.code,
          discountCents: res.discountCents,
          finalCents: res.finalCents,
        });
      } else {
        setApplied(null);
        setCouponErr(res.error);
      }
    });
  }

  function remover() {
    setApplied(null);
    setCode("");
    setCouponErr(null);
    setOpen(false);
  }

  // Máscara 000.000.000-00 enquanto digita (guarda só dígitos no submit).
  function formatCpf(v: string) {
    const d = v.replace(/\D/g, "").slice(0, 11);
    if (d.length > 9)
      return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
    if (d.length > 6) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
    if (d.length > 3) return `${d.slice(0, 3)}.${d.slice(3)}`;
    return d;
  }

  return (
    <>
      <div className="reservar-price-row">
        <span className="reservar-price-label">total</span>
        <span className="reservar-price-values">
          {applied && (
            <span className="reservar-price-old">
              {formatPrice(basePriceCents)}
            </span>
          )}
          <span className="reservar-price">{formatPrice(finalCents)}</span>
        </span>
      </div>

      <div className="coupon-block">
        {!open && !applied && (
          <button
            type="button"
            className="coupon-toggle"
            onClick={() => setOpen(true)}
          >
            Tem cupom de desconto?
          </button>
        )}

        {open && !applied && (
          <div className="coupon-row">
            <input
              className="coupon-input"
              placeholder="Digite o cupom"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
            />
            <button
              type="button"
              className="coupon-apply"
              onClick={aplicar}
              disabled={validating || !code.trim()}
            >
              {validating ? "…" : "Aplicar"}
            </button>
          </div>
        )}

        {applied && (
          <div className="coupon-applied">
            <span>
              Cupom <strong>{applied.code}</strong> aplicado · −
              {formatPrice(applied.discountCents)}
            </span>
            <button
              type="button"
              className="coupon-remove"
              onClick={remover}
            >
              remover
            </button>
          </div>
        )}

        {couponErr && <p className="coupon-error">{couponErr}</p>}
      </div>

      <div className="coupon-block" style={{ marginTop: 4 }}>
        <label
          htmlFor="checkout-cpf"
          style={{
            display: "block",
            fontSize: 13,
            fontWeight: 600,
            marginBottom: 6,
          }}
        >
          CPF do pagador
        </label>
        <input
          id="checkout-cpf"
          ref={cpfRef}
          className="coupon-input"
          style={{
            width: "100%",
            ...(cpfError
              ? { borderColor: "var(--accent)", outline: "2px solid var(--accent)" }
              : null),
          }}
          inputMode="numeric"
          autoComplete="off"
          placeholder="000.000.000-00"
          aria-invalid={cpfError ? true : undefined}
          value={cpf}
          onChange={(e) => {
            setCpf(formatCpf(e.target.value));
            if (cpfError) setCpfError(null);
          }}
        />
        <p
          className="reservar-subtitle"
          style={{ margin: "6px 0 0", fontSize: 12, opacity: 0.7 }}
        >
          Necessário pra aprovar o pagamento (o Mercado Pago usa pra confirmar
          sua identidade). Não fica salvo no app.
        </p>
      </div>

      <form
        action={formAction}
        onSubmit={(e) => {
          // Sem CPF válido: bloqueia, avisa e foca o campo (em vez de só deixar
          // o botão inerte, que confunde quem não vê por que "não acontece nada").
          if (!cpfOk) {
            e.preventDefault();
            setCpfError("Informe um CPF válido pra concluir o pagamento.");
            cpfRef.current?.focus();
            cpfRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          }
        }}
      >
        <input type="hidden" name="slug" value={slug} />
        <input type="hidden" name="coupon" value={applied?.code ?? ""} />
        <input type="hidden" name="cpf" value={cpfDigits} />
        {cpfError && (
          <p
            className="coupon-error"
            style={{
              margin: "0 0 10px",
              textAlign: "center",
              fontWeight: 600,
            }}
          >
            {cpfError}
          </p>
        )}
        <button className="cta-btn" type="submit" disabled={paying}>
          {paying ? "Abrindo pagamento…" : "Pagar com Pix ou cartão"}
          {!paying && (
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          )}
        </button>
      </form>

      {state?.error && (
        <p
          className="reservar-subtitle"
          style={{ marginTop: 12, marginBottom: 0, color: "var(--accent)" }}
        >
          {state.error}
        </p>
      )}
    </>
  );
}
