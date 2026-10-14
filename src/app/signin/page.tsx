import Link from "next/link";
import { PublicFrame } from "@/components/layout/public-frame";
import { GoogleSignIn } from "@/components/layout/account-actions";
import { getRuntimeEnvironment } from "@/server/config/environment";
import { signInErrorMessage } from "@/server/http/request-policy";

export const metadata = { title: "Sign in" };
export default async function SignInPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const enabled = getRuntimeEnvironment().APP_MODE === "live";
  const error = (await searchParams).error;
  return <PublicFrame><main id="main" tabIndex={-1} className="account-page"><section className="account-panel" aria-labelledby="signin-title">
    <p className="eyebrow">Welcome to Daylight</p><h1 id="signin-title">A little room<br />for your day.</h1>
    <p className="lead">Sign in with Google to keep your student workspace in one place.</p>
    {error && <p className="account-message" role="alert">{signInErrorMessage(error)}</p>}
    {enabled ? <><GoogleSignIn /><p className="preview-note">Your Google name and email stay private. Discovery and sharing start off.</p></> : <div className="account-message"><h2>Sign-in needs setup</h2><p>This environment has account integration disabled. No account is created here. The administrator needs to configure Google sign-in and private storage before enabling it.</p></div>}
    <p className="account-help">Private account content is encrypted before storage. The application server can decrypt it when you are authorized.</p>
    <Link className="text-link" href="/">Back to Daylight</Link>
  </section></main></PublicFrame>;
}
