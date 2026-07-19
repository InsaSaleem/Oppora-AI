"use client";

import { useEffect, useState, useCallback } from "react";
import { Users, Send, CheckCircle2, AlertTriangle, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { cn } from "@/lib/utils";

interface MentorUser {
  id: string;
  name: string;
  bio: string | null;
  mentors?: { specialization: string | null; organization: string | null } | { specialization: string | null; organization: string | null }[] | null;
}

export default function BrowseMentorsPage() {
  const supabase = createClient();
  const [mentors, setMentors] = useState<MentorUser[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Track requests: "pending" | "accepted" | "rejected" | null
  const [requestStatus, setRequestStatus] = useState<Record<string, string>>({});
  const [requestingId, setRequestingId] = useState<string | null>(null);

  const fetchMentors = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const [mentorResponse, requestResponse, activeResponse] = await Promise.all([
      supabase.from("users").select("id, name, bio, mentors!mentors_user_id_fkey(specialization, organization)").eq("role", "mentor"),
      supabase.from("mentorship_requests").select("mentor_id, status").eq("student_id", user.id),
      supabase.from("mentor_students").select("mentor_id, status").eq("student_id", user.id),
    ]);

    console.log("Mentor fetch response:", mentorResponse);
    if (requestResponse.error) console.error("Request fetch error:", requestResponse.error);
    if (activeResponse.error) console.error("Active fetch error:", activeResponse.error);
    
    const mentorData = mentorResponse.data;
    const requestData = requestResponse.data;
    const activeData = activeResponse.data;

    setMentors((mentorData as unknown as MentorUser[]) ?? []);

    const statusMap: Record<string, string> = {};
    
    // Process existing requests
    if (requestData) {
      requestData.forEach((req) => {
        statusMap[req.mentor_id] = req.status;
      });
    }

    // Process active mentorships (overrides request status if active)
    if (activeData) {
      activeData.forEach((ms) => {
        if (ms.status === "active") {
          statusMap[ms.mentor_id] = "active";
        }
      });
    }

    setRequestStatus(statusMap);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchMentors();
  }, [fetchMentors]);

  async function handleRequest(mentorId: string) {
    console.log("handleRequest triggered for mentorId:", mentorId);
    setRequestingId(mentorId);
    
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error("Authentication Error: Cannot request mentorship without being logged in.", authError);
        alert("You must be logged in to request a mentor.");
        return;
      }
      
      console.log("Authenticated User ID:", user.id);

      const payload = {
        student_id: user.id,
        mentor_id: mentorId,
        status: "pending",
      };
      
      console.log("Attempting to insert payload into mentorship_requests:", payload);

      const { error: insertError } = await supabase.from("mentorship_requests").insert(payload);

      if (insertError) {
        // Postgres unique violation (duplicate key)
        if (insertError.code === "23505") {
          console.warn("Request already exists! Silently updating UI to pending.");
          setRequestStatus((prev) => ({ ...prev, [mentorId]: "pending" }));
          return;
        }

        console.error("Supabase Insert Error:", insertError);
        alert("Failed to send request: " + insertError.message);
        throw insertError;
      }

      console.log("Successfully requested mentorship! Updating UI...");
      setRequestStatus((prev) => ({ ...prev, [mentorId]: "pending" }));
      
    } catch (err) {
      console.error("Unexpected error in handleRequest:", err);
    } finally {
      setRequestingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-[18px] font-semibold text-[var(--text-primary)] mb-1">Browse Mentors</h2>
        <p className="text-[13px] text-[var(--text-muted)]">Connect with experienced professionals who can guide your career.</p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--fill-accent)] border-t-transparent" />
        </div>
      )}

      {!loading && mentors.length === 0 && (
        <EmptyState
          icon={Users}
          title="No mentors available"
          description="Check back later as new mentors join the platform."
        />
      )}

      {!loading && mentors.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {mentors.map((mentor) => {
            const status = requestStatus[mentor.id];
            const isRequesting = requestingId === mentor.id;
            
            // Handle array or object from Supabase join
            const mentorDetails = Array.isArray(mentor.mentors) ? mentor.mentors[0] : mentor.mentors;
            const specialization = mentorDetails?.specialization ?? "Professional Mentor";
            const organization = mentorDetails?.organization;

            return (
              <div
                key={mentor.id}
                className="flex flex-col rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-1)] p-5"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--bg-accent)] text-[16px] font-semibold text-[var(--text-accent)]">
                    {mentor.name?.charAt(0)?.toUpperCase() ?? "?"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-[15px] font-medium text-[var(--text-primary)]">{mentor.name}</h3>
                    <p className="truncate text-[12px] font-medium text-[var(--text-accent)]">{specialization}</p>
                    {organization && <p className="truncate text-[11px] text-[var(--text-muted)] mt-0.5">{organization}</p>}
                  </div>
                </div>
                
                <p className="text-[13px] text-[var(--text-secondary)] mb-5 line-clamp-3 flex-1">
                  {mentor.bio || "This mentor hasn't provided a bio yet."}
                </p>

                <div className="mt-auto">
                  {status === "active" ? (
                    <div className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-[var(--bg-success)] px-4 py-2 text-[13px] font-medium text-[var(--text-success)]">
                      <CheckCircle2 size={16} />
                      Active Mentor
                    </div>
                  ) : status === "pending" ? (
                    <div className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-[var(--bg-warning)] px-4 py-2 text-[13px] font-medium text-[var(--text-warning)]">
                      <Clock size={16} />
                      Request Pending
                    </div>
                  ) : status === "rejected" ? (
                    <div className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-[var(--fill-control)] px-4 py-2 text-[13px] font-medium text-[var(--text-muted)]">
                      <AlertTriangle size={16} />
                      Request Declined
                    </div>
                  ) : (
                    <button
                      onClick={() => handleRequest(mentor.id)}
                      disabled={isRequesting}
                      className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-[var(--fill-accent)] px-4 py-2 text-[13px] font-medium text-[var(--on-accent)] transition-opacity hover:opacity-90 disabled:opacity-60"
                    >
                      <Send size={15} />
                      {isRequesting ? "Sending..." : "Request Mentorship"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
