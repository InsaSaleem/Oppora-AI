import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  tone?: "accent" | "success" | "warning" | "pro";
  badge?: string;
}

const TONE_MAP = {
  accent: { bg: "var(--bg-accent)", text: "var(--text-accent)" },
  success: { bg: "var(--bg-success)", text: "var(--text-success)" },
  warning: { bg: "var(--bg-warning)", text: "var(--text-warning)" },
  pro: { bg: "var(--bg-pro)", text: "var(--text-pro)" },
};

export function KpiCard({ icon: Icon, label, value, tone = "accent", badge }: KpiCardProps) {
  const colors = TONE_MAP[tone];

  return (
    <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-1)] p-4">
      <div className="mb-2.5 flex items-center justify-between">
        <div
          className="flex h-7 w-7 items-center justify-center rounded-md"
          style={{ background: colors.bg }}
        >
          <Icon size={15} style={{ color: colors.text }} />
        </div>
        {badge && (
          <span
            className={cn("rounded-full px-1.5 py-0.5 text-[11px] font-medium")}
            style={{ background: "var(--bg-success)", color: "var(--text-success)" }}
          >
            {badge}
          </span>
        )}
      </div>
      <div className="text-xl font-medium text-[var(--text-primary)]">{value}</div>
      <div className="text-[12px] text-[var(--text-muted)]">{label}</div>
    </div>
  );
}
