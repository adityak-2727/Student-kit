"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return <main id="main" className="welcome"><section><h1>We couldn’t open this page.</h1><p>Please try again. If it continues, check your application configuration.</p><button className="primary-link" type="button" onClick={reset}>Try again</button></section></main>;
}
