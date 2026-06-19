"use client";

import { useActionState, useState, useTransition } from "react";
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

      <form action={formAction}>
        <input type="hidden" name="slug" value={slug} />
        <input type="hidden" name="coupon" value={applied?.code ?? ""} />
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
