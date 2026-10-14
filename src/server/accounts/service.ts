import "server-only";
import { z } from "zod";
import { requireSessionClaims } from "../auth/session.ts";
import { withAccounts } from "./context.ts";

const accountDto = z.object({ id: z.uuid(), onboardingState: z.enum(["pending", "complete"]), discoverable: z.boolean(), shareMetrics: z.boolean() }).strict();

export async function getOwnAccount() {
  const claims = await requireSessionClaims();
  return withAccounts(async accounts => {
    const user = await accounts.requireAccount(claims);
    return accountDto.parse({ id: user._id, onboardingState: user.onboardingState, discoverable: user.discoverable, shareMetrics: user.shareMetrics });
  });
}

export async function logoutAllSessions() {
  const claims = await requireSessionClaims();
  await withAccounts(accounts => accounts.logoutAll(claims));
}
