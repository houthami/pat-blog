"use client"

import type React from "react"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { ChefHat, Loader2 } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    console.log("[v0] Login attempt started")

    try {
      const testResponse = await fetch("/api/test")
      const testData = await testResponse.json()
      console.log("[v0] Test API response:", testData)

      console.log("[v0] Attempting NextAuth signIn")
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      console.log("[v0] NextAuth result:", result)

      if (result?.error) {
        console.log("[v0] NextAuth error:", result.error)
        setError("Invalid email or password")
      } else if (result?.ok) {
        console.log("[v0] Login successful, redirecting...")
        // Let middleware handle role-based redirects
        // Force page reload to trigger middleware redirect logic
        window.location.href = "/"
      } else {
        console.log("[v0] Unexpected result:", result)
        setError("Login failed - unexpected response")
      }
    } catch (error) {
      console.error("[v0] Login error:", error)
      setError(`An error occurred: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const testAPI = async () => {
    try {
      const response = await fetch("/api/test")
      const data = await response.json()
      console.log("[v0] API Test successful:", data)
      alert("API Test successful - check console")
    } catch (error) {
      console.error("[v0] API Test failed:", error)
      alert("API Test failed - check console")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-primary/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-border/50 backdrop-blur-sm">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-secondary rounded-full flex items-center justify-center">
              <ChefHat className="w-8 h-8 text-secondary-foreground" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-balance">Pastry Blog Admin</CardTitle>
              <CardDescription className="text-muted-foreground">
                Sign in to manage your delicious recipes
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4 p-3 bg-muted/50 rounded-md border">
              <p className="text-sm font-medium mb-2">Test Credentials:</p>
              <div className="text-xs space-y-1">
                <div><strong>Admin:</strong> admin@pastry.com / Admin123!</div>
                <div><strong>Editor:</strong> editor@pastry.com / Editor123!</div>
                <div><strong>Viewer:</strong> viewer@pastry.com / Viewer123!</div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@pastry.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-input border-border focus:ring-ring"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-input border-border focus:ring-ring"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                />
                <Label htmlFor="remember" className="text-sm text-muted-foreground">
                  Remember me
                </Label>
              </div>
              {error && (
                <div className="text-destructive text-sm text-center bg-destructive/10 p-2 rounded-md">{error}</div>
              )}
              <Button
                type="submit"
                className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
