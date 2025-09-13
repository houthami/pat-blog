import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Fallback to memory storage if Redis not available
class MemoryStorage {
  private storage = new Map<string, { count: number; reset: number }>()

  async get(key: string) {
    const item = this.storage.get(key)
    if (!item || Date.now() > item.reset) {
      this.storage.delete(key)
      return null
    }
    return item
  }

  async set(key: string, value: { count: number; reset: number }) {
    this.storage.set(key, value)
  }

  async incr(key: string) {
    const item = this.storage.get(key)
    if (item) {
      item.count++
      return item.count
    }
    return 1
  }
}

// Initialize Redis or fallback to memory
const redis = process.env.REDIS_URL
  ? new Redis({ url: process.env.REDIS_URL })
  : new MemoryStorage() as any

// Rate limiter for login attempts
export const loginLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '15 m'), // 5 attempts per 15 minutes
  analytics: true,
})

// Rate limiter for registration
export const registerLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '1 h'), // 3 registrations per hour
  analytics: true,
})

// Rate limiter for password reset
export const passwordResetLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '1 h'), // 3 reset attempts per hour
  analytics: true,
})

// Rate limiter for general API requests
export const apiLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 requests per minute
  analytics: true,
})

export async function getRateLimitInfo(identifier: string, limiter: Ratelimit) {
  const { success, limit, reset, remaining } = await limiter.limit(identifier)

  return {
    success,
    limit,
    reset,
    remaining,
    headers: {
      'X-RateLimit-Limit': limit.toString(),
      'X-RateLimit-Remaining': remaining.toString(),
      'X-RateLimit-Reset': new Date(reset).toISOString(),
    }
  }
}