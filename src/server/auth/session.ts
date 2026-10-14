import "server-only";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "./options.ts";
import { getRuntimeEnvironment } from "../config/environment.ts";
import { minimalSessionClaims } from "./identity.ts";
import { ServiceError } from "../http/errors.ts";

export async function requireSessionClaims() {
  if (getRuntimeEnvironment().APP_MODE !== "live") throw new ServiceError("UNAUTHENTICATED", 401);
  const session = await getServerSession(getAuthOptions());
  if (!session?.user) throw new ServiceError("UNAUTHENTICATED", 401);
  return minimalSessionClaims({ userId: session.user.id, sessionVersion: session.sessionVersion, authenticatedAt: session.authenticatedAt });
}
