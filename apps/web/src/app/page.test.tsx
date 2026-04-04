// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import HomePage from "./page";

(globalThis as typeof globalThis & { React?: typeof React }).React = React;

afterEach(() => {
  cleanup();
});

describe("HomePage overview cards", () => {
  it("presents the premium workspace landing page with the main entry points", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", { name: /run every application from one high-trust workspace/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/rolecraft keeps candidate context, job evidence, generated assets, and final review checkpoints/i)
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /open dashboard/i })).toHaveAttribute(
      "href",
      "/dashboard"
    );
    expect(screen.getByRole("link", { name: /review case queue/i })).toHaveAttribute("href", "/jobs");
    expect(screen.getByRole("link", { name: /open profile/i })).toHaveAttribute(
      "href",
      "/profile"
    );
    expect(screen.getByRole("link", { name: /review settings/i })).toHaveAttribute(
      "href",
      "/settings"
    );
    expect(screen.getByRole("heading", { name: /operating model/i })).toBeInTheDocument();
    expect(screen.getByText(/local-first context/i)).toBeInTheDocument();
    expect(screen.getByText(/manual submission/i)).toBeInTheDocument();
  });
});
