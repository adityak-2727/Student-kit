import type { Metadata } from "next";
import Link from "next/link";
import { getRuntimeEnvironment } from "@/server/config/environment";
import "./globals.css";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: { default: "Daylight — a little room for your day", template: "%s · Daylight" },
  description: "A calm student workspace for study and life. Application foundation under development.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  getRuntimeEnvironment();
  return <html lang="en"><body>
    <a className="skip-link" href="#main">Skip to content</a>
    <header className="site-header">
      <Link href="/" className="wordmark" aria-label="Daylight home"><span className="brand-mark" aria-hidden="true" />Daylight</Link>
      <span className="build-label">Development preview</span>
    </header>
    {children}
    <footer className="site-footer">Made for a student’s day. Built one thoughtful step at a time.</footer>
  </body></html>;
}
