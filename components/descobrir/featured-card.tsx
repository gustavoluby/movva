import Link from "next/link";
import Image from "next/image";
import { eventStartTime, eventWeekday } from "@/lib/utils/date";

type FeaturedCardProps = {
  slug: string;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  eventDate: string;
  eventTime: string | null;
  capacity: number;
  goingCount: number;
  soldOut?: boolean;
};

export function FeaturedCard({
  slug,
  title,
  subtitle,
  imageUrl,
  eventDate,
  eventTime,
  capacity,
  goingCount,
  soldOut = false,
}: FeaturedCardProps) {
  const vagasLeft = Math.max(0, capacity - goingCount);

  return (
    <Link href={`/eventos/${slug}`} className="featured-card">
      {imageUrl && (
        <Image
          src={imageUrl}
          alt={title}
          fill
          priority
          sizes="(max-width: 640px) 100vw, 600px"
          style={{ objectFit: "cover" }}
        />
      )}
      <span className="featured-tag">Destaque da semana</span>
      <div className="featured-bookmark" aria-hidden>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
      </div>
      <div className="featured-content">
        <div className="featured-title">{title}</div>
        {subtitle && <div className="featured-subtitle">{subtitle}</div>}
        <div className="featured-meta">
          <span>{eventWeekday(eventDate)}</span>
          <span className="featured-meta-divider" />
          <span>{eventStartTime(eventTime)}</span>
          <span className="featured-meta-divider" />
          <span>{soldOut ? "Esgotado" : `${vagasLeft} vagas`}</span>
        </div>
      </div>
    </Link>
  );
}
