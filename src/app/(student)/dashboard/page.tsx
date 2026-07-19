import { ListChecks, Bookmark, FileText, Clock, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { RecommendationCard } from "@/components/dashboard/RecommendationCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { StatusBarChart, type StatusBarDatum } from "@/components/dashboard/StatusBarChart";

const APPLICATION_STATUS_LABELS: Record<string, string> = {
  applied: "Applied",
  pending: "Pending",
  interview: "Interview",
  accepted: "Accepted",
  rejected: "Rejected",
  archived: "Archived",
};

export default async function StudentDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: applicationsCount },
    { count: savedCount },
    { data: latestResumeAnalysis },
    { count: upcomingDeadlinesCount },
    { data: recommendations },
    { data: applicationStatuses },
  ] = await Promise.all([
    supabase
      .from("applications")
      .select("id", { count: "exact", head: true })
      .eq("student_id", user.id),

    supabase
      .from("saved_opportunities")
      .select("student_id", { count: "exact", head: true })
      .eq("student_id", user.id),

    supabase
      .from("ai_resume_analysis")
      .select("overall_score")
      .eq("student_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),

    supabase
      .from("applications")
      .select("id, opportunities!inner(deadline)", { count: "exact", head: true })
      .eq("student_id", user.id)
      .lte("opportunities.deadline", sevenDaysFromNow),

    supabase
      .from("ai_recommendations")
      .select("id, score, opportunities(id, title, type, deadline, location)")
      .eq("student_id", user.id)
      .eq("is_dismissed", false)
      .order("score", { ascending: false })
      .limit(5),

    supabase
      .from("applications")
      .select("status")
      .eq("student_id", user.id),
  ]);

  const resumeScore = latestResumeAnalysis?.overall_score;

  const statusCounts: Record<string, number> = {};
  (applicationStatuses ?? []).forEach((row) => {
    statusCounts[row.status] = (statusCounts[row.status] ?? 0) + 1;
  });
  const applicationChartData: StatusBarDatum[] = Object.entries(statusCounts).map(
    ([status, value]) => ({ label: APPLICATION_STATUS_LABELS[status] ?? status, value })
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={ListChecks}
          label="Applications sent"
          value={applicationsCount ?? 0}
          tone="accent"
        />
        <KpiCard
          icon={Bookmark}
          label="Saved opportunities"
          value={savedCount ?? 0}
          tone="pro"
        />
        <KpiCard
          icon={FileText}
          label="Resume match score"
          value={resumeScore != null ? `${Math.round(resumeScore)}%` : "—"}
          tone="success"
        />
        <KpiCard
          icon={Clock}
          label="Deadlines this week"
          value={upcomingDeadlinesCount ?? 0}
          tone="warning"
        />
      </div>

      <StatusBarChart
        title="Your applications by status"
        subtitle="Where everything you've applied to currently stands"
        data={applicationChartData}
        emptyLabel="Apply to an opportunity to see your pipeline here"
      />

      <div>
        <div className="mb-3 flex items-center gap-2">
          <Sparkles size={15} className="text-[var(--text-accent)]" />
          <h2 className="text-[13px] font-medium text-[var(--text-primary)]">
            Recommended for you
          </h2>
        </div>

        {recommendations && recommendations.length > 0 ? (
          <div className="flex flex-col gap-2">
            {recommendations.map((rec) => {
              const opp = Array.isArray(rec.opportunities) ? rec.opportunities[0] : rec.opportunities;
              if (!opp) return null;
              const deadline = new Date(opp.deadline);
              const daysLeft = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
              return (
                <RecommendationCard
                  key={rec.id}
                  opportunityId={opp.id}
                  title={opp.title}
                  meta={`Deadline in ${daysLeft} day${daysLeft === 1 ? "" : "s"} · ${opp.location ?? "Remote"}`}
                  score={rec.score}
                />
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={Sparkles}
            title="No recommendations yet"
            description="Complete your profile and upload a resume so the AI engine can start matching you with opportunities."
          />
        )}
      </div>
    </div>
  );
}
