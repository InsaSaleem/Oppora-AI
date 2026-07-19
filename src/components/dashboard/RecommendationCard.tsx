import Link from "next/link";

interface RecommendationCardProps {
  opportunityId: string;
  title: string;
  meta: string;
  score: number;
}

export function RecommendationCard({ opportunityId, title, meta, score }: RecommendationCardProps) {
  return (
    <Link
      href="/dashboard/recommendations"
      className="flex items-center justify-between rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-1)] px-3.5 py-3 transition-colors hover:bg-[var(--fill-control)]"
    >
      <div className="min-w-0">
        <div className="truncate text-[13px] font-medium text-[var(--text-primary)]">{title}</div>
        <div className="text-[12px] text-[var(--text-muted)]">{meta}</div>
      </div>
      <span className="shrink-0 rounded-full bg-[var(--bg-accent)] px-2.5 py-1 text-[12px] font-medium text-[var(--text-accent)]">
        {Math.round(score)}% match
      </span>
    </Link>
  );
}
