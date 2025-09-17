import { PrismaClient } from "@prisma/client"

// Validate required environment variables
if (!process.env.DATABASE_URL) {
  console.error("[v0] DATABASE_URL environment variable is required")
  if (process.env.NODE_ENV === "production") {
    throw new Error("DATABASE_URL environment variable is required for production")
  }
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

// Only attempt connection if DATABASE_URL is available
if (process.env.DATABASE_URL) {
  prisma
    .$connect()
    .then(() => {
      console.log("[v0] Prisma connected to database successfully")
    })
    .catch((error) => {
      console.error("[v0] Failed to connect to database:", error)
      if (process.env.NODE_ENV === "production") {
        console.error("[v0] Database connection failed in production. Check DATABASE_URL environment variable.")
      }
    })
} else {
  console.warn("[v0] Skipping database connection - DATABASE_URL not set")
}
