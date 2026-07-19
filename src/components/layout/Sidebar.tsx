"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Search,
  Bookmark,
  ListChecks,
  Sparkles,
  FileText,
  Bell,
  Settings,
  Users,
  MessageSquare,
  ClipboardList,
  ShieldCheck,
  BarChart3,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
}

const STUDENT_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/mentors", label: "Browse mentors", icon: Users },
  { href: "/dashboard/opportunities", label: "Browse opportunities", icon: Search },
  { href: "/dashboard/saved", label: "Saved", icon: Bookmark },
  { href: "/dashboard/applications", label: "Applications", icon: ListChecks },
  { href: "/dashboard/recommendations", label: "AI recommendations", icon: Sparkles },
  { href: "/dashboard/resume", label: "Resume analyzer", icon: FileText },
  { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
];

const MENTOR_NAV: NavItem[] = [
  { href: "/mentor", label: "Dashboard", icon: LayoutDashboard },
  { href: "/mentor/requests", label: "Mentorship requests", icon: Bell },
  { href: "/mentor/students", label: "My students", icon: Users },
  { href: "/mentor/feedback", label: "Give feedback", icon: MessageSquare },
  { href: "/mentor/applications", label: "Assigned applications", icon: ClipboardList },
];

const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Manage users", icon: Users },
  { href: "/admin/opportunities", label: "Manage opportunities", icon: BarChart3 },
  { href: "/admin/approvals", label: "Mentor approvals", icon: ShieldCheck },
];

function getNavItems(role: string): NavItem[] {
  if (role === "admin") return ADMIN_NAV;
  if (role === "mentor") return MENTOR_NAV;
  return STUDENT_NAV;
}

function getSettingsHref(role: string): string {
  if (role === "admin") return "/admin/settings";
  if (role === "mentor") return "/mentor/settings";
  return "/dashboard/settings";
}

interface SidebarProps {
  userName: string;
  userRole: string;
}

export function Sidebar({ userName, userRole }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const initials = userName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const navItems = getNavItems(userRole);
  const settingsHref = getSettingsHref(userRole);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="flex h-screen w-[220px] shrink-0 flex-col border-r border-[var(--border)] bg-[var(--surface-1)] p-3">
      <div className="flex items-center gap-2 px-2 py-2 mb-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--fill-accent)] text-[13px] font-medium text-[var(--on-accent)]">
          O
        </div>
        <span className="text-[15px] font-medium text-[var(--text-primary)]">
          Oppora AI
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition-colors",
                active
                  ? "bg-[var(--bg-accent)] text-[var(--text-accent)] font-medium"
                  : "text-[var(--text-secondary)] hover:bg-[var(--fill-control)]"
              )}
            >
              <Icon size={16} strokeWidth={2} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-0.5 border-t border-[var(--border)] pt-2">
        <Link
          href={settingsHref}
          className={cn(
            "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition-colors",
            pathname === settingsHref
              ? "bg-[var(--bg-accent)] text-[var(--text-accent)] font-medium"
              : "text-[var(--text-secondary)] hover:bg-[var(--fill-control)]"
          )}
        >
          <Settings size={16} />
          Settings
        </Link>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-[var(--text-secondary)] hover:bg-[var(--fill-control)] transition-colors w-full text-left"
        >
          <LogOut size={16} />
          Sign out
        </button>
        <div className="flex items-center gap-2.5 px-2.5 py-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--fill-control)] text-[11px] font-medium text-[var(--text-primary)]">
            {initials || "?"}
          </div>
          <div className="min-w-0">
            <div className="truncate text-[12px] font-medium text-[var(--text-primary)]">
              {userName}
            </div>
            <div className="text-[11px] capitalize text-[var(--text-muted)]">
              {userRole}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
