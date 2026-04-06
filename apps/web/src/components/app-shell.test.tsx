// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AppShell } from "./app-shell";
import { usePathname } from "next/navigation";

(globalThis as typeof globalThis & { React?: typeof React }).React = React;

vi.mock("next/navigation", () => ({
  usePathname: vi.fn()
}));

const mockedUsePathname = vi.mocked(usePathname);

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  mockedUsePathname.mockReturnValue("/dashboard");
});

describe("AppShell", () => {
  it("renders the premium workspace shell navigation and trust framing", () => {
    render(
      <AppShell>
        <div>content</div>
      </AppShell>
    );

    expect(screen.getByText(/executive workspace/i)).toBeInTheDocument();
    expect(screen.getByText(/human approval is always explicit/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /overview/i })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: /dashboard/i })).toHaveAttribute("href", "/dashboard");
    expect(screen.getByRole("button", { name: /switch to dark theme/i })).toBeInTheDocument();
  });
});
