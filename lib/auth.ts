import { type NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log("[v0] Auth attempt for:", credentials?.email)

        if (credentials?.email === "admin@pastry.com" && credentials?.password === "admin123") {
          console.log("[v0] Auth successful")
          return {
            id: "1",
            email: "admin@pastry.com",
            name: "Admin User",
          }
        }

        console.log("[v0] Auth failed")
        return null
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Include user id in the token so it's available in session
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      // Include user id in the session so it's available in API routes
      if (token.id) {
        session.user.id = token.id as string
      }
      console.log("[v0] Session callback:", session)
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
  debug: true,
}