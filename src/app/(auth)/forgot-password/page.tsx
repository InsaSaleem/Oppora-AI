"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });

    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSent(true);
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

        {sent ? (
          <>
            <h1 className="mb-1 text-[16px] font-medium text-[var(--text-primary)]">Check your email</h1>
            <p className="mb-5 text-[12.5px] leading-relaxed text-[var(--text-muted)]">
              If an account exists for <span className="text-[var(--text-primary)]">{email}</span>, we&apos;ve sent
              a link to reset your password.
            </p>
            <Link
              href="/login"
              className="block w-full rounded-[var(--radius-sm)] border border-[var(--border)] py-2 text-center text-[13px] font-medium text-[var(--text-primary)] hover:bg-[var(--fill-control)]"
            >
              Back to sign in
            </Link>
          </>
        ) : (
          <>
            <h1 className="mb-1 text-[16px] font-medium text-[var(--text-primary)]">Reset your password</h1>
            <p className="mb-5 text-[12px] text-[var(--text-muted)]">
              Enter your email and we&apos;ll send you a reset link.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                type="email"
                required
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-0)] px-3 py-2 text-[13px] text-[var(--text-primary)] outline-none focus:border-[var(--fill-accent)]"
              />

              {error && <p className="text-[12px] text-[var(--text-danger)]">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="mt-1 rounded-[var(--radius-sm)] bg-[var(--fill-accent)] py-2 text-[13px] font-medium text-[var(--on-accent)] disabled:opacity-60"
              >
                {loading ? "Sending..." : "Send reset link"}
              </button>
            </form>

            <p className="mt-5 text-center text-[12px] text-[var(--text-muted)]">
              <Link href="/login" className="text-[var(--text-accent)] font-medium">
                Back to sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
