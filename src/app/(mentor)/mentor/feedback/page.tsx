"use client";

import { useEffect, useState, useCallback } from "react";
import { MessageSquare, Star, Send, CheckCircle2, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getMentorRowId } from "@/lib/mentor";
import { EmptyState } from "@/components/dashboard/EmptyState";

interface MentorshipOption {
  id: string;
  student_id: string;
  users: { name: string; email: string };
}

interface FeedbackItem {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  student_id: string;
  users: { name: string };
}

export default function MentorFeedbackPage() {
  const supabase = createClient();
  const [mentorships, setMentorships] = useState<MentorshipOption[]>([]);
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [selectedMentorship, setSelectedMentorship] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Filters for Past Feedback
  const [filterStudent, setFilterStudent] = useState<string>("all");
  const [filterRating, setFilterRating] = useState<string>("all");

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const mentorRowId = await getMentorRowId(supabase, user.id);
    if (!mentorRowId) { setLoading(false); return; }

    const [{ data: ms }, { data: fb }] = await Promise.all([
      supabase
        .from("mentor_students")
        .select("id, student_id, users!mentor_students_student_id_fkey(name, email)")
        .eq("mentor_id", mentorRowId)
        .eq("status", "active"),
      supabase
        .from("mentor_feedback")
        .select("id, rating, comment, created_at, student_id, users!mentor_feedback_student_id_fkey(name)")
        .eq("mentor_id", mentorRowId)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    setMentorships((ms as unknown as MentorshipOption[]) ?? []);
    setFeedbacks((fb as unknown as FeedbackItem[]) ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedMentorship) return;

    setSubmitting(true);
    setFeedback(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSubmitting(false); return; }

    const mentorRowId = await getMentorRowId(supabase, user.id);
    if (!mentorRowId) {
      setSubmitting(false);
      setFeedback({ type: "error", message: "Your mentor profile could not be found." });
      return;
    }

    const mentorship = mentorships.find((m) => m.id === selectedMentorship);
    if (!mentorship) { setSubmitting(false); return; }

    const { error } = await supabase.from("mentor_feedback").insert({
      mentorship_id: selectedMentorship,
      mentor_id: mentorRowId,
      student_id: mentorship.student_id,
      rating,
      comment: comment.trim() || null,
    });

    setSubmitting(false);

    if (error) {
      setFeedback({ type: "error", message: error.message });
    } else {
      await supabase.from("notifications").insert({
        user_id: mentorship.student_id,
        type: "mentor_feedback",
        title: "New Mentor Feedback",
        message: "Your mentor has submitted a new review/rating for you.",
      });

      setFeedback({ type: "success", message: "Feedback submitted successfully!" });
      setComment("");
      setRating(5);
      setSelectedMentorship("");
      fetchData();
    }
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--fill-accent)] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-[18px] font-semibold text-[var(--text-primary)] mb-1">Give Feedback</h2>
        <p className="text-[13px] text-[var(--text-muted)]">Share reviews and ratings for your mentored students.</p>
      </div>

      {/* Submit form */}
      <form onSubmit={handleSubmit} className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-1)] p-5">
        <h3 className="text-[14px] font-medium text-[var(--text-primary)] mb-4">New Feedback</h3>

        {mentorships.length === 0 ? (
          <p className="text-[13px] text-[var(--text-muted)]">No active mentorships to provide feedback for.</p>
        ) : (
          <div className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-[var(--text-secondary)]">Select Student</label>
              <select
                value={selectedMentorship}
                onChange={(e) => setSelectedMentorship(e.target.value)}
                className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-0)] px-3 py-2 text-[13px] text-[var(--text-primary)] outline-none focus:border-[var(--fill-accent)]"
              >
                <option value="">Choose a student...</option>
                {mentorships.map((ms) => {
                  const student = Array.isArray(ms.users) ? ms.users[0] : ms.users;
                  return (
                    <option key={ms.id} value={ms.id}>
                      {(student as { name: string }).name} ({(student as { email: string }).email})
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-[var(--text-secondary)]">Rating</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(n)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      size={22}
                      fill={n <= rating ? "var(--text-warning)" : "none"}
                      stroke={n <= rating ? "var(--text-warning)" : "var(--text-muted)"}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-[var(--text-secondary)]">Comment (optional)</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                className="w-full resize-none rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-0)] px-3 py-2 text-[13px] text-[var(--text-primary)] outline-none focus:border-[var(--fill-accent)] placeholder:text-[var(--text-muted)]"
                placeholder="Share your thoughts on this student's progress..."
              />
            </div>

            {feedback && (
              <div className={`flex items-center gap-2 rounded-[var(--radius-sm)] px-4 py-2.5 text-[13px] font-medium ${
                feedback.type === "success"
                  ? "bg-[var(--bg-success)] text-[var(--text-success)]"
                  : "bg-[var(--bg-danger)] text-[var(--text-danger)]"
              }`}>
                {feedback.type === "success" ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
                {feedback.message}
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!selectedMentorship || submitting}
                className="flex items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--fill-accent)] px-4 py-2 text-[13px] font-medium text-[var(--on-accent)] transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                <Send size={13} />
                {submitting ? "Submitting..." : "Submit feedback"}
              </button>
            </div>
          </div>
        )}
      </form>

      {/* Past feedback */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h3 className="text-[14px] font-medium text-[var(--text-primary)]">Past Feedback</h3>
          <div className="flex flex-wrap gap-2">
            <select
              value={filterStudent}
              onChange={(e) => setFilterStudent(e.target.value)}
              className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-0)] px-2 py-1 text-[12px] text-[var(--text-primary)] outline-none focus:border-[var(--fill-accent)]"
            >
              <option value="all">All Students</option>
              {mentorships.map((ms) => {
                const student = Array.isArray(ms.users) ? ms.users[0] : ms.users;
                return (
                  <option key={ms.id} value={ms.student_id}>
                    {(student as { name: string }).name}
                  </option>
                );
              })}
            </select>
            <select
              value={filterRating}
              onChange={(e) => setFilterRating(e.target.value)}
              className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-0)] px-2 py-1 text-[12px] text-[var(--text-primary)] outline-none focus:border-[var(--fill-accent)]"
            >
              <option value="all">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>
        </div>

        {feedbacks.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="No feedback yet"
            description="Your submitted reviews will appear here."
          />
        ) : (
          <div className="flex flex-col gap-2">
            {feedbacks
              .filter((fb) => (filterStudent === "all" ? true : fb.student_id === filterStudent))
              .filter((fb) => (filterRating === "all" ? true : fb.rating === parseInt(filterRating)))
              .map((fb) => {
              const student = Array.isArray(fb.users) ? fb.users[0] : fb.users;
              return (
                <div
                  key={fb.id}
                  className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-1)] px-4 py-3"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[13px] font-medium text-[var(--text-primary)]">
                      {(student as { name: string })?.name ?? "Student"}
                    </span>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star
                          key={n}
                          size={13}
                          fill={n <= fb.rating ? "var(--text-warning)" : "none"}
                          stroke={n <= fb.rating ? "var(--text-warning)" : "var(--text-muted)"}
                        />
                      ))}
                    </div>
                  </div>
                  {fb.comment && (
                    <p className="text-[12px] text-[var(--text-secondary)] mb-1">{fb.comment}</p>
                  )}
                  <span className="text-[11px] text-[var(--text-muted)]">{formatDate(fb.created_at)}</span>
                </div>
              );
            })}
            
            {feedbacks.filter((fb) => (filterStudent === "all" ? true : fb.student_id === filterStudent)).filter((fb) => (filterRating === "all" ? true : fb.rating === parseInt(filterRating))).length === 0 && (
              <p className="text-[13px] text-[var(--text-muted)] text-center py-6">No past feedback matches these filters.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
