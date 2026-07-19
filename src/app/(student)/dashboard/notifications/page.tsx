"use client";

import { useEffect, useState, useCallback } from "react";
import { Bell, Check, AlertTriangle, Sparkles, Clock, MessageSquare, Info } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { cn } from "@/lib/utils";
import type { NotificationType } from "@/types/database";

interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

const NOTIF_ICONS: Record<NotificationType, typeof Bell> = {
  deadline_alert: Clock,
  application_update: AlertTriangle,
  mentor_feedback: MessageSquare,
  ai_recommendation: Sparkles,
  system: Info,
};

const NOTIF_COLORS: Record<NotificationType, { bg: string; text: string }> = {
  deadline_alert: { bg: "var(--bg-warning)", text: "var(--text-warning)" },
  application_update: { bg: "var(--bg-accent)", text: "var(--text-accent)" },
  mentor_feedback: { bg: "var(--bg-pro)", text: "var(--text-pro)" },
  ai_recommendation: { bg: "var(--bg-success)", text: "var(--text-success)" },
  system: { bg: "var(--fill-control)", text: "var(--text-muted)" },
};

export default function NotificationsPage() {
  const supabase = createClient();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    setNotifications((data as NotificationItem[]) ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  async function toggleRead(notifId: string, currentlyRead: boolean) {
    await supabase
      .from("notifications")
      .update({ is_read: !currentlyRead })
      .eq("id", notifId);

    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notifId ? { ...n, is_read: !currentlyRead } : n
      )
    );
  }

  async function markAllRead() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);

    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }

  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[18px] font-semibold text-[var(--text-primary)] mb-1">Notifications</h2>
          <p className="text-[13px] text-[var(--text-muted)]">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}` : "You're all caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="rounded-[var(--radius-sm)] border border-[var(--border)] px-3 py-1.5 text-[12px] font-medium text-[var(--text-secondary)] hover:bg-[var(--fill-control)] transition-colors"
          >
            Mark all read
          </button>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--fill-accent)] border-t-transparent" />
        </div>
      )}

      {!loading && notifications.length === 0 && (
        <EmptyState
          icon={Bell}
          title="No notifications"
          description="You'll see updates about your applications, deadlines, and AI recommendations here."
        />
      )}

      {!loading && notifications.length > 0 && (
        <div className="flex flex-col gap-1">
          {notifications.map((notif) => {
            const Icon = NOTIF_ICONS[notif.type] ?? Bell;
            const colors = NOTIF_COLORS[notif.type] ?? NOTIF_COLORS.system;

            return (
              <div
                key={notif.id}
                className={cn(
                  "flex items-start gap-3 rounded-[var(--radius)] border px-4 py-3 transition-colors",
                  notif.is_read
                    ? "border-transparent bg-transparent"
                    : "border-[var(--border)] bg-[var(--surface-1)]"
                )}
              >
                <div
                  className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: colors.bg }}
                >
                  <Icon size={15} style={{ color: colors.text }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={cn(
                      "text-[13px]",
                      notif.is_read ? "text-[var(--text-secondary)]" : "font-medium text-[var(--text-primary)]"
                    )}>
                      {notif.title}
                    </span>
                    {!notif.is_read && (
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--fill-accent)]" />
                    )}
                  </div>
                  <p className="text-[12px] text-[var(--text-muted)] line-clamp-2">{notif.message}</p>
                  <span className="mt-1 text-[11px] text-[var(--text-muted)]">{timeAgo(notif.created_at)}</span>
                </div>
                <button
                  onClick={() => toggleRead(notif.id, notif.is_read)}
                  className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--fill-control)] transition-colors"
                  title={notif.is_read ? "Mark as unread" : "Mark as read"}
                >
                  <Check size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
