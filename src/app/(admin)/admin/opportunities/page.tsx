"use client";

import { useEffect, useState, useCallback } from "react";
import { Briefcase, Search, Plus, Trash2, Eye, EyeOff, CheckCircle2, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { cn } from "@/lib/utils";
import type { OpportunityRow, OpportunityType, OpportunityStatus } from "@/types/database";

const STATUS_COLORS: Record<OpportunityStatus, { bg: string; text: string }> = {
  published: { bg: "var(--bg-success)", text: "var(--text-success)" },
  draft: { bg: "var(--bg-warning)", text: "var(--text-warning)" },
  closed: { bg: "var(--bg-danger)", text: "var(--text-danger)" },
  archived: { bg: "var(--fill-control)", text: "var(--text-muted)" },
};

const TYPE_OPTIONS: OpportunityType[] = [
  "internship", "scholarship", "hackathon", "job", "competition",
  "research", "fellowship", "conference", "bootcamp", "exchange_program",
];

export default function AdminOpportunitiesPage() {
  const supabase = createClient();
  const [opportunities, setOpportunities] = useState<OpportunityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formCompany, setFormCompany] = useState("");
  const [formType, setFormType] = useState<OpportunityType>("internship");
  const [formLocation, setFormLocation] = useState("");
  const [formRemote, setFormRemote] = useState(false);
  const [formDeadline, setFormDeadline] = useState("");
  const [formSkills, setFormSkills] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const fetchOpportunities = useCallback(async () => {
    setLoading(true);

    let q = supabase
      .from("opportunities")
      .select("*")
      .order("created_at", { ascending: false });

    if (query.trim()) {
      q = q.ilike("title", `%${query.trim()}%`);
    }

    const { data } = await q.limit(100);
    setOpportunities((data as OpportunityRow[]) ?? []);
    setLoading(false);
  }, [supabase, query]);

  useEffect(() => {
    fetchOpportunities();
  }, [fetchOpportunities]);

  async function toggleStatus(id: string, current: OpportunityStatus) {
    const next: OpportunityStatus = current === "published" ? "closed" : "published";
    await supabase.from("opportunities").update({ status: next }).eq("id", id);
    setOpportunities((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: next } : o))
    );
  }

  async function deleteOpportunity(id: string) {
    if (!confirm("Delete this opportunity?")) return;
    await supabase.from("opportunities").delete().eq("id", id);
    setOpportunities((prev) => prev.filter((o) => o.id !== id));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setFeedback({ type: "error", message: "You must be logged in to create opportunities." });
      setSubmitting(false);
      return;
    }

    const skillsArray = formSkills.split(",").map((s) => s.trim()).filter(Boolean);

    const { error } = await supabase.from("opportunities").insert({
      title: formTitle.trim(),
      description: formDesc.trim(),
      company: formCompany.trim() || null,
      type: formType,
      location: formLocation.trim() || null,
      is_remote: formRemote,
      deadline: formDeadline,
      required_skills: skillsArray.length > 0 ? skillsArray : null,
      status: "published" as OpportunityStatus,
      created_by: user.id,
    });

    setSubmitting(false);

    if (error) {
      setFeedback({ type: "error", message: error.message });
    } else {
      setFeedback({ type: "success", message: "Opportunity created!" });
      setFormTitle(""); setFormDesc(""); setFormCompany(""); setFormLocation("");
      setFormSkills(""); setFormDeadline(""); setFormRemote(false);
      setShowForm(false);
      fetchOpportunities();
    }
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  const inputClass =
    "w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-0)] px-3 py-2 text-[13px] text-[var(--text-primary)] outline-none focus:border-[var(--fill-accent)] placeholder:text-[var(--text-muted)]";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-[18px] font-semibold text-[var(--text-primary)] mb-1">Manage Opportunities</h2>
          <p className="text-[13px] text-[var(--text-muted)]">Create, edit, and manage all opportunities.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 rounded-[var(--radius-sm)] bg-[var(--fill-accent)] px-4 py-2 text-[13px] font-medium text-[var(--on-accent)] transition-opacity hover:opacity-90"
        >
          <Plus size={15} />
          New
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-1)] p-5">
          <h3 className="text-[14px] font-medium text-[var(--text-primary)] mb-4">Create Opportunity</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-[12px] font-medium text-[var(--text-secondary)]">Title*</label>
              <input type="text" required value={formTitle} onChange={(e) => setFormTitle(e.target.value)} className={inputClass} placeholder="Software Engineering Intern" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-[12px] font-medium text-[var(--text-secondary)]">Description*</label>
              <textarea required value={formDesc} onChange={(e) => setFormDesc(e.target.value)} rows={3} className={inputClass + " resize-none"} placeholder="Describe this opportunity..." />
            </div>
            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-[var(--text-secondary)]">Company</label>
              <input type="text" value={formCompany} onChange={(e) => setFormCompany(e.target.value)} className={inputClass} placeholder="Google" />
            </div>
            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-[var(--text-secondary)]">Type*</label>
              <select value={formType} onChange={(e) => setFormType(e.target.value as OpportunityType)} className={inputClass}>
                {TYPE_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t.replace("_", " ")}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-[var(--text-secondary)]">Location</label>
              <input type="text" value={formLocation} onChange={(e) => setFormLocation(e.target.value)} className={inputClass} placeholder="New York, US" />
            </div>
            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-[var(--text-secondary)]">Deadline*</label>
              <input type="date" required value={formDeadline} onChange={(e) => setFormDeadline(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-[var(--text-secondary)]">Skills (comma-separated)</label>
              <input type="text" value={formSkills} onChange={(e) => setFormSkills(e.target.value)} className={inputClass} placeholder="React, Python, SQL" />
            </div>
            <div className="flex items-center gap-2 self-end">
              <input type="checkbox" id="remote" checked={formRemote} onChange={(e) => setFormRemote(e.target.checked)} className="accent-[var(--fill-accent)]" />
              <label htmlFor="remote" className="text-[12px] text-[var(--text-secondary)]">Remote position</label>
            </div>
          </div>

          {feedback && (
            <div className={`mt-4 flex items-center gap-2 rounded-[var(--radius-sm)] px-4 py-2.5 text-[13px] font-medium ${
              feedback.type === "success"
                ? "bg-[var(--bg-success)] text-[var(--text-success)]"
                : "bg-[var(--bg-danger)] text-[var(--text-danger)]"
            }`}>
              {feedback.type === "success" ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
              {feedback.message}
            </div>
          )}

          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="rounded-[var(--radius-sm)] border border-[var(--border)] px-4 py-2 text-[13px] text-[var(--text-secondary)] hover:bg-[var(--fill-control)] transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="rounded-[var(--radius-sm)] bg-[var(--fill-accent)] px-4 py-2 text-[13px] font-medium text-[var(--on-accent)] transition-opacity hover:opacity-90 disabled:opacity-60">
              {submitting ? "Creating..." : "Create opportunity"}
            </button>
          </div>
        </form>
      )}

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        <input
          type="text"
          placeholder="Search opportunities..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-0)] py-2 pl-9 pr-3 text-[13px] text-[var(--text-primary)] outline-none focus:border-[var(--fill-accent)] placeholder:text-[var(--text-muted)]"
        />
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--fill-accent)] border-t-transparent" />
        </div>
      )}

      {!loading && opportunities.length === 0 && (
        <EmptyState icon={Briefcase} title="No opportunities" description="Create your first opportunity above." />
      )}

      {!loading && opportunities.length > 0 && (
        <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-1)] overflow-hidden">
          <div className="hidden sm:grid sm:grid-cols-[1fr_100px_100px_100px_80px] gap-4 border-b border-[var(--border)] px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
            <span>Opportunity</span>
            <span>Type</span>
            <span>Deadline</span>
            <span>Status</span>
            <span>Actions</span>
          </div>

          {opportunities.map((opp, idx) => {
            const statusColor = STATUS_COLORS[opp.status];
            return (
              <div
                key={opp.id}
                className={cn(
                  "flex flex-col gap-2 px-4 py-3 sm:grid sm:grid-cols-[1fr_100px_100px_100px_80px] sm:items-center sm:gap-4",
                  idx < opportunities.length - 1 && "border-b border-[var(--border)]"
                )}
              >
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-medium text-[var(--text-primary)]">{opp.title}</div>
                  <div className="text-[11px] text-[var(--text-muted)]">{opp.company ?? "—"}</div>
                </div>
                <div className="text-[12px] capitalize text-[var(--text-secondary)]">{opp.type.replace("_", " ")}</div>
                <div className="text-[12px] text-[var(--text-muted)]">{formatDate(opp.deadline)}</div>
                <div>
                  <span
                    className="rounded-full px-2 py-0.5 text-[11px] font-medium capitalize"
                    style={{ background: statusColor.bg, color: statusColor.text }}
                  >
                    {opp.status}
                  </span>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => toggleStatus(opp.id, opp.status)}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-muted)] hover:bg-[var(--fill-control)] hover:text-[var(--text-primary)] transition-colors"
                    title={opp.status === "published" ? "Close" : "Publish"}
                  >
                    {opp.status === "published" ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button
                    onClick={() => deleteOpportunity(opp.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-danger)] hover:text-[var(--text-danger)] transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={14} />
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
