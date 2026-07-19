import Link from "next/link";
import {
  ArrowRight,
  Sparkles,
  FileText,
  Users2,
  ShieldCheck,
  GraduationCap,
  Briefcase,
  Target,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Reveal } from "@/components/landing/Reveal";

const OPPORTUNITY_TYPES = [
  "Internships",
  "Scholarships",
  "Jobs",
  "Hackathons",
  "Research",
  "Fellowships",
  "Bootcamps",
  "Conferences",
  "Exchange programs",
  "Competitions",
];

const STEPS = [
  {
    n: "01",
    title: "Build your profile",
    body: "Add your skills, degree, and resume once. Oppora reads it — you don't fill out the same form ten times.",
  },
  {
    n: "02",
    title: "Get matched by AI",
    body: "Every open opportunity is scored against your profile, so what you see first is what actually fits.",
  },
  {
    n: "03",
    title: "Apply, or ask a mentor",
    body: "Send your application, or bring the decision to a mentor in your field before you commit.",
  },
];

const ROLES = [
  {
    icon: GraduationCap,
    title: "For students",
    body: "A single feed of ranked opportunities, AI resume feedback, and mentors who've done the thing you're trying to do.",
    cta: "Explore the student dashboard",
  },
  {
    icon: Users2,
    title: "For mentors",
    body: "Review requests, track the students you're guiding, and leave feedback that actually reaches them.",
    cta: "Explore the mentor dashboard",
  },
  {
    icon: ShieldCheck,
    title: "For admins",
    body: "Approve mentors, publish opportunities, and see platform activity in one place — no spreadsheets.",
    cta: "Explore the admin dashboard",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--bg-base)]/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--fill-accent)] text-[14px] font-semibold text-[var(--on-accent)]">
              O
            </div>
            <span className="text-[14px] font-semibold tracking-tight text-[var(--text-primary)]">
              Oppora AI
            </span>
          </div>

          <nav className="hidden items-center gap-7 md:flex">
            <a href="#how-it-works" className="text-[13px] text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]">
              How it works
            </a>
            <a href="#roles" className="text-[13px] text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]">
              Who it's for
            </a>
            <a href="#features" className="text-[13px] text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]">
              Features
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/login"
              className="hidden text-[13px] font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)] sm:inline-block"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="rounded-[var(--radius-sm)] bg-[var(--fill-accent)] px-4 py-2 text-[13px] font-medium text-[var(--on-accent)] transition-opacity hover:opacity-90"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden px-5 pb-20 pt-16 sm:pt-24">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="animate-[fadeUp_0.7s_ease-out_both]">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-1)] px-3 py-1 text-[11px] font-medium text-[var(--text-secondary)]">
              <Sparkles size={12} className="text-[var(--text-accent)]" />
              AI-matched, not keyword-searched
            </div>
            <h1 className="text-[40px] font-medium leading-[1.08] tracking-tight text-[var(--text-primary)] sm:text-[54px]">
              Matched, not
              <br />
              searched.
            </h1>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-[var(--text-secondary)]">
              Oppora AI reads your profile once, then ranks every internship, scholarship,
              hackathon, and job against it — and connects you with a mentor who's already
              walked the path.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/register"
                className="flex items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--fill-accent)] px-5 py-2.5 text-[13px] font-medium text-[var(--on-accent)] transition-opacity hover:opacity-90"
              >
                Get started
                <ArrowRight size={14} />
              </Link>
              <Link
                href="/login"
                className="rounded-[var(--radius-sm)] border border-[var(--border)] px-5 py-2.5 text-[13px] font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--fill-control)]"
              >
                Sign in
              </Link>
            </div>
          </div>

          {/* Signature element: the "match" visual */}
          <div className="relative mx-auto h-[280px] w-full max-w-[420px] animate-[fadeUp_0.9s_ease-out_0.15s_both]">
            <svg viewBox="0 0 420 280" className="h-full w-full" fill="none">
              <path
                id="matchPath"
                d="M 60 210 C 140 210, 160 70, 360 70"
                stroke="var(--border)"
                strokeWidth="2"
                strokeDasharray="4 6"
              />
              <circle r="4.5" fill="var(--fill-accent)">
                <animateMotion dur="3.2s" repeatCount="indefinite" path="M 60 210 C 140 210, 160 70, 360 70" />
              </circle>

              {/* "You" node */}
              <g transform="translate(20, 182)">
                <rect width="88" height="56" rx="12" fill="var(--surface-1)" stroke="var(--border)" />
                <circle cx="24" cy="28" r="10" fill="var(--bg-accent)" stroke="var(--text-accent)" />
                <text x="42" y="24" fontSize="11" fontFamily="var(--font-mono)" fill="var(--text-primary)" fontWeight="600">
                  You
                </text>
                <text x="42" y="38" fontSize="9" fontFamily="var(--font-mono)" fill="var(--text-muted)">
                  profile
                </text>
              </g>

              {/* Opportunity node */}
              <g transform="translate(316, 40)">
                <rect width="96" height="56" rx="12" fill="var(--surface-1)" stroke="var(--border)" />
                <circle cx="24" cy="28" r="10" fill="var(--bg-success)" stroke="var(--text-success)" />
                <text x="42" y="24" fontSize="11" fontFamily="var(--font-mono)" fill="var(--text-primary)" fontWeight="600">
                  Match
                </text>
                <text x="42" y="38" fontSize="9" fontFamily="var(--font-mono)" fill="var(--text-muted)">
                  94% fit
                </text>
              </g>
            </svg>
          </div>
        </div>

        {/* Opportunity type strip */}
        <div className="mx-auto mt-14 max-w-6xl">
          <div className="flex flex-wrap items-center gap-2 border-t border-[var(--border)] pt-6">
            <span className="mr-2 text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]" style={{ fontFamily: "var(--font-mono)" }}>
              Opportunity types
            </span>
            {OPPORTUNITY_TYPES.map((t) => (
              <span
                key={t}
                className="rounded-full border border-[var(--border)] bg-[var(--surface-1)] px-2.5 py-1 text-[11px] text-[var(--text-secondary)]"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-t border-[var(--border)] px-5 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-[26px] font-medium tracking-tight text-[var(--text-primary)]">How it works</h2>
          <p className="mt-2 max-w-lg text-[14px] text-[var(--text-secondary)]">
            Three steps between signing up and your first real match.
          </p>

          <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-3">
            {STEPS.map((s, i) => (
              <Reveal key={s.n} delay={i * 100}>
                <span
                  className="text-[13px] font-semibold text-[var(--text-accent)]"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {s.n}
                </span>
                <h3 className="mt-3 text-[16px] font-medium text-[var(--text-primary)]">{s.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-[var(--text-secondary)]">{s.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section id="roles" className="border-t border-[var(--border)] bg-[var(--surface-0)] px-5 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-[26px] font-medium tracking-tight text-[var(--text-primary)]">
            One platform, three dashboards
          </h2>
          <p className="mt-2 max-w-lg text-[14px] text-[var(--text-secondary)]">
            Students, mentors, and admins each get a workspace built for exactly what they need to do.
          </p>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {ROLES.map((r, i) => (
              <Reveal key={r.title} delay={i * 100}>
                <div className="flex h-full flex-col rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-1)] p-6">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--bg-accent)] text-[var(--text-accent)]">
                    <r.icon size={18} />
                  </div>
                  <h3 className="text-[15px] font-medium text-[var(--text-primary)]">{r.title}</h3>
                  <p className="mt-2 flex-1 text-[13px] leading-relaxed text-[var(--text-secondary)]">{r.body}</p>
                  <Link
                    href="/register"
                    className="mt-4 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-[var(--text-accent)]"
                  >
                    {r.cta}
                    <ArrowRight size={12} />
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-[var(--border)] px-5 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-[26px] font-medium tracking-tight text-[var(--text-primary)]">
            What's under the hood
          </h2>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Target, title: "AI recommendations", body: "Every opportunity is scored against your profile — no more scrolling a generic list." },
              { icon: FileText, title: "Resume analysis", body: "Get a match score and concrete suggestions, generated from your actual resume." },
              { icon: Users2, title: "Mentor network", body: "Request a mentor, track the relationship, and get feedback tied to your progress." },
              { icon: Briefcase, title: "Ten opportunity types", body: "Internships to fellowships to hackathons, all in one feed instead of ten tabs." },
            ].map((f, i) => (
              <Reveal key={f.title} delay={i * 80}>
                <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-1)] p-5">
                  <f.icon size={18} className="text-[var(--text-accent)]" />
                  <h3 className="mt-3 text-[13.5px] font-medium text-[var(--text-primary)]">{f.title}</h3>
                  <p className="mt-1.5 text-[12.5px] leading-relaxed text-[var(--text-secondary)]">{f.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-[var(--border)] px-5 py-20">
        <div className="mx-auto flex max-w-6xl flex-col items-center rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-1)] px-6 py-14 text-center">
          <h2 className="max-w-lg text-[26px] font-medium tracking-tight text-[var(--text-primary)]">
            Stop searching. Start getting matched.
          </h2>
          <Link
            href="/register"
            className="mt-6 flex items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--fill-accent)] px-5 py-2.5 text-[13px] font-medium text-[var(--on-accent)] transition-opacity hover:opacity-90"
          >
            Create your account
            <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] px-5 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 sm:flex-row">
          <span className="text-[12px] text-[var(--text-muted)]">© {new Date().getFullYear()} Oppora AI</span>
          <div className="flex items-center gap-5">
            <Link href="/login" className="text-[12px] text-[var(--text-muted)] hover:text-[var(--text-primary)]">
              Sign in
            </Link>
            <Link href="/register" className="text-[12px] text-[var(--text-muted)] hover:text-[var(--text-primary)]">
              Get started
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
