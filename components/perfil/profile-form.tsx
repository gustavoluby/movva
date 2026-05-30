"use client";

import { useActionState, useRef, useState } from "react";
import { updateProfile, type ProfileState } from "@/app/perfil/actions";

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function ProfileForm({
  fullName,
  instagram,
  avatarUrl,
}: {
  fullName: string;
  instagram: string | null;
  avatarUrl: string | null;
}) {
  const [state, formAction, isPending] = useActionState<ProfileState, FormData>(
    updateProfile,
    {},
  );
  const [preview, setPreview] = useState<string | null>(avatarUrl);
  const [name, setName] = useState(fullName);
  const fileRef = useRef<HTMLInputElement>(null);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setPreview(URL.createObjectURL(file));
  }

  return (
    <form action={formAction} className="profile-form">
      <button
        type="button"
        className="profile-avatar-edit"
        onClick={() => fileRef.current?.click()}
        aria-label="Trocar foto"
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="sua foto" />
        ) : (
          <span className="profile-avatar-initials">
            {initials(name || "M")}
          </span>
        )}
        <span className="profile-avatar-cam">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
        </span>
      </button>
      <input
        ref={fileRef}
        type="file"
        name="photo"
        accept="image/*"
        hidden
        onChange={onPick}
      />
      <span className="profile-avatar-hint">toque pra trocar a foto</span>

      <div className="profile-field">
        <label htmlFor="pf-name">Nome</label>
        <input
          id="pf-name"
          className="auth-input"
          type="text"
          name="full_name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          required
        />
      </div>

      <div className="profile-field">
        <label htmlFor="pf-insta">Instagram</label>
        <div className="profile-insta-wrap">
          <span className="profile-insta-at">@</span>
          <input
            id="pf-insta"
            className="auth-input profile-insta-input"
            type="text"
            name="instagram"
            defaultValue={instagram ?? ""}
            placeholder="seu_usuario"
            autoComplete="off"
          />
        </div>
      </div>

      {state?.error && <div className="auth-error">{state.error}</div>}
      {state?.ok && <div className="profile-saved">Perfil salvo ✦</div>}

      <button type="submit" className="auth-submit" disabled={isPending}>
        {isPending ? "Salvando..." : "Salvar"}
      </button>
    </form>
  );
}
