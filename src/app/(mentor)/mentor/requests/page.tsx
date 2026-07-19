"use client";

import { useEffect, useState, useCallback } from "react";
import { Bell, Check, X, UserPlus, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getMentorRowId } from "@/lib/mentor";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { cn } from "@/lib/utils";

interface MentorshipRequest {
  id: string;
  student_id: string;
  status: string;
  created_at: string;
  users: {
    name: string;
    email: string;
    bio: string | null;
  };
}

export default function MentorshipRequestsPage() {
  const supabase = createClient();
  const [requests, setRequests] = useState<MentorshipRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    console.log("Fetching requests for Mentor ID:", user.id);

    const response = await supabase
      .from("mentorship_requests")
      .select("id, student_id, status, created_at, users!mentorship_requests_student_id_fkey(name, email, bio)")
      .eq("mentor_id", user.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    console.log("Mentor requests fetch response:");
    console.log("- Data:", response.data);
    console.log("- Error:", response.error);

    if (response.error) {
      console.error("Failed to fetch requests! Error details:", response.error);
    }

    setRequests((response.data as unknown as MentorshipRequest[]) ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  async function handleAction(requestId: string, studentId: string, action: "accepted" | "rejected") {
    setProcessingId(requestId);
    setError(null);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // 1. Update request status
      const { error: updateError } = await supabase
        .from("mentorship_requests")
        .update({ status: action })
        .eq("id", requestId);
        
      if (updateError) throw updateError;

      // 2. If accepted, insert into mentor_students
      if (action === "accepted") {
        // mentor_students.mentor_id references mentors.id, NOT the auth
        // user id — fetch the real row id instead of assuming they match.
        const mentorRowId = await getMentorRowId(supabase, user.id);

        if (!mentorRowId) {
          console.error("Mentor verification failed! No mentors row for user_id:", user.id);
          alert("Cannot accept request: You must have an active profile in the mentors table.");
          throw new Error("Mentor not found");
        }

        console.log("Preparing to upsert into mentor_students. mentor_id:", mentorRowId, "student_id:", studentId);

        const { error: insertError } = await supabase
          .from("mentor_students")
          .upsert(
            {
              mentor_id: mentorRowId,
              student_id: studentId,
              status: "active"
            },
            { onConflict: "mentor_id,student_id" }
          );
          
        if (insertError) {
          console.error("Foreign Key or Insert Error on mentor_students:", insertError);
          throw insertError;
        }
        // Notifying the student is now handled by a database trigger on
        // mentorship_requests (fires when status changes to accepted),
        // rather than this client inserting a row on their behalf.
      }

      // Remove from list
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
      
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setProcessingId(null);
    }
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-[18px] font-semibold text-[var(--text-primary)] mb-1">Mentorship Requests</h2>
        <p className="text-[13px] text-[var(--text-muted)]">Review and manage pending mentorship requests from students.</p>
      </div>

      {error && (
        <div className="rounded-[var(--radius-sm)] bg-[var(--bg-danger)] px-4 py-3 text-[13px] font-medium text-[var(--text-danger)]">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--fill-accent)] border-t-transparent" />
        </div>
      )}

      {!loading && requests.length === 0 && (
        <EmptyState
          icon={Bell}
          title="No pending requests"
          description="You don't have any pending mentorship requests at this time."
        />
      )}

      {!loading && requests.length > 0 && (
        <div className="grid grid-cols-1 gap-4">
          {requests.map((request) => {
            const student = Array.isArray(request.users) ? request.users[0] : request.users;
            const isProcessing = processingId === request.id;

            return (
              <div
                key={request.id}
                className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-1)] p-5"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--bg-accent)] text-[14px] font-semibold text-[var(--text-accent)] mt-1">
                    {(student as { name: string })?.name?.charAt(0)?.toUpperCase() ?? "?"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-[15px] font-medium text-[var(--text-primary)]">
                        {(student as { name: string })?.name}
                      </h3>
                      <span className="flex items-center gap-1 rounded-full bg-[var(--bg-warning)] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-[var(--text-warning)]">
                        <Clock size={10} />
                        New Request
                      </span>
                    </div>
                    <p className="text-[13px] text-[var(--text-secondary)] mb-2">
                      {(student as { email: string })?.email}
                    </p>
                    {(student as { bio: string })?.bio && (
                      <p className="text-[12px] text-[var(--text-muted)] line-clamp-2">
                        "{(student as { bio: string }).bio}"
                      </p>
                    )}
                    <div className="mt-2 text-[11px] text-[var(--text-muted)]">
                      Requested on {formatDate(request.created_at)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 md:ml-4 border-t border-[var(--border)] pt-4 md:border-t-0 md:pt-0">
                  <button
                    onClick={() => handleAction(request.id, request.student_id, "accepted")}
                    disabled={isProcessing}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-[var(--bg-success)] px-4 py-2 text-[13px] font-medium text-[var(--text-success)] hover:bg-[var(--text-success)] hover:text-white transition-colors disabled:opacity-50"
                  >
                    <Check size={15} />
                    Accept
                  </button>
                  <button
                    onClick={() => handleAction(request.id, request.student_id, "rejected")}
                    disabled={isProcessing}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-0)] px-4 py-2 text-[13px] font-medium text-[var(--text-secondary)] hover:bg-[var(--fill-control)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-50"
                  >
                    <X size={15} />
                    Decline
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
