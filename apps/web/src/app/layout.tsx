import type { Metadata } from "next";
import { PropsWithChildren } from "react";

import "./globals.css";
import { AppShell } from "../components/app-shell";

export const metadata: Metadata = {
  title: "Rolecraft",
  description: "Semi-automated job application MVP"
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
