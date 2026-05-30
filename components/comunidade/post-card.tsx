"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { timeAgo, shortDay } from "@/lib/utils/date";
import {
  toggleLike,
  getComments,
  addComment,
  deleteComment,
  type Comment,
} from "@/app/comunidade/actions";

export type FeedPost = {
  id: string;
  text: string | null;
  photoUrl: string | null;
  locationName: string | null;
  locationLat: number | null;
  locationLng: number | null;
  createdAt: string | null;
  likesCount: number;
  commentsCount: number;
  liked: boolean;
  author: {
    name: string;
    handle: string | null;
    avatarUrl: string | null;
  };
  event: { title: string; goingCount: number } | null;
};

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

// Link pro Google Maps: por coordenadas se houver (exato), senão pelo nome.
function mapsUrl(post: FeedPost): string | null {
  if (post.locationLat != null && post.locationLng != null) {
    return `https://www.google.com/maps/search/?api=1&query=${post.locationLat},${post.locationLng}`;
  }
  if (post.locationName) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(post.locationName)}`;
  }
  return null;
}

export function PostCard({
  post,
  loggedIn,
  currentUserId,
  isAdmin = false,
}: {
  post: FeedPost;
  loggedIn: boolean;
  currentUserId?: string | null;
  isAdmin?: boolean;
}) {
  const [liked, setLiked] = useState(post.liked);
  const [likes, setLikes] = useState(post.likesCount);
  const [pending, startTransition] = useTransition();

  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [count, setCount] = useState(post.commentsCount);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  function onLike() {
    // Otimista — o servidor reconcilia via revalidate.
    setLiked((v) => !v);
    setLikes((n) => n + (liked ? -1 : 1));
    startTransition(async () => {
      await toggleLike(post.id);
    });
  }

  async function onToggleComments() {
    const next = !open;
    setOpen(next);
    if (next && !loaded) {
      setLoaded(true);
      const list = await getComments(post.id);
      setComments(list);
      setCount(list.length);
    }
  }

  async function onSubmitComment(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    const res = await addComment(post.id, text);
    setSending(false);
    if (res.ok) {
      setComments((c) => [...c, res.comment]);
      setCount((n) => n + 1);
      setDraft("");
    }
  }

  async function onDeleteComment(id: string) {
    // Otimista: tira da lista já; se falhar, não trava o feed.
    const prev = comments;
    setComments((c) => c.filter((x) => x.id !== id));
    setCount((n) => Math.max(n - 1, 0));
    const res = await deleteComment(id);
    if (!res.ok) {
      setComments(prev);
      setCount((n) => n + 1);
    }
  }

  const subtitle = post.event
    ? `foi em ${post.event.title}`
    : post.locationName
      ? `em ${post.locationName}`
      : null;
  const maps = mapsUrl(post);

  return (
    <article className="post-card">
      <header className="post-head">
        <div className="post-avatar">
          {post.author.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.author.avatarUrl} alt={post.author.name} />
          ) : (
            <span>{initials(post.author.name)}</span>
          )}
        </div>
        <div className="post-head-text">
          <div className="post-author">{post.author.name}</div>
          <div className="post-sub">
            {subtitle && <span>{subtitle}</span>}
            {subtitle && <span className="post-dot">·</span>}
            <span>{timeAgo(post.createdAt)}</span>
          </div>
        </div>
        {post.event && post.event.goingCount > 0 && (
          <div className="post-going">
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
            </svg>
            {post.event.goingCount} foram
          </div>
        )}
      </header>

      {post.photoUrl && (
        <div className="post-photo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.photoUrl} alt="" />
          {post.locationName && maps ? (
            <a
              className="post-pill post-pill-link"
              href={maps}
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              {post.locationName}
            </a>
          ) : (
            post.createdAt && (
              <span className="post-pill">{shortDay(post.createdAt)}</span>
            )
          )}
        </div>
      )}

      {post.text && <p className="post-text">{post.text}</p>}

      <div className="post-actions">
        <button
          type="button"
          onClick={onLike}
          disabled={pending}
          className={`post-action${liked ? " liked" : ""}`}
          aria-pressed={liked}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill={liked ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
          </svg>
          {likes > 0 && likes}
        </button>
        <button
          type="button"
          onClick={onToggleComments}
          className={`post-action${open ? " active" : ""}`}
          aria-expanded={open}
        >
          <svg
            width="20"
            height="20"
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
      </div>

      {open && (
        <div className="post-comments">
          {loaded ? (
            comments.length > 0 ? (
              <ul className="comment-list">
                {comments.map((c) => (
                  <li key={c.id} className="comment-item">
                    <span className="comment-avatar">
                      {c.author.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={c.author.avatarUrl} alt={c.author.name} />
                      ) : (
                        <span>{initials(c.author.name)}</span>
                      )}
                    </span>
                    <div className="comment-body">
                      <span className="comment-author">{c.author.name}</span>{" "}
                      <span className="comment-text">{c.text}</span>
                      <div className="comment-time">{timeAgo(c.createdAt)}</div>
                    </div>
                    {(isAdmin || (!!currentUserId && c.userId === currentUserId)) && (
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
              <p className="comment-empty">Seja a primeira a comentar ✿</p>
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
                placeholder="Escreve um comentário..."
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
              href="/login?next=/comunidade"
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
