import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme?: () => void;
  resetTheme?: () => void;
  switchable: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  switchable?: boolean;
}

export function ThemeProvider({
  children,
  defaultTheme = "light",
  switchable = false,
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (switchable) {
      const stored = localStorage.getItem("theme");
      return (stored as Theme) || defaultTheme;
    }
    return defaultTheme;
  });
  const [hasCustomTheme, setHasCustomTheme] = useState(() => switchable && localStorage.getItem("theme") !== null);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
      root.classList.remove("executive-light");
    } else {
      root.classList.remove("dark");
      root.classList.add("executive-light");
    }

    if (switchable) {
      if (hasCustomTheme) localStorage.setItem("theme", theme);
      else localStorage.removeItem("theme");
    }
  }, [theme, switchable, hasCustomTheme]);

  const toggleTheme = switchable
      ? () => {
        setHasCustomTheme(true);
        setTheme(prev => (prev === "light" ? "dark" : "light"));
      }
    : undefined;
  const resetTheme = switchable ? () => { setHasCustomTheme(false); setTheme(defaultTheme); } : undefined;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, resetTheme, switchable }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
