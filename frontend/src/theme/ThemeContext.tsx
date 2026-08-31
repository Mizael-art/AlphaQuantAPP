import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type ThemeMode = "dark" | "light";
export type AccentColor = "gold" | "blue" | "green" | "purple" | "rose";

const THEME_KEY = "aq_theme_mode";
const ACCENT_KEY = "aq_accent_color";

interface ThemeContextValue {
  mode: ThemeMode;
  accent: AccentColor;
  setMode: (m: ThemeMode) => void;
  setAccent: (a: AccentColor) => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getInitialMode(): ThemeMode {
  if (typeof window === "undefined") return "dark";
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === "dark" || stored === "light") return stored;
  // Respect the visitor's OS preference on first visit, then remember their choice from then on.
  return window.matchMedia?.("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function getInitialAccent(): AccentColor {
  if (typeof window === "undefined") return "gold";
  const stored = localStorage.getItem(ACCENT_KEY) as AccentColor | null;
  return stored ?? "gold";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(getInitialMode);
  const [accent, setAccentState] = useState<AccentColor>(getInitialAccent);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", mode);
    localStorage.setItem(THEME_KEY, mode);
  }, [mode]);

  useEffect(() => {
    document.documentElement.setAttribute("data-accent", accent);
    localStorage.setItem(ACCENT_KEY, accent);
  }, [accent]);

  const setMode = (m: ThemeMode) => setModeState(m);
  const setAccent = (a: AccentColor) => setAccentState(a);
  const toggleMode = () => setModeState(m => (m === "dark" ? "light" : "dark"));

  return (
    <ThemeContext.Provider value={{ mode, accent, setMode, setAccent, toggleMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
