// Simple in-memory rate limiter
// Limite : 5 tentatives par IP toutes les 15 minutes
const attempts = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const window = 15 * 60 * 1000; // 15 min
  const maxAttempts = 5;

  const record = attempts.get(ip);
  if (!record || now > record.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + window });
    return { allowed: true };
  }

  if (record.count >= maxAttempts) {
    return { allowed: false, retryAfter: Math.ceil((record.resetAt - now) / 1000) };
  }

  record.count++;
  return { allowed: true };
}
