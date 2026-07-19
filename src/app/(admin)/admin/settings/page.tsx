"use client";

import { useEffect, useState, useCallback } from "react";
import { Settings, Save, CheckCircle2, AlertTriangle, Shield } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface AdminProfile {
  name: string;
  bio: string;
}

export default function AdminSettingsPage() {
  const supabase = createClient();
  const [profile, setProfile] = useState<AdminProfile>({ name: "", bio: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data } = await supabase.from("users").select("name, bio").eq("id", user.id).single();
    setProfile({ name: data?.name ?? "", bio: data?.bio ?? "" });
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    const { error } = await supabase
      .from("users")
      .update({ name: profile.name.trim(), bio: profile.bio.trim() || null })
      .eq("id", user.id);

    setSaving(false);
    if (error) {
      setFeedback({ type: "error", message: error.message });
    } else {
      setFeedback({ type: "success", message: "Profile updated successfully!" });
    }
  }

  const inputClass =
    "w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-0)] px-3 py-2 text-[13px] text-[var(--text-primary)] outline-none focus:border-[var(--fill-accent)] placeholder:text-[var(--text-muted)]";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--fill-accent)] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center gap-2 mb-5">
        <Settings size={18} className="text-[var(--text-accent)]" />
        <h2 className="text-[18px] font-semibold text-[var(--text-primary)]">Admin Settings</h2>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-6">
        <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-1)] p-5">
          <div className="flex items-center gap-2 mb-4">
            <Shield size={15} className="text-[var(--text-warning)]" />
            <h3 className="text-[14px] font-medium text-[var(--text-primary)]">Admin Profile</h3>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-[var(--text-secondary)]">Full Name</label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => { setProfile((p) => ({ ...p, name: e.target.value })); setFeedback(null); }}
                className={inputClass}
                placeholder="Admin Name"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-[var(--text-secondary)]">Bio</label>
              <textarea
                value={profile.bio}
                onChange={(e) => { setProfile((p) => ({ ...p, bio: e.target.value })); setFeedback(null); }}
                rows={3}
                className={inputClass + " resize-none"}
                placeholder="About you..."
              />
            </div>
          </div>
        </div>

        {feedback && (
          <div className={`flex items-center gap-2 rounded-[var(--radius-sm)] px-4 py-2.5 text-[13px] font-medium ${
            feedback.type === "success"
              ? "bg-[var(--bg-success)] text-[var(--text-success)]"
              : "bg-[var(--bg-danger)] text-[var(--text-danger)]"
          }`}>
            {feedback.type === "success" ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
            {feedback.message}
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--fill-accent)] px-5 py-2.5 text-[13px] font-medium text-[var(--on-accent)] transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            <Save size={14} />
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
