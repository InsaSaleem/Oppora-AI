import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/layout/DashboardShell";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profileUser } = await supabase
    .from("users")
    .select("name, role")
    .eq("id", user.id)
    .single();

  // If public.users has no row yet, the sync trigger from Phase 5 hasn't run —
  // fall back to auth metadata so the shell still renders instead of crashing.
  const name = profileUser?.name ?? user.email?.split("@")[0] ?? "Student";
  const role = profileUser?.role ?? "student";

  return (
    <DashboardShell userName={name} userRole={role} title="Dashboard">
      {children}
    </DashboardShell>
  );
}
