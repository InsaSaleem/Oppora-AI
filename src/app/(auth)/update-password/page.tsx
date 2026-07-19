"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }
    setDone(true);
    setTimeout(() => router.push("/login"), 1500);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-base)] px-4">
      <div className="w-full max-w-sm rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-1)] p-6">
        <div className="mb-6 flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--fill-accent)] text-[13px] font-medium text-[var(--on-accent)]">
            O
          </div>
          <span className="text-[15px] font-medium text-[var(--text-primary)]">Oppora AI</span>
        </div>

        {done ? (
          <>
            <h1 className="mb-1 text-[16px] font-medium text-[var(--text-primary)]">Password updated</h1>
            <p className="text-[12.5px] text-[var(--text-muted)]">Redirecting you to sign in…</p>
          </>
        ) : (
          <>
            <h1 className="mb-1 text-[16px] font-medium text-[var(--text-primary)]">Set a new password</h1>
            <p className="mb-5 text-[12px] text-[var(--text-muted)]">
              Choose a new password for your account.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="New password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-0)] px-3 py-2 pr-9 text-[13px] text-[var(--text-primary)] outline-none focus:border-[var(--fill-accent)]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="Confirm new password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-0)] px-3 py-2 text-[13px] text-[var(--text-primary)] outline-none focus:border-[var(--fill-accent)]"
              />

              {error && <p className="text-[12px] text-[var(--text-danger)]">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="mt-1 rounded-[var(--radius-sm)] bg-[var(--fill-accent)] py-2 text-[13px] font-medium text-[var(--on-accent)] disabled:opacity-60"
              >
                {loading ? "Updating..." : "Update password"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
