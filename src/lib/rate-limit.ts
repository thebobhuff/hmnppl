const rateLimit = new Map<string, { count: number; expiresAt: number }>();

export function checkRateLimit(ip: string, limit: number, windowMs: number) {
  const now = Date.now();
  const current = rateLimit.get(ip);
  if (!current || now > current.expiresAt) {
    rateLimit.set(ip, { count: 1, expiresAt: now + windowMs });
    return { success: true, remaining: limit - 1 };
  }
  if (current.count >= limit) {
    return { success: false, remaining: 0 };
  }
  current.count++;
  return { success: true, remaining: limit - current.count };
}
