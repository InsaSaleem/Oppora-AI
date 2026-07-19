"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, Bookmark, ExternalLink, MapPin, Clock, Filter } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { cn } from "@/lib/utils";
import type { OpportunityRow, OpportunityType } from "@/types/database";

const TYPE_OPTIONS: { value: OpportunityType | "all"; label: string }[] = [
  { value: "all", label: "All types" },
  { value: "internship", label: "Internships" },
  { value: "scholarship", label: "Scholarships" },
  { value: "hackathon", label: "Hackathons" },
  { value: "job", label: "Jobs" },
  { value: "competition", label: "Competitions" },
  { value: "research", label: "Research" },
  { value: "fellowship", label: "Fellowships" },
  { value: "conference", label: "Conferences" },
  { value: "bootcamp", label: "Bootcamps" },
  { value: "exchange_program", label: "Exchange Programs" },
];

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

export default function OpportunitiesPage() {
  const supabase = createClient();
  const [opportunities, setOpportunities] = useState<OpportunityRow[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<OpportunityType | "all">("all");
  const [savingId, setSavingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    let oppQuery = supabase
      .from("opportunities")
      .select("*")
      .eq("status", "published")
      .order("created_at", { ascending: false });

    if (typeFilter !== "all") {
      oppQuery = oppQuery.eq("type", typeFilter);
    }
    if (query.trim()) {
      oppQuery = oppQuery.ilike("title", `%${query.trim()}%`);
    }

    const { data: opps } = await oppQuery;
    setOpportunities(opps ?? []);

    if (user) {
      const { data: saved } = await supabase
        .from("saved_opportunities")
        .select("opportunity_id")
        .eq("student_id", user.id);
      setSavedIds(new Set((saved ?? []).map((s: { opportunity_id: string }) => s.opportunity_id)));
    }

    setLoading(false);
  }, [supabase, typeFilter, query]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function toggleSave(opportunityId: string) {
    setSavingId(opportunityId);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (savedIds.has(opportunityId)) {
      const { error } = await supabase
        .from("saved_opportunities")
        .delete()
        .eq("student_id", user.id)
        .eq("opportunity_id", opportunityId);
      
      if (error) {
        console.error("Error deleting saved opportunity:", error);
      } else {
        setSavedIds((prev) => {
          const next = new Set(prev);
          next.delete(opportunityId);
          return next;
        });
      }
    } else {
      const { error } = await supabase
        .from("saved_opportunities")
        .insert({ student_id: user.id, opportunity_id: opportunityId });
      
      if (error) {
        console.error("Error saving opportunity:", error);
      } else {
        setSavedIds((prev) => new Set(prev).add(opportunityId));
      }
    }
    setSavingId(null);
  }

  async function applyToOpportunity(opportunityId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("applications").insert({
      student_id: user.id,
      opportunity_id: opportunityId,
      status: "applied",
    });

    alert("Application submitted!");
  }

  function daysUntil(deadline: string): number {
    return Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-[18px] font-semibold text-[var(--text-primary)] mb-1">Browse Opportunities</h2>
        <p className="text-[13px] text-[var(--text-muted)]">Discover internships, scholarships, hackathons, and more.</p>
      </div>

      {/* Search & filter bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search opportunities..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-0)] py-2 pl-9 pr-3 text-[13px] text-[var(--text-primary)] outline-none focus:border-[var(--fill-accent)] placeholder:text-[var(--text-muted)]"
          />
        </div>
        <div className="relative">
          <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as OpportunityType | "all")}
            className="appearance-none rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-0)] py-2 pl-8 pr-8 text-[13px] text-[var(--text-primary)] outline-none focus:border-[var(--fill-accent)]"
          >
            {TYPE_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--fill-accent)] border-t-transparent" />
        </div>
      )}

      {/* Empty state */}
      {!loading && opportunities.length === 0 && (
        <EmptyState
          icon={Search}
          title="No opportunities found"
          description="Try adjusting your search or filters to find what you're looking for."
        />
      )}

      {/* Card grid */}
      {!loading && opportunities.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {opportunities.map((opp) => {
            const days = daysUntil(opp.deadline);
            const typeColor = TYPE_COLORS[opp.type] ?? TYPE_COLORS.internship;
            const isSaved = savedIds.has(opp.id);

            return (
              <div
                key={opp.id}
                className="group flex flex-col rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-1)] p-4 transition-colors hover:border-[var(--fill-accent)]"
              >
                {/* Header */}
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-[14px] font-medium text-[var(--text-primary)]">
                      {opp.title}
                    </h3>
                    {opp.company && (
                      <p className="mt-0.5 text-[12px] text-[var(--text-secondary)]">{opp.company}</p>
                    )}
                  </div>
                  <span
                    className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium capitalize"
                    style={{ background: typeColor.bg, color: typeColor.text }}
                  >
                    {opp.type.replace("_", " ")}
                  </span>
                </div>

                {/* Description */}
                <p className="mb-3 line-clamp-2 text-[12px] leading-relaxed text-[var(--text-muted)]">
                  {opp.description}
                </p>

                {/* Meta row */}
                <div className="mb-4 flex flex-wrap gap-3 text-[11px] text-[var(--text-muted)]">
                  {opp.location && (
                    <span className="flex items-center gap-1">
                      <MapPin size={12} />
                      {opp.is_remote ? "Remote" : opp.location}
                    </span>
                  )}
                  <span className={cn("flex items-center gap-1", days <= 3 && "text-[var(--text-danger)]")}>
                    <Clock size={12} />
                    {days > 0 ? `${days} day${days === 1 ? "" : "s"} left` : "Expired"}
                  </span>
                </div>

                {/* Skills */}
                {opp.required_skills && opp.required_skills.length > 0 && (
                  <div className="mb-4 flex flex-wrap gap-1.5">
                    {opp.required_skills.slice(0, 4).map((skill) => (
                      <span
                        key={skill}
                        className="rounded-md bg-[var(--fill-control)] px-2 py-0.5 text-[11px] text-[var(--text-secondary)]"
                      >
                        {skill}
                      </span>
                    ))}
                    {opp.required_skills.length > 4 && (
                      <span className="text-[11px] text-[var(--text-muted)]">
                        +{opp.required_skills.length - 4} more
                      </span>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="mt-auto flex gap-2">
                  <button
                    onClick={() => toggleSave(opp.id)}
                    disabled={savingId === opp.id}
                    className={cn(
                      "flex items-center gap-1.5 rounded-[var(--radius-sm)] border px-3 py-1.5 text-[12px] font-medium transition-colors disabled:opacity-50",
                      isSaved
                        ? "border-[var(--fill-accent)] bg-[var(--bg-accent)] text-[var(--text-accent)]"
                        : "border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--fill-control)]"
                    )}
                  >
                    <Bookmark size={13} fill={isSaved ? "currentColor" : "none"} />
                    {isSaved ? "Saved" : "Save"}
                  </button>
                  <button
                    onClick={() => applyToOpportunity(opp.id)}
                    className="flex items-center gap-1.5 rounded-[var(--radius-sm)] bg-[var(--fill-accent)] px-3 py-1.5 text-[12px] font-medium text-[var(--on-accent)] transition-opacity hover:opacity-90"
                  >
                    <ExternalLink size={13} />
                    Apply
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
