import { type NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "./prisma"
import { verifyPassword } from "./password"

export const authOptions: NextAuthOptions = {
  // Note: Don't use PrismaAdapter with CredentialsProvider
  // adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log('[AUTH] Login attempt for:', credentials?.email)

        if (!credentials?.email || !credentials?.password) {
          console.log('[AUTH] Missing credentials')
          return null
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email.toLowerCase() }
          })

          if (!user || !user.password) {
            console.log('[AUTH] User not found or no password:', !!user)
            return null
          }

          const isValidPassword = await verifyPassword(credentials.password, user.password)

          if (!isValidPassword) {
            console.log('[AUTH] Invalid password')
            return null
          }

          console.log('[AUTH] Login successful for:', user.email)

          // Update last login
          await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() }
          })

          // Log successful login
          await prisma.auditLog.create({
            data: {
              userId: user.id,
              action: 'LOGIN',
              success: true,
              details: { method: 'credentials' }
            }
          })

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          }
        } catch (error) {
          console.error("Auth error:", error)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Include user data in the token
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      // Include user data in the session
      if (token.id) {
        session.user.id = token.id as string
        session.user.role = token.role
      }
      return session
    },
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET || "dev-secret-key",
  debug: process.env.NODE_ENV === 'development',
}