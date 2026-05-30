"use client";

import { useState, useTransition } from "react";
import { timeAgo } from "@/lib/utils/date";
import {
  toggleIdeaLike,
  toggleIdeaAnonymous,
} from "@/app/comunidade/ideias/actions";

export type Idea = {
  id: string;
  text: string;
  isAnonymous: boolean;
  createdAt: string | null;
  likesCount: number;
  liked: boolean;
  isMine: boolean;
  author: { name: string; avatarUrl: string | null };
};

const HOT_THRESHOLD = 10;

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function IdeaCard({
  idea,
  loggedIn,
}: {
  idea: Idea;
  loggedIn: boolean;
}) {
  const [liked, setLiked] = useState(idea.liked);
  const [likes, setLikes] = useState(idea.likesCount);
  const [anon, setAnon] = useState(idea.isAnonymous);
  const [, startTransition] = useTransition();
  const [revealing, startReveal] = useTransition();

  const showName = anon ? "Anônima" : idea.author.name;
  const showAvatar = anon ? null : idea.author.avatarUrl;

  function onLike() {
    if (!loggedIn) return;
    setLiked((v) => !v);
    setLikes((n) => n + (liked ? -1 : 1));
    startTransition(async () => {
      await toggleIdeaLike(idea.id);
    });
  }

  function onToggleAnon() {
    const next = !anon;
    setAnon(next);
    startReveal(async () => {
      const res = await toggleIdeaAnonymous(idea.id);
      if (!res.ok) setAnon(!next); // reverte se falhar
    });
  }

  const hot = likes >= HOT_THRESHOLD;

  return (
    <article className="idea-card">
      <header className="idea-head">
        <span className="idea-avatar">
          {showAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={showAvatar} alt={showName} />
          ) : anon ? (
            <span aria-hidden>✿</span>
          ) : (
            <span>{initials(showName)}</span>
          )}
        </span>
        <span className="idea-author">{showName}</span>
        <span className="idea-time">{timeAgo(idea.createdAt)}</span>
      </header>

      <p className="idea-text">{idea.text}</p>

      <div className="idea-actions">
        <button
          type="button"
          onClick={onLike}
          disabled={!loggedIn}
          className={`idea-action${liked ? " liked" : ""}`}
          aria-pressed={liked}
          aria-label="Eu topo"
        >
          <svg
            width="19"
            height="19"
            viewBox="0 0 24 24"
            fill={liked ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
          </svg>
          {likes > 0 ? `${likes} topam` : "Eu topo"}
        </button>

        {hot && <span className="idea-hot">Em alta</span>}

        {idea.isMine && (
          <button
            type="button"
            onClick={onToggleAnon}
            disabled={revealing}
            className="idea-reveal"
          >
            {anon ? "Revelar meu perfil" : "Voltar a anônima"}
          </button>
        )}
      </div>
    </article>
  );
}
