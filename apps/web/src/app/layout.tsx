import type { Metadata } from "next";
import { PropsWithChildren } from "react";

import "./globals.css";
import { AppShell } from "../components/app-shell";
import { appBrand } from "../lib/brand";

export const metadata: Metadata = {
  title: appBrand.name,
  description: appBrand.description
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
