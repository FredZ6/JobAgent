"use client";

import { useEffect, useSyncExternalStore } from "react";

import {
  applyTheme,
  persistTheme,
  readThemeMode,
  subscribeToThemeMode,
  type ThemeMode
} from "../lib/theme";

export function ThemeToggle() {
  const theme = useSyncExternalStore<ThemeMode>(
    subscribeToThemeMode,
    readThemeMode,
    () => "light"
  );

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  function toggleTheme() {
    const nextTheme: ThemeMode = theme === "light" ? "dark" : "light";
    persistTheme(nextTheme);
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
