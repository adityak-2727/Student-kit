import "server-only";
import { createHmac } from "node:crypto";
import type { Db } from "mongodb";
import { ServiceError } from "../http/errors.ts";

export async function consumeSignInLimit(db: Db, subject: string, hmacKey: string, now = new Date(), limit = 10) {
  const window = Math.floor(now.getTime() / 60_000);
  const key = createHmac("sha256", Buffer.from(hmacKey, "base64")).update(JSON.stringify(["sign-in", subject, window])).digest("hex");
  const bucket = await db.collection<{ _id: string; count: number; expiresAt: Date }>("rateLimitBuckets").findOneAndUpdate({ _id: key }, {
    $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date((window + 2) * 60_000) },
  }, { upsert: true, returnDocument: "after" });
  // Window forms part of the key: delayed TTL cleanup cannot reset or extend a window.
  if (!bucket || bucket.count > limit) throw new ServiceError("RATE_LIMITED", 429);
}
