import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/layout/DashboardShell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
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

  const name = profileUser?.name ?? user.email?.split("@")[0] ?? "Admin";
  const role = profileUser?.role ?? "student";

  // Only admins can access this layout
  if (role !== "admin") {
    redirect(role === "mentor" ? "/mentor" : "/dashboard");
  }

  return (
    <DashboardShell userName={name} userRole={role} title="Admin Dashboard">
      {children}
    </DashboardShell>
  );
}
