import { Users, MessageSquare, ClipboardList, Award, ShieldAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getMentorRowId } from "@/lib/mentor";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { StatusBarChart, type StatusBarDatum } from "@/components/dashboard/StatusBarChart";

const MENTORSHIP_STATUS_LABELS: Record<string, string> = {
  active: "Active",
  completed: "Completed",
  paused: "Paused",
};

export default async function MentorDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // mentor_students / mentor_feedback both key off mentors.id, not the auth
  // user id — resolve it once up front.
  const mentorRowId = await getMentorRowId(supabase, user.id);

  if (!mentorRowId) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="Mentor profile not set up"
        description="Your account doesn't have a mentors row yet, so there's nothing to show here. Contact an admin to get your mentor profile approved."
      />
    );
  }

  const [
    { count: mentorshipsCount },
    { count: feedbackCount },
    { data: mentorshipData },
    { data: recentStudents },
    { data: allStatuses },
  ] = await Promise.all([
    supabase
      .from("mentor_students")
      .select("id", { count: "exact", head: true })
      .eq("mentor_id", mentorRowId)
      .eq("status", "active"),

    supabase
      .from("mentor_feedback")
      .select("id", { count: "exact", head: true })
      .eq("mentor_id", mentorRowId),

    supabase
      .from("mentor_students")
      .select("student_id")
      .eq("mentor_id", mentorRowId)
      .eq("status", "active"),

    supabase
      .from("mentor_students")
      .select("id, status, started_at, users!mentor_students_student_id_fkey(name, email)")
      .eq("mentor_id", mentorRowId)
      .eq("status", "active")
      .order("started_at", { ascending: false })
      .limit(5),

    supabase
      .from("mentor_students")
      .select("status")
      .eq("mentor_id", mentorRowId),
  ]);

  const studentIds = (mentorshipData ?? []).map((m) => m.student_id);

  const { count: assignedAppsCount } = studentIds.length > 0
    ? await supabase
        .from("applications")
        .select("id", { count: "exact", head: true })
        .in("student_id", studentIds)
        .eq("status", "pending")
    : { count: 0 };

  const statusCounts: Record<string, number> = {};
  (allStatuses ?? []).forEach((row) => {
    statusCounts[row.status] = (statusCounts[row.status] ?? 0) + 1;
  });
  const mentorshipChartData: StatusBarDatum[] = Object.entries(statusCounts).map(
    ([status, value]) => ({ label: MENTORSHIP_STATUS_LABELS[status] ?? status, value })
  );

  return (
    <div className="flex flex-col gap-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          icon={Users}
          label="Active mentorships"
          value={mentorshipsCount ?? 0}
          tone="accent"
        />
        <KpiCard
          icon={MessageSquare}
          label="Feedback given"
          value={feedbackCount ?? 0}
          tone="success"
        />
        <KpiCard
          icon={ClipboardList}
          label="Pending applications"
          value={assignedAppsCount ?? 0}
          tone="warning"
        />
      </div>

      <StatusBarChart
        title="Your mentorships by status"
        subtitle="Across every student you've ever been matched with"
        data={mentorshipChartData}
        emptyLabel="Accept a mentorship request to see your pipeline here"
      />

      {/* Recent students */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <Award size={15} className="text-[var(--text-accent)]" />
          <h2 className="text-[13px] font-medium text-[var(--text-primary)]">Your Active Students</h2>
        </div>

        {recentStudents && recentStudents.length > 0 ? (
          <div className="flex flex-col gap-2">
            {recentStudents.map((ms) => {
              const student = Array.isArray(ms.users) ? ms.users[0] : ms.users;
              return (
                <div
                  key={ms.id}
                  className="flex items-center justify-between rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-1)] px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg-accent)] text-[12px] font-semibold text-[var(--text-accent)]">
                      {(student as { name?: string })?.name?.charAt(0)?.toUpperCase() ?? "?"}
                    </div>
                    <div>
                      <div className="text-[13px] font-medium text-[var(--text-primary)]">
                        {(student as { name?: string })?.name ?? "Student"}
                      </div>
                      <div className="text-[12px] text-[var(--text-muted)]">
                        {(student as { email?: string })?.email ?? ""}
                      </div>
                    </div>
                  </div>
                  <span className="rounded-full bg-[var(--bg-success)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--text-success)]">
                    Active
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={Users}
            title="No active students"
            description="Students will appear here once they are assigned to you."
          />
        )}
      </div>
    </div>
  );
}
