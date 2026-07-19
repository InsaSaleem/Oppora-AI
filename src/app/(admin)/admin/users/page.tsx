"use client";

import { useEffect, useState, useCallback } from "react";
import { Users, Search, ShieldCheck, ShieldX, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/database";

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  student: { bg: "var(--bg-accent)", text: "var(--text-accent)" },
  mentor: { bg: "var(--bg-pro)", text: "var(--text-pro)" },
  admin: { bg: "var(--bg-warning)", text: "var(--text-warning)" },
};

export default function AdminUsersPage() {
  const supabase = createClient();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");

  const fetchUsers = useCallback(async () => {
    setLoading(true);

    let q = supabase
      .from("users")
      .select("id, name, email, role, is_active, created_at")
      .order("created_at", { ascending: false });

    if (roleFilter !== "all") {
      q = q.eq("role", roleFilter);
    }
    if (query.trim()) {
      q = q.or(`name.ilike.%${query.trim()}%,email.ilike.%${query.trim()}%`);
    }

    const { data } = await q.limit(100);
    setUsers((data as UserItem[]) ?? []);
    setLoading(false);
  }, [supabase, roleFilter, query]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  async function toggleActive(userId: string, currentlyActive: boolean) {
    await supabase.from("users").update({ is_active: !currentlyActive }).eq("id", userId);
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, is_active: !currentlyActive } : u))
    );
  }

  async function changeRole(userId: string, newRole: UserRole) {
    await supabase.from("users").update({ role: newRole }).eq("id", userId);
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    );
  }

  async function deleteUser(userId: string) {
    if (!confirm("Are you sure you want to delete this user?")) return;
    await supabase.from("users").delete().eq("id", userId);
    setUsers((prev) => prev.filter((u) => u.id !== userId));
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-[18px] font-semibold text-[var(--text-primary)] mb-1">Manage Users</h2>
        <p className="text-[13px] text-[var(--text-muted)]">View, edit roles, and manage all registered users.</p>
      </div>

      {/* Search & filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-0)] py-2 pl-9 pr-3 text-[13px] text-[var(--text-primary)] outline-none focus:border-[var(--fill-accent)] placeholder:text-[var(--text-muted)]"
          />
        </div>
        <div className="flex gap-1.5">
          {(["all", "student", "mentor", "admin"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={cn(
                "rounded-full px-3 py-1 text-[12px] font-medium capitalize transition-colors",
                roleFilter === r
                  ? "bg-[var(--fill-accent)] text-[var(--on-accent)]"
                  : "bg-[var(--fill-control)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--fill-accent)] border-t-transparent" />
        </div>
      )}

      {!loading && users.length === 0 && (
        <EmptyState icon={Users} title="No users found" description="Try adjusting your search or filters." />
      )}

      {!loading && users.length > 0 && (
        <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-1)] overflow-hidden">
          {/* Table header */}
          <div className="hidden lg:grid lg:grid-cols-[1fr_140px_100px_90px_110px] gap-4 border-b border-[var(--border)] px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
            <span>User</span>
            <span>Role</span>
            <span>Status</span>
            <span>Joined</span>
            <span>Actions</span>
          </div>

          {users.map((u, idx) => {
            const roleColor = ROLE_COLORS[u.role] ?? ROLE_COLORS.student;
            return (
              <div
                key={u.id}
                className={cn(
                  "flex flex-col gap-2 px-4 py-3 lg:grid lg:grid-cols-[1fr_140px_100px_90px_110px] lg:items-center lg:gap-4",
                  idx < users.length - 1 && "border-b border-[var(--border)]"
                )}
              >
                {/* User info */}
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--fill-control)] text-[11px] font-semibold text-[var(--text-primary)]">
                    {u.name?.charAt(0)?.toUpperCase() ?? "?"}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-medium text-[var(--text-primary)]">{u.name}</div>
                    <div className="truncate text-[11px] text-[var(--text-muted)]">{u.email}</div>
                  </div>
                </div>

                {/* Role selector */}
                <div>
                  <select
                    value={u.role}
                    onChange={(e) => changeRole(u.id, e.target.value as UserRole)}
                    className="rounded-md border border-[var(--border)] bg-[var(--surface-0)] px-2 py-1 text-[12px] text-[var(--text-primary)] outline-none"
                    style={{ color: roleColor.text }}
                  >
                    <option value="student">Student</option>
                    <option value="mentor">Mentor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                {/* Status */}
                <div>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[11px] font-medium",
                      u.is_active
                        ? "bg-[var(--bg-success)] text-[var(--text-success)]"
                        : "bg-[var(--bg-danger)] text-[var(--text-danger)]"
                    )}
                  >
                    {u.is_active ? "Active" : "Inactive"}
                  </span>
                </div>

                {/* Joined */}
                <div className="text-[12px] text-[var(--text-muted)]">{formatDate(u.created_at)}</div>

                {/* Actions */}
                <div className="flex gap-1.5">
                  <button
                    onClick={() => toggleActive(u.id, u.is_active)}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-muted)] hover:bg-[var(--fill-control)] hover:text-[var(--text-primary)] transition-colors"
                    title={u.is_active ? "Deactivate" : "Activate"}
                  >
                    {u.is_active ? <ShieldX size={14} /> : <ShieldCheck size={14} />}
                  </button>
                  <button
                    onClick={() => deleteUser(u.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-danger)] hover:text-[var(--text-danger)] transition-colors"
                    title="Delete user"
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
