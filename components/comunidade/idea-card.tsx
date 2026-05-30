"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { timeAgo } from "@/lib/utils/date";
import {
  toggleIdeaLike,
  toggleIdeaAnonymous,
  getIdeaComments,
  addIdeaComment,
  deleteIdeaComment,
  type IdeaComment,
} from "@/app/comunidade/ideias/actions";

export type Idea = {
  id: string;
  text: string;
  isAnonymous: boolean;
  createdAt: string | null;
  likesCount: number;
  commentsCount: number;
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
  currentUserId,
  isAdmin = false,
}: {
  idea: Idea;
  loggedIn: boolean;
  currentUserId?: string | null;
  isAdmin?: boolean;
}) {
  const [liked, setLiked] = useState(idea.liked);
  const [likes, setLikes] = useState(idea.likesCount);
  const [anon, setAnon] = useState(idea.isAnonymous);
  const [, startTransition] = useTransition();
  const [revealing, startReveal] = useTransition();

  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [comments, setComments] = useState<IdeaComment[]>([]);
  const [count, setCount] = useState(idea.commentsCount);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

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
      if (!res.ok) setAnon(!next);
    });
  }

  async function onToggleComments() {
    const next = !open;
    setOpen(next);
    if (next && !loaded) {
      setLoaded(true);
      const list = await getIdeaComments(idea.id);
      setComments(list);
      setCount(list.length);
    }
  }

  async function onSubmitComment(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    const res = await addIdeaComment(idea.id, text);
    setSending(false);
    if (res.ok) {
      setComments((c) => [...c, res.comment]);
      setCount((n) => n + 1);
      setDraft("");
    }
  }

  async function onDeleteComment(id: string) {
    const prev = comments;
    setComments((c) => c.filter((x) => x.id !== id));
    setCount((n) => Math.max(n - 1, 0));
    const res = await deleteIdeaComment(id);
    if (!res.ok) {
      setComments(prev);
      setCount((n) => n + 1);
    }
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

        <button
          type="button"
          onClick={onToggleComments}
          className={`idea-action${open ? " active" : ""}`}
          aria-expanded={open}
        >
          <svg
            width="19"
            height="19"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.7a8.5 8.5 0 0 1-.9-3.8 8.38 8.38 0 0 1 8.5-8.5 8.38 8.38 0 0 1 8.5 8.5z" />
          </svg>
          {count > 0 && count}
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

      {open && (
        <div className="idea-comments">
          {loaded ? (
            comments.length > 0 ? (
              <ul className="comment-list">
                {comments.map((c) => (
                  <li key={c.id} className="comment-item">
                    <span className="comment-avatar">
                      {c.author.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={c.author.avatarUrl} alt={c.author.name} />
                      ) : c.fromAnonAuthor ? (
                        <span aria-hidden>✿</span>
                      ) : (
                        <span>{initials(c.author.name)}</span>
                      )}
                    </span>
                    <div className="comment-body">
                      <span className="comment-author">{c.author.name}</span>{" "}
                      <span className="comment-text">{c.text}</span>
                      <div className="comment-time">{timeAgo(c.createdAt)}</div>
                    </div>
                    {(isAdmin ||
                      (!!currentUserId && c.userId === currentUserId)) && (
                      <button
                        type="button"
                        className="comment-delete"
                        onClick={() => onDeleteComment(c.id)}
                        aria-label="Apagar comentário"
                      >
                        <svg
                          width="15"
                          height="15"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M3 6h18" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="comment-empty">Seja a primeira a topar a ideia ✿</p>
            )
          ) : (
            <p className="comment-empty">carregando...</p>
          )}

          {loggedIn ? (
            <form onSubmit={onSubmitComment} className="comment-form">
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Comenta pra combinar..."
                className="comment-input"
                maxLength={500}
              />
              <button
                type="submit"
                className="comment-send"
                disabled={sending || !draft.trim()}
              >
                {sending ? "..." : "Enviar"}
              </button>
            </form>
          ) : (
            <Link
              href="/login?next=/comunidade/ideias"
              className="comment-login-cta"
            >
              Entre pra comentar →
            </Link>
          )}
        </div>
      )}
    </article>
  );
}
