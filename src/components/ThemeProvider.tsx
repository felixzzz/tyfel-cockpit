"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type ThemeMode = "light" | "dark";

interface ThemeContextValue {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  setTheme: () => {},
  toggleTheme: () => {},
});

const STORAGE_KEY = "fnb-ops-theme-mode";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    const initial: ThemeMode = saved === "dark" || saved === "light" ? saved : "light";
    setThemeState(initial);
    applyThemeToDom(initial);
    setMounted(true);
  }, []);

  const applyThemeToDom = (mode: ThemeMode) => {
    const root = document.documentElement;
    root.setAttribute("data-theme", mode);
    if (mode === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.add("light");
      root.classList.remove("dark");
    }
  };

  const setTheme = (mode: ThemeMode) => {
    setThemeState(mode);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, mode);
      applyThemeToDom(mode);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <ThemeContext.Provider value={{ theme: mounted ? theme : "light", setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
