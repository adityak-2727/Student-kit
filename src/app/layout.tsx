import type { Metadata } from "next";
import { getRuntimeEnvironment } from "@/server/config/environment";
import "@fontsource-variable/manrope";
import "@fontsource-variable/newsreader";
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
    {children}
  </body></html>;
}
