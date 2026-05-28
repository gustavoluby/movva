import Link from "next/link";
import {
  eventStartTime,
  eventWeekday,
  formatPrice,
} from "@/lib/utils/date";

type EventCardProps = {
  slug: string;
  title: string;
  subtitle: string | null;
  category: string | null;
  catTag: string | null;
  tag: string | null;
  tagStyle: string | null;
  imageUrl: string | null;
  eventDate: string;
  eventTime: string | null;
  locationName: string;
  priceCents: number;
  capacity: number;
  goingCount: number;
};

export function EventCard({
  slug,
  title,
  subtitle,
  category,
  tag,
  tagStyle,
  imageUrl,
  eventDate,
  eventTime,
  locationName,
  priceCents,
  capacity,
  goingCount,
}: EventCardProps) {
  return (
    <Link href={`/eventos/${slug}`} className="event-card">
      <div
        className="event-card-img"
        style={imageUrl ? { backgroundImage: `url('${imageUrl}')` } : undefined}
      >
        {tag && (
          <span
            className={`ec-tag${tagStyle === "accent" ? " accent" : ""}`}
          >
            {tag}
          </span>
        )}
        <div className="ec-going">
          <svg
            width="11"
            height="11"
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
          {goingCount}/{capacity} mulheres
        </div>
      </div>
      <div className="event-card-body">
        {category && <div className="event-card-category">{category}</div>}
        <div className="event-card-title">{title}</div>
        {subtitle && <div className="event-card-subtitle">{subtitle}</div>}
        <div className="event-card-meta">
          <div className="ec-meta-left">
            <div className="ec-date-line">
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
              {eventWeekday(eventDate)} · {eventStartTime(eventTime)}
            </div>
            <div className="ec-place">{locationName}</div>
          </div>
          <div>
            <span className="ec-price-label">a partir de</span>
            <span className="ec-price">{formatPrice(priceCents)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
