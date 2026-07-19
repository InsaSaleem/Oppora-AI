"use client";

import { useEffect, useState, useCallback } from "react";
import { ListChecks, Clock, CheckCircle2, XCircle, Hourglass, MessageSquare } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { cn } from "@/lib/utils";
import type { ApplicationStatus, OpportunityRow } from "@/types/database";

interface ApplicationItem {
  id: string;
  status: ApplicationStatus;
  notes: string | null;
  applied_date: string;
  opportunities: OpportunityRow;
}

const STATUS_CONFIG: Record<ApplicationStatus, { label: string; bg: string; text: string; icon: typeof CheckCircle2 }> = {
  applied: { label: "Applied", bg: "var(--bg-accent)", text: "var(--text-accent)", icon: Clock },
  pending: { label: "Pending", bg: "var(--bg-warning)", text: "var(--text-warning)", icon: Hourglass },
  interview: { label: "Interview", bg: "var(--bg-pro)", text: "var(--text-pro)", icon: MessageSquare },
  accepted: { label: "Accepted", bg: "var(--bg-success)", text: "var(--text-success)", icon: CheckCircle2 },
  rejected: { label: "Rejected", bg: "var(--bg-danger)", text: "var(--text-danger)", icon: XCircle },
  archived: { label: "Archived", bg: "var(--fill-control)", text: "var(--text-muted)", icon: Clock },
};

export default function ApplicationsPage() {
  const supabase = createClient();
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<ApplicationStatus | "all">("all");

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    let q = supabase
      .from("applications")
      .select("id, status, notes, applied_date, opportunities(*)")
      .eq("student_id", user.id)
      .order("applied_date", { ascending: false });

    if (filterStatus !== "all") {
      q = q.eq("status", filterStatus);
    }

    const { data } = await q;
    setApplications((data as unknown as ApplicationItem[]) ?? []);
    setLoading(false);
  }, [supabase, filterStatus]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  const statusKeys = Object.keys(STATUS_CONFIG) as ApplicationStatus[];

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-[18px] font-semibold text-[var(--text-primary)] mb-1">My Applications</h2>
        <p className="text-[13px] text-[var(--text-muted)]">Track all the opportunities you&apos;ve applied to.</p>
      </div>

      {/* Status filter pills */}
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => setFilterStatus("all")}
          className={cn(
            "rounded-full px-3 py-1 text-[12px] font-medium transition-colors",
            filterStatus === "all"
              ? "bg-[var(--fill-accent)] text-[var(--on-accent)]"
              : "bg-[var(--fill-control)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          )}
        >
          All
        </button>
        {statusKeys.map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={cn(
              "rounded-full px-3 py-1 text-[12px] font-medium capitalize transition-colors",
              filterStatus === s
                ? "bg-[var(--fill-accent)] text-[var(--on-accent)]"
                : "bg-[var(--fill-control)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            )}
          >
            {STATUS_CONFIG[s].label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--fill-accent)] border-t-transparent" />
        </div>
      )}

      {!loading && applications.length === 0 && (
        <EmptyState
          icon={ListChecks}
          title="No applications yet"
          description="Browse opportunities and submit your first application."
        />
      )}

      {!loading && applications.length > 0 && (
        <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-1)] overflow-hidden">
          {/* Table header */}
          <div className="hidden sm:grid sm:grid-cols-[1fr_120px_100px_120px] gap-4 border-b border-[var(--border)] px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
            <span>Opportunity</span>
            <span>Status</span>
            <span>Applied</span>
            <span>Deadline</span>
          </div>

          {applications.map((app, idx) => {
            const opp = app.opportunities;
            const config = STATUS_CONFIG[app.status];
            const StatusIcon = config.icon;

            return (
              <div
                key={app.id}
                className={cn(
                  "flex flex-col gap-2 px-4 py-3 sm:grid sm:grid-cols-[1fr_120px_100px_120px] sm:items-center sm:gap-4",
                  idx < applications.length - 1 && "border-b border-[var(--border)]"
                )}
              >
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-medium text-[var(--text-primary)]">{opp.title}</div>
                  <div className="text-[12px] text-[var(--text-muted)]">
                    {opp.company ?? opp.type.replace("_", " ")}
                  </div>
                </div>
                <div>
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
                    style={{ background: config.bg, color: config.text }}
                  >
                    <StatusIcon size={11} />
                    {config.label}
                  </span>
                </div>
                <div className="text-[12px] text-[var(--text-muted)]">
                  {formatDate(app.applied_date)}
                </div>
                <div className="text-[12px] text-[var(--text-muted)]">
                  {formatDate(opp.deadline)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
