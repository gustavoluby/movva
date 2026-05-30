"use client";

import { useState, useTransition } from "react";
import { timeAgo, shortDay } from "@/lib/utils/date";
import { toggleLike } from "@/app/comunidade/actions";

export type FeedPost = {
  id: string;
  text: string | null;
  photoUrl: string | null;
  locationName: string | null;
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

export function PostCard({ post }: { post: FeedPost }) {
  const [liked, setLiked] = useState(post.liked);
  const [likes, setLikes] = useState(post.likesCount);
  const [pending, startTransition] = useTransition();

  function onLike() {
    // Otimista — o servidor reconcilia via revalidate.
    setLiked((v) => !v);
    setLikes((n) => n + (liked ? -1 : 1));
    startTransition(async () => {
      await toggleLike(post.id);
    });
  }

  const subtitle = post.event
    ? `foi em ${post.event.title}`
    : post.locationName
      ? `em ${post.locationName}`
      : null;

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
          {(post.locationName || post.createdAt) && (
            <span className="post-pill">
              {post.locationName ? post.locationName : shortDay(post.createdAt)}
            </span>
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
        <span className="post-action">
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
          {post.commentsCount > 0 && post.commentsCount}
        </span>
        <span className="post-action">
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
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
        </span>
      </div>
    </article>
  );
}
