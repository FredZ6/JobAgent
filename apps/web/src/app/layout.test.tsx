import React from "react";
import { describe, expect, it } from "vitest";

import RootLayout from "./layout";
import { AppShell } from "../components/app-shell";

(globalThis as typeof globalThis & { React?: typeof React }).React = React;

describe("RootLayout", () => {
  it("wraps page content in the app shell under the body element", () => {
    const child = React.createElement("div", null, "content");
    const tree = RootLayout({ children: child });

    expect(tree.props.lang).toBe("en");

    const body = React.Children.toArray(tree.props.children).find(
      (child) => React.isValidElement(child) && child.type === "body"
    );

    expect(React.isValidElement(body)).toBe(true);
    expect(React.isValidElement(body) ? body.props.suppressHydrationWarning : undefined).toBe(true);
    const shell = React.isValidElement(body) ? body.props.children : undefined;

    expect(React.isValidElement(shell)).toBe(true);
    expect(React.isValidElement(shell) ? shell.type : undefined).toBe(AppShell);
    expect(React.isValidElement(shell) ? shell.props.children : undefined).toBe(child);
  });
});
