import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/layout/DashboardShell";

export default async function MentorLayout({ children }: { children: React.ReactNode }) {
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

  const name = profileUser?.name ?? user.email?.split("@")[0] ?? "Mentor";
  const role = profileUser?.role ?? "mentor";

  // If the user is not a mentor, redirect them to their correct dashboard
  if (role !== "mentor") {
    redirect(role === "admin" ? "/admin" : "/dashboard");
  }

  return (
    <DashboardShell userName={name} userRole={role} title="Mentor Dashboard">
      {children}
    </DashboardShell>
  );
}
