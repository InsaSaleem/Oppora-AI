"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, MapPin, Clock, Building2, Calendar, CheckCircle2, AlertTriangle, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OpportunityRow } from "@/types/database";
import Link from "next/link";

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  internship: { bg: "var(--bg-accent)", text: "var(--text-accent)" },
  scholarship: { bg: "var(--bg-success)", text: "var(--text-success)" },
  hackathon: { bg: "var(--bg-pro)", text: "var(--text-pro)" },
  job: { bg: "var(--bg-warning)", text: "var(--text-warning)" },
  competition: { bg: "var(--bg-danger)", text: "var(--text-danger)" },
  research: { bg: "var(--bg-accent)", text: "var(--text-accent)" },
  fellowship: { bg: "var(--bg-pro)", text: "var(--text-pro)" },
  conference: { bg: "var(--bg-success)", text: "var(--text-success)" },
  bootcamp: { bg: "var(--bg-warning)", text: "var(--text-warning)" },
  exchange_program: { bg: "var(--bg-accent)", text: "var(--text-accent)" },
};

export default function OpportunityDetailsPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const supabase = createClient();

  const [opp, setOpp] = useState<OpportunityRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasApplied, setHasApplied] = useState(false);
  const [applying, setApplying] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const fetchDetails = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data } = await supabase
      .from("opportunities")
      .select("*")
      .eq("id", id)
      .single();
    
    if (data) {
      setOpp(data);
      if (user) {
        const { data: appData } = await supabase
          .from("applications")
          .select("id")
          .eq("student_id", user.id)
          .eq("opportunity_id", data.id)
          .single();
        if (appData) setHasApplied(true);
      }
    }
    setLoading(false);
  }, [id, supabase]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  async function handleApply() {
    setApplying(true);
    setFeedback(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setFeedback({ type: "error", message: "You must be logged in to apply." });
      setApplying(false);
      return;
    }

    const { error } = await supabase.from("applications").insert({
      student_id: user.id,
      opportunity_id: opp!.id,
      status: "applied",
    });

    if (error) {
      setFeedback({ type: "error", message: "Failed to submit application. Please try again." });
    } else {
      setHasApplied(true);
      setFeedback({ type: "success", message: "Application submitted successfully!" });
    }
    setApplying(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--fill-accent)] border-t-transparent" />
      </div>
    );
  }

  if (!opp) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertTriangle className="mb-4 h-10 w-10 text-[var(--text-danger)]" />
        <h2 className="text-lg font-medium text-[var(--text-primary)]">Opportunity Not Found</h2>
        <p className="mt-1 text-[13px] text-[var(--text-muted)]">This opportunity may have been removed or closed.</p>
        <Link href="/dashboard/opportunities" className="mt-4 text-[13px] text-[var(--text-accent)] hover:underline">
          Back to Browse
        </Link>
      </div>
    );
  }

  const typeColor = TYPE_COLORS[opp.type] ?? TYPE_COLORS.internship;
  const daysUntilDeadline = Math.ceil((new Date(opp.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <div className="flex flex-col gap-6 pb-10">
      {/* Header */}
      <div>
        <button
          onClick={() => router.back()}
          className="mb-4 flex items-center gap-1.5 text-[12px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        >
          <ArrowLeft size={14} />
          Back
        </button>
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 className="text-[24px] font-semibold text-[var(--text-primary)]">{opp.title}</h1>
            <div className="mt-2 flex items-center gap-3 text-[13px] text-[var(--text-secondary)]">
              {opp.company && (
                <span className="flex items-center gap-1.5">
                  <Building2 size={14} className="text-[var(--text-muted)]" />
                  {opp.company}
                </span>
              )}
              <span
                className="shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize"
                style={{ background: typeColor.bg, color: typeColor.text }}
              >
                {opp.type.replace("_", " ")}
              </span>
            </div>
          </div>
          
          <div className="flex shrink-0 flex-col gap-2">
            <button
              onClick={handleApply}
              disabled={applying || hasApplied || daysUntilDeadline < 0}
              className={cn(
                "flex items-center justify-center gap-2 rounded-[var(--radius)] px-6 py-2.5 text-[14px] font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed",
                hasApplied
                  ? "bg-[var(--bg-success)] text-[var(--text-success)]"
                  : "bg-[var(--fill-accent)] text-[var(--on-accent)] hover:opacity-90"
              )}
            >
              {hasApplied ? (
                <>
                  <CheckCircle2 size={16} />
                  Applied
                </>
              ) : daysUntilDeadline < 0 ? (
                "Expired"
              ) : (
                <>
                  <Send size={16} />
                  {applying ? "Submitting..." : "Apply Now"}
                </>
              )}
            </button>
            {feedback && (
              <p className={cn("text-center text-[12px]", feedback.type === "error" ? "text-[var(--text-danger)]" : "text-[var(--text-success)]")}>
                {feedback.message}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="md:col-span-2 flex flex-col gap-6">
          <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-0)] p-6">
            <h2 className="mb-4 text-[16px] font-semibold text-[var(--text-primary)]">Job Description</h2>
            <div className="whitespace-pre-wrap text-[14px] leading-relaxed text-[var(--text-secondary)]">
              {opp.description}
            </div>
          </div>

          {(opp.requirements && opp.requirements.length > 0) && (
            <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-0)] p-6">
              <h2 className="mb-4 text-[16px] font-semibold text-[var(--text-primary)]">Requirements</h2>
              <ul className="list-inside list-disc space-y-2 text-[14px] text-[var(--text-secondary)]">
                {opp.requirements.map((req, i) => (
                  <li key={i}>{req}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-6">
          <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-0)] p-5">
            <h3 className="mb-4 text-[14px] font-medium text-[var(--text-primary)]">Opportunity Details</h3>
            <div className="flex flex-col gap-4 text-[13px]">
              <div className="flex items-start gap-3 text-[var(--text-secondary)]">
                <MapPin size={16} className="mt-0.5 text-[var(--text-muted)]" />
                <div>
                  <p className="font-medium text-[var(--text-primary)]">Location</p>
                  <p>{opp.is_remote ? "Remote" : opp.location || "Not specified"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-[var(--text-secondary)]">
                <Calendar size={16} className="mt-0.5 text-[var(--text-muted)]" />
                <div>
                  <p className="font-medium text-[var(--text-primary)]">Deadline</p>
                  <p>{new Date(opp.deadline).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-[var(--text-secondary)]">
                <Clock size={16} className="mt-0.5 text-[var(--text-muted)]" />
                <div>
                  <p className="font-medium text-[var(--text-primary)]">Time Remaining</p>
                  <p className={daysUntilDeadline <= 3 ? "text-[var(--text-danger)]" : ""}>
                    {daysUntilDeadline > 0 ? `${daysUntilDeadline} days` : "Expired"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {(opp.required_skills && opp.required_skills.length > 0) && (
            <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-0)] p-5">
              <h3 className="mb-3 text-[14px] font-medium text-[var(--text-primary)]">Required Skills</h3>
              <div className="flex flex-wrap gap-2">
                {opp.required_skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-md bg-[var(--fill-control)] px-2.5 py-1 text-[12px] text-[var(--text-secondary)]"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
