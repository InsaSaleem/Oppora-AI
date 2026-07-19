"use client";

import { useEffect, useState, useCallback } from "react";
import { Users, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getMentorRowId } from "@/lib/mentor";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { cn } from "@/lib/utils";

interface MentorshipItem {
  id: string;
  status: "active" | "completed" | "paused";
  started_at: string;
  users: { name: string; email: string; avatar_url: string | null };
}

const STATUS_COLORS = {
  active: { bg: "var(--bg-success)", text: "var(--text-success)" },
  completed: { bg: "var(--bg-accent)", text: "var(--text-accent)" },
  paused: { bg: "var(--bg-warning)", text: "var(--text-warning)" },
};

export default function MentorStudentsPage() {
  const supabase = createClient();
  const [mentorships, setMentorships] = useState<MentorshipItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "completed" | "paused">("all");

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const mentorRowId = await getMentorRowId(supabase, user.id);
    if (!mentorRowId) { setMentorships([]); setLoading(false); return; }

    let q = supabase
      .from("mentor_students")
      .select("id, status, started_at, users!mentor_students_student_id_fkey(name, email, avatar_url)")
      .eq("mentor_id", mentorRowId)
      .order("started_at", { ascending: false });

    if (filter !== "all") {
      q = q.eq("status", filter);
    }

    const { data } = await q;
    setMentorships((data as unknown as MentorshipItem[]) ?? []);
    setLoading(false);
  }, [supabase, filter]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-[18px] font-semibold text-[var(--text-primary)] mb-1">My Students</h2>
        <p className="text-[13px] text-[var(--text-muted)]">Manage your mentorship relationships.</p>
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-1.5">
        {(["all", "active", "completed", "paused"] as const).map((s) => (
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

      {!loading && mentorships.length === 0 && (
        <EmptyState
          icon={Users}
          title="No students found"
          description="Students will appear here once they are assigned to you."
        />
      )}

      {!loading && mentorships.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {mentorships.map((ms) => {
            const student = ms.users;
            const colors = STATUS_COLORS[ms.status];

            return (
              <div
                key={ms.id}
                className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-1)] p-4"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--bg-accent)] text-[14px] font-semibold text-[var(--text-accent)]">
                    {student.name?.charAt(0)?.toUpperCase() ?? "?"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[14px] font-medium text-[var(--text-primary)]">
                      {student.name}
                    </div>
                    <div className="flex items-center gap-1 text-[12px] text-[var(--text-muted)]">
                      <Mail size={11} />
                      <span className="truncate">{student.email}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[var(--text-muted)]">
                    Since {formatDate(ms.started_at)}
                  </span>
                  <span
                    className="rounded-full px-2 py-0.5 text-[11px] font-medium capitalize"
                    style={{ background: colors.bg, color: colors.text }}
                  >
                    {ms.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
