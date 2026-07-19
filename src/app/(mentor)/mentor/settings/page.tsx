"use client";

import { useEffect, useState, useCallback } from "react";
import { Settings, Save, CheckCircle2, AlertTriangle, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface MentorProfile {
  name: string;
  bio: string;
  linkedin_url: string;
  github_url: string;
  portfolio_url: string;
}

const EMPTY_PROFILE: MentorProfile = {
  name: "",
  bio: "",
  linkedin_url: "",
  github_url: "",
  portfolio_url: "",
};

export default function MentorSettingsPage() {
  const supabase = createClient();
  const [profile, setProfile] = useState<MentorProfile>(EMPTY_PROFILE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const [{ data: userRow }, { data: profileRow }] = await Promise.all([
      supabase.from("users").select("name, bio").eq("id", user.id).single(),
      supabase.from("profiles").select("linkedin_url, github_url, portfolio_url").eq("user_id", user.id).single(),
    ]);

    setProfile({
      name: userRow?.name ?? "",
      bio: userRow?.bio ?? "",
      linkedin_url: profileRow?.linkedin_url ?? "",
      github_url: profileRow?.github_url ?? "",
      portfolio_url: profileRow?.portfolio_url ?? "",
    });
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  function handleChange(field: keyof MentorProfile) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setProfile((prev) => ({ ...prev, [field]: e.target.value }));
      setFeedback(null);
    };
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    const { error: userError } = await supabase
      .from("users")
      .update({ name: profile.name.trim(), bio: profile.bio.trim() || null })
      .eq("id", user.id);

    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({
        user_id: user.id,
        linkedin_url: profile.linkedin_url.trim() || null,
        github_url: profile.github_url.trim() || null,
        portfolio_url: profile.portfolio_url.trim() || null,
      }, { onConflict: "user_id" });

    setSaving(false);

    if (userError || profileError) {
      setFeedback({ type: "error", message: userError?.message || profileError?.message || "Save failed." });
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
        <h2 className="text-[18px] font-semibold text-[var(--text-primary)]">Mentor Settings</h2>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-6">
        <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-1)] p-5">
          <div className="flex items-center gap-2 mb-4">
            <User size={15} className="text-[var(--text-secondary)]" />
            <h3 className="text-[14px] font-medium text-[var(--text-primary)]">Personal Information</h3>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-[var(--text-secondary)]">Full Name</label>
              <input type="text" value={profile.name} onChange={handleChange("name")} className={inputClass} placeholder="Jane Doe" />
            </div>
            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-[var(--text-secondary)]">Bio</label>
              <textarea
                value={profile.bio}
                onChange={handleChange("bio")}
                rows={3}
                className={inputClass + " resize-none"}
                placeholder="Tell your mentees about yourself, your experience, and expertise..."
              />
            </div>
          </div>
        </div>

        <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-1)] p-5">
          <h3 className="text-[14px] font-medium text-[var(--text-primary)] mb-4">Social Links</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-[var(--text-secondary)]">LinkedIn</label>
              <input type="url" value={profile.linkedin_url} onChange={handleChange("linkedin_url")} className={inputClass} placeholder="https://linkedin.com/in/..." />
            </div>
            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-[var(--text-secondary)]">GitHub</label>
              <input type="url" value={profile.github_url} onChange={handleChange("github_url")} className={inputClass} placeholder="https://github.com/..." />
            </div>
            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-[var(--text-secondary)]">Portfolio</label>
              <input type="url" value={profile.portfolio_url} onChange={handleChange("portfolio_url")} className={inputClass} placeholder="https://..." />
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
