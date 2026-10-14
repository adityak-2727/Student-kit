import "server-only";
import type { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { getIntegrationEnvironment } from "../config/environment.ts";
import { withAccounts } from "../accounts/context.ts";
import { accountCallbacks } from "./callbacks.ts";

export function getAuthOptions(): AuthOptions {
  const environment = getIntegrationEnvironment();
  process.env.NEXTAUTH_URL = environment.APP_ORIGIN;
  return {
    secret: environment.AUTH_SECRET,
    providers: [GoogleProvider({
      clientId: environment.AUTH_GOOGLE_ID, clientSecret: environment.AUTH_GOOGLE_SECRET,
      authorization: { params: { scope: "openid email profile", access_type: "online" } },
      checks: ["pkce", "state", "nonce"],
    })],
    session: { strategy: "jwt", maxAge: 7 * 86_400 }, jwt: { maxAge: 7 * 86_400 },
    useSecureCookies: environment.APP_ORIGIN.startsWith("https://"),
    pages: { signIn: "/signin", error: "/signin" },
    callbacks: accountCallbacks(environment.APP_ORIGIN, {
      signIn: identity => withAccounts(accounts => accounts.signIn(identity)),
      validate: claims => withAccounts(accounts => accounts.requireAccount(claims)),
    }),
    // Library metadata can contain tokens, callback query parameters and raw provider/DB errors.
    // Fixed messages only; infrastructure observability must not capture request bodies/URLs.
    logger: { error() { console.error("Authentication request failed."); }, warn() { console.warn("Authentication configuration needs attention."); }, debug() {} },
    debug: false,
  };
}
