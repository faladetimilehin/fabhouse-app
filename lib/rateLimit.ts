import mongoose, { Schema, Model } from "mongoose";
import { dbConnect } from "@/lib/mongodb";

/**
 * A tiny rate-limit log stored in MongoDB rather than in-memory.
 * In-memory counters don't work reliably on serverless (Vercel spins up
 * fresh function instances), so we just log each hit with a timestamp
 * and count recent ones. A TTL index cleans old entries automatically.
 */
interface IRateLimitHit {
  key: string; // e.g. "inquiry:203.0.113.4"
  createdAt: Date;
}

const RateLimitSchema = new Schema<IRateLimitHit>({
  key: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 60 * 60 }, // auto-delete after 1 hour
});
RateLimitSchema.index({ key: 1, createdAt: 1 });

const RateLimitHit: Model<IRateLimitHit> =
  (mongoose.models.RateLimitHit as Model<IRateLimitHit>) ||
  mongoose.model<IRateLimitHit>("RateLimitHit", RateLimitSchema);

interface RateLimitArgs {
  key: string; // unique bucket, e.g. `inquiry:${ip}`
  limit: number; // max hits allowed
  windowSeconds: number; // time window to count within
}

/**
 * Returns { allowed: true } and records the hit if under the limit,
 * or { allowed: false } without recording if over the limit.
 */
export async function checkRateLimit({ key, limit, windowSeconds }: RateLimitArgs): Promise<{ allowed: boolean }> {
  await dbConnect();

  const since = new Date(Date.now() - windowSeconds * 1000);
  const recentCount = await RateLimitHit.countDocuments({ key, createdAt: { $gte: since } });

  if (recentCount >= limit) {
    return { allowed: false };
  }

  await RateLimitHit.create({ key });
  return { allowed: true };
}

/** Best-effort client IP extraction behind Vercel/most proxies. */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
