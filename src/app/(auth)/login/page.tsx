"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  async function handleGoogleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
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

        <h1 className="mb-1 text-[16px] font-medium text-[var(--text-primary)]">Welcome back</h1>
        <p className="mb-5 text-[12px] text-[var(--text-muted)]">
          Sign in to keep track of your opportunities.
        </p>

        <button
          onClick={handleGoogleLogin}
          type="button"
          className="mb-4 flex w-full items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-0)] py-2 text-[13px] font-medium text-[var(--text-primary)] hover:bg-[var(--fill-control)]"
        >
          Continue with Google
        </button>

        <div className="mb-4 flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
          <div className="h-px flex-1 bg-[var(--border)]" />
          or
          <div className="h-px flex-1 bg-[var(--border)]" />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
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
              placeholder="Password"
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

          {error && <p className="text-[12px] text-[var(--text-danger)]">{error}</p>}

          <div className="flex justify-end">
            <Link href="/forgot-password" className="text-[12px] text-[var(--text-accent)]">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-1 rounded-[var(--radius-sm)] bg-[var(--fill-accent)] py-2 text-[13px] font-medium text-[var(--on-accent)] disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-5 text-center text-[12px] text-[var(--text-muted)]">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-[var(--text-accent)] font-medium">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
