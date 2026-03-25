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
  it("links each overview card to the matching page and omits numeric eyebrows", () => {
    render(<HomePage />);

    expect(screen.getByRole("link", { name: /settings/i })).toHaveAttribute("href", "/settings");
    expect(screen.getByRole("link", { name: /profile/i })).toHaveAttribute("href", "/profile");
    expect(screen.getByRole("link", { name: /jobs \+ analysis/i })).toHaveAttribute("href", "/jobs");

    expect(screen.queryByText("1")).not.toBeInTheDocument();
    expect(screen.queryByText("2")).not.toBeInTheDocument();
    expect(screen.queryByText("3")).not.toBeInTheDocument();
  });
});
