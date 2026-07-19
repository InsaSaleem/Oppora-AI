"use client";

import { useEffect, useState, useCallback } from "react";
import { Bookmark, MapPin, Clock, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { cn } from "@/lib/utils";
import type { OpportunityRow } from "@/types/database";

interface SavedItem {
  opportunity_id: string;
  saved_at: string;
  opportunities: OpportunityRow;
}

export default function SavedPage() {
  const supabase = createClient();
  const [saved, setSaved] = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const fetchSaved = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data, error } = await supabase
      .from("saved_opportunities")
      .select("opportunity_id, saved_at, opportunities(*)")
      .eq("student_id", user.id)
      .order("saved_at", { ascending: false });

    if (error) {
      console.error("Error fetching saved opportunities:", error);
    }

    setSaved((data as unknown as SavedItem[]) ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchSaved();
  }, [fetchSaved]);

  async function removeSaved(opportunityId: string) {
    setRemovingId(opportunityId);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("saved_opportunities")
        .delete()
        .eq("student_id", user.id)
        .eq("opportunity_id", opportunityId);
    }
    setSaved((prev) => prev.filter((s) => s.opportunity_id !== opportunityId));
    setRemovingId(null);
  }

  function daysUntil(deadline: string): number {
    return Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-[18px] font-semibold text-[var(--text-primary)] mb-1">Saved Opportunities</h2>
        <p className="text-[13px] text-[var(--text-muted)]">Opportunities you&apos;ve bookmarked for later.</p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--fill-accent)] border-t-transparent" />
        </div>
      )}

      {!loading && saved.length === 0 && (
        <EmptyState
          icon={Bookmark}
          title="No saved opportunities"
          description="Browse opportunities and save the ones you're interested in."
        />
      )}

      {!loading && saved.length > 0 && (
        <div className="flex flex-col gap-2">
          {saved.map((item) => {
            const opp = item.opportunities;
            if (!opp) return null; // Defensive check for dangling records
            const days = daysUntil(opp.deadline);

            return (
              <div
                key={item.opportunity_id}
                className="flex items-center justify-between gap-4 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-1)] p-4 transition-colors hover:border-[var(--fill-accent)]"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="truncate text-[14px] font-medium text-[var(--text-primary)]">{opp.title}</h3>
                    <span className="shrink-0 rounded-full bg-[var(--bg-accent)] px-2 py-0.5 text-[11px] font-medium capitalize text-[var(--text-accent)]">
                      {opp.type.replace("_", " ")}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3 text-[12px] text-[var(--text-muted)]">
                    {opp.company && <span>{opp.company}</span>}
                    {opp.location && (
                      <span className="flex items-center gap-1">
                        <MapPin size={11} />
                        {opp.is_remote ? "Remote" : opp.location}
                      </span>
                    )}
                    <span className={cn("flex items-center gap-1", days <= 3 && "text-[var(--text-danger)]")}>
                      <Clock size={11} />
                      {days > 0 ? `${days}d left` : "Expired"}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => removeSaved(item.opportunity_id)}
                  disabled={removingId === item.opportunity_id}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-danger)] hover:text-[var(--text-danger)] transition-colors disabled:opacity-50"
                  title="Remove from saved"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
