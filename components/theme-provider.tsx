"use client";
import * as React from "react";

export type Theme = "light" | "dark" | "system";
export type Resolved = "light" | "dark";

interface Ctx {
  theme: Theme;
  resolvedTheme: Resolved;
  setTheme: (t: Theme) => void;
}

const ThemeContext = React.createContext<Ctx | null>(null);
const STORAGE_KEY = "theme";

function getSystem(): Resolved {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyClass(resolved: Resolved, disableTransition: boolean) {
  const root = document.documentElement;
  if (disableTransition) {
    const css = document.createElement("style");
    css.appendChild(
      document.createTextNode(
        "*,*::before,*::after{transition:none!important;animation-duration:0s!important}",
      ),
    );
    document.head.appendChild(css);
    // Force reflow then remove on next frame.
    void window.getComputedStyle(css).opacity;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => css.remove());
    });
  }
  root.classList.toggle("dark", resolved === "dark");
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<Theme>("system");
  const [resolvedTheme, setResolved] = React.useState<Resolved>("light");

  // Hydrate from storage + current DOM (the inline beforeInteractive script
  // already set the `dark` class before paint, so trust it).
  React.useEffect(() => {
    const stored = (typeof window !== "undefined"
      ? (window.localStorage.getItem(STORAGE_KEY) as Theme | null)
      : null) ?? "system";
    setThemeState(stored);
    setResolved(stored === "system" ? getSystem() : stored);
  }, []);

  // Track system changes when theme is "system".
  React.useEffect(() => {
    if (theme !== "system" || typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const next = mq.matches ? "dark" : "light";
      setResolved(next);
      applyClass(next, false);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  const setTheme = React.useCallback((next: Theme) => {
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, next);
    setThemeState(next);
    const r: Resolved = next === "system" ? getSystem() : next;
    setResolved(r);
    applyClass(r, true);
  }, []);

  const value = React.useMemo<Ctx>(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Ctx {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) {
    // Fallback during SSR / pre-mount: return defaults so consumers don't crash.
    return { theme: "system", resolvedTheme: "light", setTheme: () => {} };
  }
  return ctx;
}
