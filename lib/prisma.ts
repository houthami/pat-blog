import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

prisma
  .$connect()
  .then(() => {
    console.log("[v0] Prisma connected to database successfully")
  })
  .catch((error) => {
    console.error("[v0] Failed to connect to database:", error)
  })
