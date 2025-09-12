import NextAuth, { type NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

const authOptions: NextAuthOptions = {
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
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET || "dev-secret-key",
  debug: true,
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
