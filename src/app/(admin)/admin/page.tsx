import { Users, Briefcase, ClipboardList, ShieldCheck, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { StatusBarChart, type StatusBarDatum } from "@/components/dashboard/StatusBarChart";

const OPPORTUNITY_STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  published: "Published",
  closed: "Closed",
  archived: "Archived",
};

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const [
    { count: totalUsers },
    { count: totalStudents },
    { count: totalMentors },
    { count: pendingMentors },
    { count: activeOpportunities },
    { count: totalApplications },
    { data: opportunityStatuses },
  ] = await Promise.all([
    supabase
      .from("users")
      .select("id", { count: "exact", head: true }),
    supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("role", "student"),
    supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("role", "mentor"),
    supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("role", "mentor")
      .eq("is_active", false),
    supabase
      .from("opportunities")
      .select("id", { count: "exact", head: true })
      .eq("status", "published"),
    supabase
      .from("applications")
      .select("id", { count: "exact", head: true }),
    supabase
      .from("opportunities")
      .select("status"),
  ]);

  const oppStatusCounts: Record<string, number> = {};
  (opportunityStatuses ?? []).forEach((row) => {
    oppStatusCounts[row.status] = (oppStatusCounts[row.status] ?? 0) + 1;
  });
  const opportunityChartData: StatusBarDatum[] = Object.entries(oppStatusCounts).map(
    ([status, value]) => ({ label: OPPORTUNITY_STATUS_LABELS[status] ?? status, value })
  );

  // Recent signups
  const { data: recentUsers } = await supabase
    .from("users")
    .select("id, name, email, role, created_at, is_active")
    .order("created_at", { ascending: false })
    .limit(8);

  // Recent applications
  const { data: recentApps } = await supabase
    .from("applications")
    .select("id, status, applied_date, users!applications_student_id_fkey(name), opportunities(title)")
    .order("applied_date", { ascending: false })
    .limit(6);

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
    applied: { bg: "var(--bg-accent)", text: "var(--text-accent)" },
    pending: { bg: "var(--bg-warning)", text: "var(--text-warning)" },
    interview: { bg: "var(--bg-pro)", text: "var(--text-pro)" },
    accepted: { bg: "var(--bg-success)", text: "var(--text-success)" },
    rejected: { bg: "var(--bg-danger)", text: "var(--text-danger)" },
    archived: { bg: "var(--fill-control)", text: "var(--text-muted)" },
  };

  const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
    student: { bg: "var(--bg-accent)", text: "var(--text-accent)" },
    mentor: { bg: "var(--bg-pro)", text: "var(--text-pro)" },
    admin: { bg: "var(--bg-warning)", text: "var(--text-warning)" },
  };

  return (
    <div className="flex flex-col gap-6">
      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        <KpiCard icon={Users} label="Total users" value={totalUsers ?? 0} tone="accent" />
        <KpiCard icon={Users} label="Students" value={totalStudents ?? 0} tone="success" />
        <KpiCard icon={Users} label="Mentors" value={totalMentors ?? 0} tone="pro" />
        <KpiCard icon={ShieldCheck} label="Pending approvals" value={pendingMentors ?? 0} tone="warning" />
        <KpiCard icon={Briefcase} label="Active opportunities" value={activeOpportunities ?? 0} tone="accent" />
        <KpiCard icon={ClipboardList} label="Total applications" value={totalApplications ?? 0} tone="success" />
      </div>

      <StatusBarChart
        title="Opportunities by status"
        subtitle="Platform-wide pipeline, from draft to archived"
        data={opportunityChartData}
        emptyLabel="No opportunities have been created yet"
      />

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Recent Users */}
        <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-1)]">
          <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
            <div className="flex items-center gap-2">
              <TrendingUp size={15} className="text-[var(--text-accent)]" />
              <h3 className="text-[13px] font-medium text-[var(--text-primary)]">Recent Signups</h3>
            </div>
            <span className="text-[11px] text-[var(--text-muted)]">{totalUsers ?? 0} total</span>
          </div>
          <div className="divide-y divide-[var(--border)]">
            {(recentUsers ?? []).map((u) => {
              const roleColor = ROLE_COLORS[u.role] ?? ROLE_COLORS.student;
              return (
                <div key={u.id} className="flex items-center justify-between px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--fill-control)] text-[11px] font-semibold text-[var(--text-primary)]">
                      {u.name?.charAt(0)?.toUpperCase() ?? "?"}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-[13px] font-medium text-[var(--text-primary)]">{u.name}</div>
                      <div className="text-[11px] text-[var(--text-muted)]">{u.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-medium capitalize"
                      style={{ background: roleColor.bg, color: roleColor.text }}
                    >
                      {u.role}
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)]">{timeAgo(u.created_at)}</span>
                  </div>
                </div>
              );
            })}
            {(!recentUsers || recentUsers.length === 0) && (
              <div className="px-4 py-6 text-center text-[12px] text-[var(--text-muted)]">No users yet.</div>
            )}
          </div>
        </div>

        {/* Recent Applications */}
        <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-1)]">
          <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
            <div className="flex items-center gap-2">
              <ClipboardList size={15} className="text-[var(--text-accent)]" />
              <h3 className="text-[13px] font-medium text-[var(--text-primary)]">Recent Applications</h3>
            </div>
            <span className="text-[11px] text-[var(--text-muted)]">{totalApplications ?? 0} total</span>
          </div>
          <div className="divide-y divide-[var(--border)]">
            {(recentApps ?? []).map((app) => {
              const student = Array.isArray(app.users) ? app.users[0] : app.users;
              const opp = Array.isArray(app.opportunities) ? app.opportunities[0] : app.opportunities;
              const statusColor = STATUS_COLORS[app.status] ?? STATUS_COLORS.pending;
              return (
                <div key={app.id} className="flex items-center justify-between px-4 py-2.5">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-medium text-[var(--text-primary)]">
                      {(opp as { title?: string })?.title ?? "Opportunity"}
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)]">
                      by {(student as { name?: string })?.name ?? "Student"} · {formatDate(app.applied_date)}
                    </div>
                  </div>
                  <span
                    className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium capitalize"
                    style={{ background: statusColor.bg, color: statusColor.text }}
                  >
                    {app.status}
                  </span>
                </div>
              );
            })}
            {(!recentApps || recentApps.length === 0) && (
              <div className="px-4 py-6 text-center text-[12px] text-[var(--text-muted)]">No applications yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
