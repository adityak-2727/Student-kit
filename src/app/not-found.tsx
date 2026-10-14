import Link from "next/link";

export default function NotFound() {
  return <main id="main" className="welcome"><section><p className="eyebrow">Page unavailable</p><h1>This space is still taking shape.</h1><p>The requested page is unavailable in this build.</p><Link className="primary-link" href="/">Return to Daylight</Link></section></main>;
}
