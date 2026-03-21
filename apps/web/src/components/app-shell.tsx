"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PropsWithChildren } from "react";

import { appBrand } from "../lib/brand";

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
        <div className="brand-row">
          <div className="brand-mark">
            <div className="brand-seal" />
            <div>
              <h1 className="brand-title">{appBrand.name}</h1>
              <p className="brand-subtitle">{appBrand.subtitle}</p>
            </div>
          </div>
          <div className="status-pill">{appBrand.statusPill}</div>
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
      {children}
    </div>
  );
}
