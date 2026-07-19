"use client";

import { useEffect, useState, useCallback } from "react";
import { ClipboardList, Clock, CheckCircle2, XCircle, Hourglass, MessageSquare } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getMentorRowId } from "@/lib/mentor";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { cn } from "@/lib/utils";
import type { ApplicationStatus, OpportunityRow } from "@/types/database";

interface AssignedApp {
  id: string;
  status: ApplicationStatus;
  notes: string | null;
  applied_date: string;
  student_id: string;
  opportunities: OpportunityRow;
  users: { name: string; email: string };
}

const STATUS_CONFIG: Record<ApplicationStatus, { label: string; bg: string; text: string }> = {
  applied: { label: "Applied", bg: "var(--bg-accent)", text: "var(--text-accent)" },
  pending: { label: "Pending", bg: "var(--bg-warning)", text: "var(--text-warning)" },
  interview: { label: "Interview", bg: "var(--bg-pro)", text: "var(--text-pro)" },
  accepted: { label: "Accepted", bg: "var(--bg-success)", text: "var(--text-success)" },
  rejected: { label: "Rejected", bg: "var(--bg-danger)", text: "var(--text-danger)" },
  archived: { label: "Archived", bg: "var(--fill-control)", text: "var(--text-muted)" },
};

export default function MentorApplicationsPage() {
  const supabase = createClient();
  const [applications, setApplications] = useState<AssignedApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "accepted" | "rejected" | "all">("pending");

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const mentorRowId = await getMentorRowId(supabase, user.id);
    if (!mentorRowId) { setApplications([]); setLoading(false); return; }

    // Get student IDs this mentor is responsible for
    const { data: mentorships } = await supabase
      .from("mentor_students")
      .select("student_id")
      .eq("mentor_id", mentorRowId)
      .eq("status", "active");

    const studentIds = (mentorships ?? []).map((m: { student_id: string }) => m.student_id);

    if (studentIds.length === 0) {
      setApplications([]);
      setLoading(false);
      return;
    }

    let q = supabase
      .from("applications")
      .select("id, status, notes, applied_date, student_id, opportunities(*), users!applications_student_id_fkey(name, email)")
      .in("student_id", studentIds)
      .order("applied_date", { ascending: false });

    if (filter !== "all") {
      q = q.eq("status", filter);
    }

    const { data } = await q;

    setApplications((data as unknown as AssignedApp[]) ?? []);
    setLoading(false);
  }, [supabase, filter]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-[18px] font-semibold text-[var(--text-primary)] mb-1">Assigned Applications</h2>
        <p className="text-[13px] text-[var(--text-muted)]">Applications from your mentored students.</p>
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-1.5">
        {(["all", "pending", "accepted", "rejected"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={cn(
              "rounded-full px-3 py-1 text-[12px] font-medium capitalize transition-colors",
              filter === s
                ? "bg-[var(--fill-accent)] text-[var(--on-accent)]"
                : "bg-[var(--fill-control)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            )}
          >
            {s}
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
          icon={ClipboardList}
          title="No assigned applications"
          description="Applications from your mentored students will appear here."
        />
      )}

      {!loading && applications.length > 0 && (
        <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-1)] overflow-hidden">
          {/* Header */}
          <div className="hidden sm:grid sm:grid-cols-[1fr_140px_120px_100px] gap-4 border-b border-[var(--border)] px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
            <span>Opportunity</span>
            <span>Student</span>
            <span>Status</span>
            <span>Applied</span>
          </div>

          {applications.map((app, idx) => {
            const config = STATUS_CONFIG[app.status];
            const student = Array.isArray(app.users) ? app.users[0] : app.users;

            return (
              <div
                key={app.id}
                className={cn(
                  "flex flex-col gap-2 px-4 py-3 sm:grid sm:grid-cols-[1fr_140px_120px_100px] sm:items-center sm:gap-4",
                  idx < applications.length - 1 && "border-b border-[var(--border)]"
                )}
              >
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-medium text-[var(--text-primary)]">
                    {app.opportunities.title}
                  </div>
                  <div className="text-[12px] text-[var(--text-muted)]">
                    {app.opportunities.company ?? app.opportunities.type.replace("_", " ")}
                  </div>
                </div>
                <div className="text-[12px] text-[var(--text-secondary)]">
                  {(student as { name: string })?.name ?? "Unknown"}
                </div>
                <div>
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
                    style={{ background: config.bg, color: config.text }}
                  >
                    {config.label}
                  </span>
                </div>
                <div className="text-[12px] text-[var(--text-muted)]">
                  {formatDate(app.applied_date)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
