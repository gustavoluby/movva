"use client";

import Link from "next/link";
import { useActionState, useRef, useState } from "react";
import { createCheckin, type CheckinState } from "@/app/comunidade/novo/actions";

type EventOption = { id: string; title: string };

export function CheckinForm({
  events,
  defaultEventId = "",
}: {
  events: EventOption[];
  defaultEventId?: string;
}) {
  const [state, formAction, isPending] = useActionState<CheckinState, FormData>(
    createCheckin,
    {},
  );
  const [preview, setPreview] = useState<string | null>(null);
  const [compressing, setCompressing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  // Foto já comprimida/convertida pra JPEG, pronta pra enviar.
  const photoRef = useRef<File | null>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      photoRef.current = null;
      setPreview(null);
      return;
    }
    setCompressing(true);
    try {
      const compressed = await compressImage(file);
      photoRef.current = compressed;
      setPreview(URL.createObjectURL(compressed));
    } catch {
      // Se a compressão falhar, manda o original (a action ainda valida o tamanho).
      photoRef.current = file;
      setPreview(URL.createObjectURL(file));
    } finally {
      setCompressing(false);
    }
  }

  // O input de arquivo NÃO tem name="photo": o original (que pode ter 8 MB+ e
  // estourar o limite de 4.5 MB da Vercel) nunca entra no FormData. Em vez disso
  // injetamos aqui a versão comprimida em JPEG.
  function handleAction(formData: FormData) {
    if (photoRef.current) {
      formData.set("photo", photoRef.current, "checkin.jpg");
    }
    formAction(formData);
  }

  return (
    <form action={handleAction} className="checkin-form">
      <header className="checkin-head">
        <Link href="/comunidade" className="checkin-back" aria-label="Voltar">
          ←
        </Link>
        <h1 className="checkin-title">Novo check-in</h1>
      </header>

      <button
        type="button"
        className="checkin-photo"
        onClick={() => fileRef.current?.click()}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="prévia" />
        ) : (
          <span className="checkin-photo-empty">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="m21 15-5-5L5 21" />
            </svg>
            adicionar foto
          </span>
        )}
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={onPick}
      />

      <div className="checkin-field">
        <label htmlFor="ci-loc">Onde você estava?</label>
        <input
          id="ci-loc"
          className="auth-input"
          type="text"
          name="location_name"
          placeholder="Ex.: Catedral de Curitiba, Batel..."
          autoComplete="off"
          required
        />
      </div>

      <div className="checkin-field">
        <label htmlFor="ci-text">Como foi?</label>
        <textarea
          id="ci-text"
          className="auth-input checkin-textarea"
          name="text"
          rows={4}
          placeholder="Conta pra elas como foi a experiência ✿"
        />
      </div>

      {events.length > 0 && (
        <div className="checkin-field">
          <label htmlFor="ci-event">Foi em algum evento Moodpass? (opcional)</label>
          <select
            id="ci-event"
            name="event_id"
            className="auth-input"
            defaultValue={defaultEventId}
          >
            <option value="">Nenhum / experiência avulsa</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.title}
              </option>
            ))}
          </select>
        </div>
      )}

      {state?.error && <div className="auth-error">{state.error}</div>}

      <p className="checkin-note">
        Seu check-in passa por uma aprovação rápida antes de aparecer no feed.
      </p>

      <button
        type="submit"
        className="auth-submit"
        disabled={isPending || compressing}
      >
        {compressing
          ? "Preparando foto..."
          : isPending
            ? "Enviando..."
            : "Publicar check-in"}
      </button>
    </form>
  );
}

// Redimensiona/comprime a imagem no navegador e exporta JPEG. Carrega via <img>
// (o Safari decodifica HEIC do iPhone aqui) e desenha num canvas, então a saída
// é sempre JPEG — converte HEIC e mantém o upload bem abaixo do limite da Vercel.
async function compressImage(
  file: File,
  maxDim = 1600,
  quality = 0.82,
): Promise<File> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("decode falhou"));
      el.src = url;
    });

    const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
    const w = Math.round(img.width * scale);
    const h = Math.round(img.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("sem contexto 2d");
    ctx.drawImage(img, 0, 0, w, h);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality),
    );
    if (!blob) throw new Error("toBlob falhou");

    return new File([blob], "checkin.jpg", { type: "image/jpeg" });
  } finally {
    URL.revokeObjectURL(url);
  }
}
