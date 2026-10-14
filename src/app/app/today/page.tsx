import { redirect } from "next/navigation";
import { PublicFrame } from "@/components/layout/public-frame";
import { AccountActions } from "@/components/layout/account-actions";
import { getOwnAccount } from "@/server/accounts/service";
import { ServiceError } from "@/server/http/errors";

export const metadata = { title: "Your account" };
export default async function AccountHome() {
  try { await getOwnAccount(); }
  catch (error) { if (error instanceof ServiceError && error.status === 401) redirect("/signin?error=SessionRequired"); throw error; }
  return <PublicFrame><main id="main" tabIndex={-1} className="account-page"><section className="account-panel">
    <p className="eyebrow">Your private space</p><h1>Your account<br />is connected.</h1>
    <p className="lead">Your Google account has been saved securely. Profile setup and your student workspace are coming in the next build.</p>
    <p>Username discovery and score sharing are off. No study schedule, rewards, or activity is created by signing in.</p>
    <AccountActions />
  </section></main></PublicFrame>;
}
