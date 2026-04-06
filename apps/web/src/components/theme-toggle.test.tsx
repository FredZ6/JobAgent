// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import React from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ThemeToggle } from "./theme-toggle";
import { themeStorageKey } from "../lib/theme";

(globalThis as typeof globalThis & { React?: typeof React }).React = React;

describe("ThemeToggle", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.dataset.theme = "";
    document.documentElement.style.colorScheme = "";

    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      }))
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("updates when the stored theme changes in the current tab", async () => {
    render(<ThemeToggle />);

    expect(screen.getByRole("button", { name: /switch to dark theme/i })).toBeInTheDocument();

    act(() => {
      window.localStorage.setItem(themeStorageKey, "dark");
      window.dispatchEvent(new Event("rolecraft-theme-change"));
    });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /switch to light theme/i })).toBeInTheDocument();
    });
  });

  it("persists the next theme when toggled", () => {
    render(<ThemeToggle />);

    fireEvent.click(screen.getByRole("button", { name: /switch to dark theme/i }));

    expect(window.localStorage.getItem(themeStorageKey)).toBe("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");
  });
});
