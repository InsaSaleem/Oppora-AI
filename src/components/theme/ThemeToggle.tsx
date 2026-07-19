"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

const STORAGE_KEY = "oppora-theme";

function applyTheme(theme: "light" | "dark") {
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
  window.localStorage.setItem(STORAGE_KEY, theme);
}

export function ThemeToggle({ className }: { className?: string }) {
  // Start undecided so we render nothing meaningful until we know the real
  // theme (avoids a flash / mismatch since the actual class is set by the
  // inline script in layout.tsx before hydration).
  const [theme, setTheme] = useState<"light" | "dark" | null>(null);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "dark" : "light");
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle color theme"
      className={
        className ??
        "flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-1)] text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
      }
    >
      {theme === null ? (
        <span className="h-4 w-4" />
      ) : theme === "dark" ? (
        <Sun size={16} />
      ) : (
        <Moon size={16} />
      )}
    </button>
  );
}
