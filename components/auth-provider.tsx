"use client"

import type React from "react"
import { SessionProvider } from "next-auth/react"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider
      // Remove session prop to let NextAuth handle it automatically
      refetchInterval={0} // Disable automatic refetching for now
      refetchOnWindowFocus={false} // Disable refetch on focus for testing
    >
      {children}
    </SessionProvider>
  )
}
