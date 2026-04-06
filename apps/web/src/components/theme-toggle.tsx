"use client";

import { useEffect, useState } from "react";

import { applyTheme, getSystemTheme, isThemeMode, themeStorageKey, type ThemeMode } from "../lib/theme";

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeMode>("light");

  useEffect(() => {
    const storedTheme =
      typeof window !== "undefined" ? window.localStorage.getItem(themeStorageKey) : null;
    const initialTheme = isThemeMode(storedTheme) ? storedTheme : getSystemTheme();
    setTheme(initialTheme);
    applyTheme(initialTheme);
  }, []);

  function toggleTheme() {
    const nextTheme: ThemeMode = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    applyTheme(nextTheme);
    window.localStorage.setItem(themeStorageKey, nextTheme);
  }

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
      title={theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
    >
      <span className="theme-toggle-label">{theme === "light" ? "Light mode" : "Dark mode"}</span>
      <span className="theme-toggle-indicator" aria-hidden="true">
        {theme === "light" ? "Moon" : "Sun"}
      </span>
    </button>
  );
}
