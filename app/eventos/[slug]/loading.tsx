import { EventDetailSkeleton } from "@/components/layout/skeletons";

export default function Loading() {
  return (
    <div className="moodpass-shell">
      <EventDetailSkeleton />
    </div>
  );
}
