export const themeStorageKey = "rolecraft-theme";
export const themeChangeEventName = "rolecraft-theme-change";

export const themeModes = ["light", "dark"] as const;

export type ThemeMode = (typeof themeModes)[number];

export function isThemeMode(value: string | null | undefined): value is ThemeMode {
  return value === "light" || value === "dark";
}

export function getSystemTheme(): ThemeMode {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return "light";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function readThemeMode(): ThemeMode {
  const storedTheme =
    typeof window !== "undefined" ? window.localStorage.getItem(themeStorageKey) : null;

  return isThemeMode(storedTheme) ? storedTheme : getSystemTheme();
}

export function subscribeToThemeMode(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const mediaQuery =
    typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-color-scheme: dark)")
      : null;

  function handleStorage(event: StorageEvent) {
    if (event.key === null || event.key === themeStorageKey) {
      onStoreChange();
    }
  }

  function handleThemeChange() {
    onStoreChange();
  }

  window.addEventListener("storage", handleStorage);
  window.addEventListener(themeChangeEventName, handleThemeChange);
  mediaQuery?.addEventListener("change", handleThemeChange);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(themeChangeEventName, handleThemeChange);
    mediaQuery?.removeEventListener("change", handleThemeChange);
  };
}

export function persistTheme(theme: ThemeMode) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(themeStorageKey, theme);
  window.dispatchEvent(new Event(themeChangeEventName));
}

export function applyTheme(theme: ThemeMode) {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}
