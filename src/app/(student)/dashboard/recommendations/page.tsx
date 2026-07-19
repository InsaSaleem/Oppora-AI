"use client";

import Link from "next/link";

import { useEffect, useState, useCallback } from "react";
import { Sparkles, X, MapPin, Clock, ExternalLink, RefreshCw, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { cn } from "@/lib/utils";
import type { OpportunityRow } from "@/types/database";

interface RecommendationItem {
  id: string;
  score: number;
  reason: string | null;
  is_dismissed: boolean;
  opportunities: OpportunityRow;
}

export default function RecommendationsPage() {
  const supabase = createClient();
  const [recs, setRecs] = useState<RecommendationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dismissingId, setDismissingId] = useState<string | null>(null);

  const fetchRecs = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data } = await supabase
      .from("ai_recommendations")
      .select("id, score, reason, is_dismissed, opportunities(*)")
      .eq("student_id", user.id)
      .eq("is_dismissed", false)
      .order("score", { ascending: false });

    setRecs((data as unknown as RecommendationItem[]) ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchRecs();
  }, [fetchRecs]);

  async function generateRecommendations() {
    setGenerating(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // 1. Get User Profile, Skills, and Academic Info
      const [{ data: userRow }, { data: profileData }] = await Promise.all([
        supabase.from("users").select("bio").eq("id", user.id).single(),
        supabase.from("profiles").select("skills, university, degree, semester, cgpa, experience").eq("user_id", user.id).single()
      ]);

      const rawSkills = profileData?.skills || [];
      const cleanedSkills = Array.isArray(rawSkills) 
        ? rawSkills.flatMap(s => s.split(',')).map(s => s.trim()).filter(Boolean)
        : typeof rawSkills === 'string' ? (rawSkills as string).split(',').map(s => s.trim()).filter(Boolean) : [];

      const profileContext = `
        Bio: ${userRow?.bio || "None provided"}
        Education: ${profileData?.degree || ""} at ${profileData?.university || ""} (Semester ${profileData?.semester || "-"})
        CGPA: ${profileData?.cgpa || "-"}
        Experience: ${profileData?.experience || "None provided"}
      `.trim();

      // 2. Get active opportunities
      const { data: opps } = await supabase
        .from("opportunities")
        .select("*")
        .eq("status", "published");

      if (!opps || opps.length === 0) {
        throw new Error("No active opportunities found to match against.");
      }

      // 3. Call AI endpoint (forces fresh data from client each time)
      const response = await fetch("/api/recommendations", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Cache-Control": "no-cache"
        },
        body: JSON.stringify({ skills: cleanedSkills, profileContext, opportunities: opps }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to generate recommendations");
      }

      const aiResults = await response.json();

      // 4. Upsert results into database
      const upsertPayload = aiResults.map((res: any) => ({
        student_id: user.id,
        opportunity_id: res.opportunity_id,
        score: res.score,
        reason: res.reason,
        is_dismissed: false,
      }));

      const { error: upsertError } = await supabase
        .from("ai_recommendations")
        .upsert(upsertPayload, { onConflict: "student_id, opportunity_id" });

      if (upsertError) throw upsertError;

      // Refresh UI
      await fetchRecs();

    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred");
    } finally {
      setGenerating(false);
    }
  }

  async function dismiss(recId: string) {
    setDismissingId(recId);
    await supabase
      .from("ai_recommendations")
      .update({ is_dismissed: true })
      .eq("id", recId);
    setRecs((prev) => prev.filter((r) => r.id !== recId));
    setDismissingId(null);
  }

  function daysUntil(deadline: string): number {
    return Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  }

  function getScoreColor(score: number): string {
    if (score >= 80) return "var(--text-success)";
    if (score >= 60) return "var(--text-accent)";
    if (score >= 40) return "var(--text-warning)";
    return "var(--text-danger)";
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={18} className="text-[var(--text-accent)]" />
            <h2 className="text-[18px] font-semibold text-[var(--text-primary)]">AI Recommendations</h2>
          </div>
          <p className="text-[13px] text-[var(--text-muted)]">
            Personalized matches based on your profile, skills, and resume.
          </p>
        </div>
        
        <button
          onClick={generateRecommendations}
          disabled={generating}
          className="flex items-center gap-2 shrink-0 rounded-[var(--radius-sm)] bg-[var(--fill-accent)] px-4 py-2 text-[13px] font-medium text-[var(--on-accent)] transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          <RefreshCw size={14} className={generating ? "animate-spin" : ""} />
          {generating ? "Analyzing matches..." : "Generate New Matches"}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--bg-danger)] px-4 py-3 text-[13px] text-[var(--text-danger)] font-medium">
          <AlertTriangle size={15} />
          {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--fill-accent)] border-t-transparent" />
        </div>
      )}

      {!loading && !generating && recs.length === 0 && (
        <EmptyState
          icon={Sparkles}
          title="No recommendations yet"
          description="Click 'Generate New Matches' so our AI can analyze available opportunities against your profile."
        />
      )}

      {!loading && recs.length > 0 && (
        <div className="flex flex-col gap-4">
          {recs.map((rec) => {
            const opp = rec.opportunities;
            if (!opp) return null; // Defensive check
            const days = daysUntil(opp.deadline);
            const scoreRounded = Math.round(rec.score);

            return (
              <div
                key={rec.id}
                className="group rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-1)] p-5 transition-colors hover:border-[var(--fill-accent)] relative overflow-hidden"
              >
                {/* Progress bar background for score */}
                <div 
                  className="absolute bottom-0 left-0 h-1 transition-all duration-1000 ease-out opacity-80"
                  style={{ 
                    width: `${scoreRounded}%`, 
                    backgroundColor: getScoreColor(scoreRounded) 
                  }} 
                />

                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <h3 className="truncate text-[15px] font-medium text-[var(--text-primary)]">{opp.title}</h3>
                      <div className="flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface-0)] px-2.5 py-0.5 shadow-sm">
                        <span className="text-[14px] font-bold" style={{ color: getScoreColor(scoreRounded) }}>
                          {scoreRounded}%
                        </span>
                        <span className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wide">Match</span>
                      </div>
                    </div>

                    {/* Meta */}
                    <div className="flex flex-wrap gap-4 text-[12px] text-[var(--text-muted)] mb-3">
                      {opp.company && <span className="font-medium text-[var(--text-secondary)]">{opp.company}</span>}
                      <span className="capitalize">{opp.type.replace("_", " ")}</span>
                      {opp.location && (
                        <span className="flex items-center gap-1">
                          <MapPin size={12} />
                          {opp.is_remote ? "Remote" : opp.location}
                        </span>
                      )}
                      <span className={cn("flex items-center gap-1", days <= 3 && "text-[var(--text-danger)]")}>
                        <Clock size={12} />
                        {days > 0 ? `${days}d left` : "Expired"}
                      </span>
                    </div>

                    {/* AI reason */}
                    {rec.reason && (
                      <div className="rounded-lg bg-[var(--bg-accent)] border border-[var(--fill-accent)]/20 px-3 py-2 text-[12.5px] leading-relaxed text-[var(--text-accent)] mb-3 shadow-sm">
                        <span className="font-semibold mr-1">AI Insight:</span>
                        {rec.reason}
                      </div>
                    )}

                    {/* Skills */}
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {opp.required_skills?.slice(0, 5).map((skill) => (
                        <span key={skill} className="rounded-md bg-[var(--fill-control)] px-2.5 py-1 text-[11px] text-[var(--text-secondary)]">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-row md:flex-col items-center md:items-end gap-2 shrink-0 border-t border-[var(--border)] md:border-t-0 pt-3 md:pt-0 mt-3 md:mt-0">
                    <Link
                      href={`/dashboard/opportunities/${opp.id}`}
                      className="flex-1 md:flex-none flex items-center justify-center gap-1.5 rounded-[var(--radius-sm)] bg-[var(--fill-accent)] px-4 py-2 text-[13px] font-medium text-[var(--on-accent)] transition-opacity hover:opacity-90 shadow-sm"
                    >
                      <ExternalLink size={14} />
                      View &amp; apply
                    </Link>
                    <button
                      onClick={() => dismiss(rec.id)}
                      disabled={dismissingId === rec.id}
                      className="flex-1 md:flex-none flex items-center justify-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-0)] px-4 py-2 text-[12px] font-medium text-[var(--text-secondary)] hover:bg-[var(--fill-control)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-50"
                    >
                      <X size={14} />
                      {dismissingId === rec.id ? "Dismissing..." : "Dismiss"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
