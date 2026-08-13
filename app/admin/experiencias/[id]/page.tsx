import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { canEditEvent, listOrganizers, requireStaff } from "@/lib/roles";
import {
  EventForm,
  type ActivityRow,
  type HostRow,
} from "../event-form";

export const dynamic = "force-dynamic";

const EVENT_COLUMNS =
  "id, slug, title, subtitle, description, category, cat_tag, event_date, event_time, duration, is_recurring, recurrence_rule, location_name, location_short, location_address, location_lat, location_lng, price_cents, price_tier2_cents, tier1_capacity, capacity, image_url, host_summary, host_photo_url, tag, tag_style, is_featured, status, what_to_bring, show_what_to_bring, owner_id, commission_type, commission_value, review_note";

export default async function EditarExperienciaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const viewer = await requireStaff(`/admin/experiencias/${id}`);

  const admin = createAdminClient();

  const [{ data: event }, { data: acts }, { data: hostLinks }] =
    await Promise.all([
      admin.from("events").select(EVENT_COLUMNS).eq("id", id).maybeSingle(),
      admin
        .from("event_activities")
        .select("icon, name, duration, sort_order")
        .eq("event_id", id)
        .order("sort_order", { ascending: true }),
      admin
        .from("event_hosts")
        .select("role, host_id, hosts(name, bio, photo_url, instagram)")
        .eq("event_id", id),
    ]);

  if (!event) notFound();
  // Organizadora só abre o que é dela.
  if (!canEditEvent(viewer, event)) redirect("/admin/experiencias");

  const organizers = viewer.isAdmin ? await listOrganizers() : [];

  const activities: ActivityRow[] = (acts ?? []).map((a) => ({
    icon: a.icon,
    name: a.name,
    duration: a.duration,
  }));

  const hosts: HostRow[] = (hostLinks ?? []).map((l) => {
    const h = l.hosts as unknown as {
      name?: string | null;
      bio?: string | null;
      photo_url?: string | null;
      instagram?: string | null;
    } | null;
    return {
      host_id: l.host_id,
      role: l.role,
      name: h?.name ?? null,
      bio: h?.bio ?? null,
      photo_url: h?.photo_url ?? null,
      instagram: h?.instagram ?? null,
    };
  });

  return (
    <div className="moodpass-shell">
      <div className="scroll-area">
        <header className="aprovar-head">
          <Link
            href="/admin/experiencias"
            className="hero-btn"
            aria-label="Voltar pras experiências"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5" />
              <path d="M12 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <div className="greeting-label">
              {viewer.isAdmin ? "admin" : "organizadora"} · editando
            </div>
            <div className="greeting-name">{event.title}</div>
          </div>
        </header>

        <EventForm
          event={event}
          activities={activities}
          hosts={hosts}
          isAdmin={viewer.isAdmin}
          organizers={organizers}
        />
      </div>
    </div>
  );
}
