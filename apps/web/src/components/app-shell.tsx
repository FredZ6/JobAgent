"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PropsWithChildren } from "react";

import { appBrand } from "../lib/brand";
import { ThemeToggle } from "./theme-toggle";

const navigation = [
  { href: "/", label: "Overview" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/workflow-runs", label: "Workflow runs" },
  { href: "/settings", label: "Settings" },
  { href: "/profile", label: "Profile" },
  { href: "/jobs", label: "Jobs" }
];

export function AppShell({ children }: PropsWithChildren) {
  const pathname = usePathname() ?? "";

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="shell-utility-row">
          <div className="shell-utility-copy">
            <span className="workspace-tag">Executive workspace</span>
            <span className="workspace-note">Local-first application operations with visible review gates</span>
          </div>
          <ThemeToggle />
        </div>
        <div className="brand-row">
          <div className="brand-mark">
            <div className="brand-seal" />
            <div className="shell-title-block">
              <div className="shell-kicker">Human-in-the-loop application ops</div>
              <h1 className="brand-title">{appBrand.name}</h1>
              <p className="brand-subtitle">{appBrand.subtitle}</p>
            </div>
          </div>
          <div className="shell-trust-rail">
            <div className="status-pill">{appBrand.statusPill}</div>
            <p className="shell-trust-copy">
              Candidate context, automation runs, and final submission review stay legible in one premium workspace.
            </p>
          </div>
        </div>
        <nav className="nav-row">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link${
                item.href === "/"
                  ? pathname === item.href
                    ? " active"
                    : ""
                  : pathname.startsWith(item.href)
                    ? " active"
                    : ""
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="shell-content">{children}</main>
    </div>
  );
}
