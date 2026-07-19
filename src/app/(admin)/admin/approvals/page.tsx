"use client";

import { useEffect, useState, useCallback } from "react";
import { ShieldCheck, CheckCircle2, XCircle, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { EmptyState } from "@/components/dashboard/EmptyState";

interface PendingMentor {
  id: string;
  name: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

export default function AdminApprovalsPage() {
  const supabase = createClient();
  const [mentors, setMentors] = useState<PendingMentor[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPendingMentors = useCallback(async () => {
    setLoading(true);

    const { data } = await supabase
      .from("users")
      .select("id, name, email, is_active, created_at")
      .eq("role", "mentor")
      .eq("is_active", false)
      .order("created_at", { ascending: false });

    setMentors((data as PendingMentor[]) ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchPendingMentors();
  }, [fetchPendingMentors]);

  async function approve(mentorId: string) {
    await supabase.from("users").update({ is_active: true }).eq("id", mentorId);
    setMentors((prev) => prev.filter((m) => m.id !== mentorId));
  }

  async function reject(mentorId: string) {
    if (!confirm("Reject this mentor application? They will be removed.")) return;
    await supabase.from("users").delete().eq("id", mentorId);
    setMentors((prev) => prev.filter((m) => m.id !== mentorId));
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-[18px] font-semibold text-[var(--text-primary)] mb-1">Mentor Approvals</h2>
        <p className="text-[13px] text-[var(--text-muted)]">
          Review and approve pending mentor registrations.
          {mentors.length > 0 && (
            <span className="ml-1 font-medium text-[var(--text-warning)]">
              {mentors.length} pending
            </span>
          )}
        </p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--fill-accent)] border-t-transparent" />
        </div>
      )}

      {!loading && mentors.length === 0 && (
        <EmptyState
          icon={ShieldCheck}
          title="No pending approvals"
          description="All mentor registrations have been reviewed. New requests will appear here."
        />
      )}

      {!loading && mentors.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {mentors.map((mentor) => (
            <div
              key={mentor.id}
              className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-1)] p-4"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--bg-pro)] text-[14px] font-semibold text-[var(--text-pro)]">
                  {mentor.name?.charAt(0)?.toUpperCase() ?? "?"}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] font-medium text-[var(--text-primary)]">{mentor.name}</div>
                  <div className="flex items-center gap-1 text-[12px] text-[var(--text-muted)]">
                    <Mail size={11} />
                    <span className="truncate">{mentor.email}</span>
                  </div>
                </div>
              </div>

              <div className="mb-3 flex items-center justify-between">
                <span className="text-[11px] text-[var(--text-muted)]">
                  Registered {formatDate(mentor.created_at)}
                </span>
                <span className="rounded-full bg-[var(--bg-warning)] px-2 py-0.5 text-[11px] font-medium text-[var(--text-warning)]">
                  Pending
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => approve(mentor.id)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-sm)] bg-[var(--fill-accent)] py-2 text-[12px] font-medium text-[var(--on-accent)] transition-opacity hover:opacity-90"
                >
                  <CheckCircle2 size={14} />
                  Approve
                </button>
                <button
                  onClick={() => reject(mentor.id)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--border)] py-2 text-[12px] font-medium text-[var(--text-danger)] hover:bg-[var(--bg-danger)] transition-colors"
                >
                  <XCircle size={14} />
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
