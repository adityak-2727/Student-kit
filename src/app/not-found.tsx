import Link from "next/link";
import { PublicFrame } from "@/components/layout/public-frame";

export default function NotFound() {
  return <PublicFrame><main id="main" tabIndex={-1} className="welcome"><section><p className="eyebrow">Page unavailable</p><h1>This space is still taking shape.</h1><p>The requested page is unavailable in this build.</p><Link className="primary-link" href="/">Return to Daylight</Link></section></main></PublicFrame>;
}
