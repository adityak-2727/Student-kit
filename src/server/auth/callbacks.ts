import "server-only";
import type { AuthOptions } from "next-auth";
import { minimalSessionClaims, verifiedGoogleIdentity, type SessionClaims } from "./identity.ts";
import type { IdentityPayload } from "../encryption/payloads.ts";

export function accountCallbacks(origin: string, dependencies: {
  signIn: (identity: IdentityPayload) => Promise<{ _id: string; sessionVersion: number }>;
  validate: (claims: SessionClaims) => Promise<unknown>;
}): NonNullable<AuthOptions["callbacks"]> {
  return {
    async signIn({ account, profile }) {
      try { if (account?.provider !== "google" || account.type !== "oauth") return false; verifiedGoogleIdentity(profile); return true; }
      catch { return false; }
    },
    async jwt({ token, account, profile }) {
      let claims: SessionClaims;
      if (account) {
        if (account.provider !== "google" || account.type !== "oauth") throw new Error("Sign-in unavailable.");
        const user = await dependencies.signIn(verifiedGoogleIdentity(profile));
        claims = { userId: user._id, sessionVersion: user.sessionVersion, authenticatedAt: Math.floor(Date.now() / 1000) };
      } else {
        claims = minimalSessionClaims(token);
        if (Date.now() / 1000 - claims.authenticatedAt > 7 * 86_400 || claims.authenticatedAt > Date.now() / 1000 + 15) return {};
        try { await dependencies.validate(claims); }
        catch { return {}; } // Revoked/unavailable accounts cannot keep a useful session.
      }
      // Never copy Google tokens/name/email/picture or a client-provided session update.
      return { ...claims };
    },
    async session({ session, token }) {
      try {
        const claims = minimalSessionClaims(token);
        await dependencies.validate(claims);
        return { expires: session.expires, user: { id: claims.userId }, sessionVersion: claims.sessionVersion, authenticatedAt: claims.authenticatedAt };
      } catch { return { expires: session.expires }; }
    },
    async redirect({ url }) { return url === "/signin" || url === `${origin}/signin` ? `${origin}/signin` : `${origin}/app/today`; },
  };
}
