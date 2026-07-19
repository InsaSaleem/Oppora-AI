"use client";

import { useEffect, useRef, useState } from "react";
import { Moon, Sun, Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface TopnavProps {
  title: string;
}

interface NotificationRow {
  id: string;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export function Topnav({ title }: TopnavProps) {
  const [isDark, setIsDark] = useState(true);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    const stored = window.localStorage.getItem("oppora-theme");
    const dark = stored ? stored === "dark" : true;
    setIsDark(dark);
    document.documentElement.classList.toggle("dark", dark);
  }, []);

  useEffect(() => {
    fetchNotifications();
    // Close the dropdown on outside click
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchNotifications() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("notifications")
      .select("id, title, message, link, is_read, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    const rows = (data as NotificationRow[]) ?? [];
    setNotifications(rows);
    setUnreadCount(rows.filter((n) => !n.is_read).length);
  }

  async function toggleOpen() {
    const next = !open;
    setOpen(next);
    if (next) await fetchNotifications();
  }

  async function markAllRead() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  }

  async function markOneRead(id: string) {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
  }

  function toggleTheme() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    window.localStorage.setItem("oppora-theme", next ? "dark" : "light");
  }

  function timeAgo(dateStr: string): string {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--surface-0)] px-6">
      <h1 className="text-[14px] font-medium text-[var(--text-primary)]">{title}</h1>
      <div className="flex items-center gap-2">
        <div className="relative" ref={panelRef}>
          <button
            aria-label="Notifications"
            onClick={toggleOpen}
            className="relative flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--fill-control)]"
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-semibold leading-none text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {open && (
            <div className="absolute right-0 top-10 z-40 w-80 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-1)] shadow-lg">
              <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
                <span className="text-[12.5px] font-medium text-[var(--text-primary)]">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[11.5px] font-medium text-[var(--text-accent)] hover:opacity-80"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-[12.5px] text-[var(--text-muted)]">
                    No notifications yet
                  </div>
                ) : (
                  notifications.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => markOneRead(n.id)}
                      className="flex w-full flex-col gap-0.5 border-b border-[var(--border)] px-4 py-3 text-left last:border-b-0 hover:bg-[var(--fill-control)]"
                    >
                      <div className="flex items-center gap-2">
                        {!n.is_read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--fill-accent)]" />}
                        <span className="text-[12.5px] font-medium text-[var(--text-primary)]">{n.title}</span>
                      </div>
                      <span className="text-[11.5px] leading-snug text-[var(--text-secondary)]">{n.message}</span>
                      <span className="text-[10.5px] text-[var(--text-muted)]">{timeAgo(n.created_at)}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <button
          aria-label="Toggle dark mode"
          onClick={toggleTheme}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--fill-control)]"
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </header>
  );
}
