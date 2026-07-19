import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[var(--radius)] border border-dashed border-[var(--border)] py-10 text-center">
      <Icon size={22} className="mb-2 text-[var(--text-muted)]" />
      <div className="text-[13px] font-medium text-[var(--text-primary)]">{title}</div>
      <div className="mt-1 max-w-xs text-[12px] text-[var(--text-muted)]">{description}</div>
    </div>
  );
}
