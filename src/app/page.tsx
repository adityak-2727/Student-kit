import Link from "next/link";
import { PublicFrame } from "@/components/layout/public-frame";
import { SignInInfo } from "@/components/layout/sign-in-info";
import { getRuntimeEnvironment } from "@/server/config/environment";

export default function Home() {
  const enabled = getRuntimeEnvironment().APP_MODE === "live";
  return <PublicFrame><main id="main" tabIndex={-1} className="welcome">
    <section className="introduction" aria-labelledby="welcome-title">
      <p className="eyebrow">A little room for your day</p>
      <h1 id="welcome-title">Student life,<br /><span>with space to breathe.</span></h1>
      <p className="lead">A calm place for your studies and the life around them. Bring your plans together, then take them one day at a time.</p>
      <a className="primary-link" href="#availability">View what’s available <span aria-hidden="true">↗</span></a>
      <p className="preview-note">{enabled ? "Google sign-in is enabled in this environment." : "An early foundation. No account or personal data is created in this preview."}</p>
      {process.env.NODE_ENV === "development" && <Link className="preview-entry" href="/dev/shell">Explore the synthetic workspace preview →</Link>}
    </section>
    <section id="availability" className="availability" aria-labelledby="availability-title">
      <div className="status-line"><span aria-hidden="true" className="status-dot" />Foundation running</div>
      <h2 id="availability-title">A place to begin.</h2>
      <p>The application is running locally. Your student workspace will become available as its features are built.</p>
      <dl className="availability-list">
        <div><dt>Google sign-in</dt><dd>{enabled ? "Configured" : "Setup required"}</dd></div>
        <div><dt>Private data storage</dt><dd>{enabled ? "Encrypted account storage" : "Not connected yet"}</dd></div>
        <div><dt>Planning &amp; insights</dt><dd>Coming in later builds</dd></div>
      </dl>
      <p className="availability-help">{enabled ? "Connect your Google account to begin." : "Sign-in opens after this environment’s Google and private storage setup."}</p>
      <Link className="primary-link" href="/signin">{enabled ? "Sign in with Google" : "View sign-in status"}</Link>
      {!enabled && <SignInInfo />}
    </section>
    <section className="product-outline" aria-labelledby="outline-title">
      <h2 id="outline-title">Designed around the whole of your day.</h2>
      <ul aria-label="Planned areas of student life"><li>Study</li><li>Fitness</li><li>Relationships</li><li>Finance</li><li>Your own domains</li></ul>
      <p>College topics, independent study, and personal plans — each with its own space, brought together in Today.</p>
    </section>
  </main></PublicFrame>;
}
