"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"student" | "mentor" | "admin">("student");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, role }, // consumed by the public.users sync trigger (Phase 5)
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-base)] px-4">
        <div className="w-full max-w-sm rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-1)] p-6 text-center">
          <h1 className="mb-1 text-[16px] font-medium text-[var(--text-primary)]">Check your email</h1>
          <p className="text-[12px] text-[var(--text-muted)]">
            We sent a verification link to {email}. Confirm it to activate your account.
          </p>
        </div>
      </div>
    );
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

        <h1 className="mb-1 text-[16px] font-medium text-[var(--text-primary)]">Create your account</h1>
        <p className="mb-5 text-[12px] text-[var(--text-muted)]">
          Start discovering opportunities matched to you.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="text"
            required
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-0)] px-3 py-2 text-[13px] text-[var(--text-primary)] outline-none focus:border-[var(--fill-accent)]"
          />
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-0)] px-3 py-2 text-[13px] text-[var(--text-primary)] outline-none focus:border-[var(--fill-accent)]"
          />
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              minLength={8}
              placeholder="Password (min. 8 characters)"
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

          <div className="flex gap-2">
            {(["student", "mentor", "admin"] as const).map((r) => (
              <button
                type="button"
                key={r}
                onClick={() => setRole(r)}
                className={`flex-1 rounded-[var(--radius-sm)] border py-2 text-[13px] capitalize ${
                  role === r
                    ? "border-[var(--fill-accent)] bg-[var(--bg-accent)] text-[var(--text-accent)] font-medium"
                    : "border-[var(--border)] text-[var(--text-secondary)]"
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {error && <p className="text-[12px] text-[var(--text-danger)]">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 rounded-[var(--radius-sm)] bg-[var(--fill-accent)] py-2 text-[13px] font-medium text-[var(--on-accent)] disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-5 text-center text-[12px] text-[var(--text-muted)]">
          Already have an account?{" "}
          <Link href="/login" className="text-[var(--text-accent)] font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
