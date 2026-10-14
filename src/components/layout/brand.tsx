import Link from "next/link";

export function Brand() {
  return <Link href="/" className="wordmark" aria-label="Daylight home"><span className="brand-mark" aria-hidden="true" />Daylight</Link>;
}
