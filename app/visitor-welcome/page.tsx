"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Eye,
  Heart,
  MessageCircle,
  BookmarkPlus,
  Star,
  ArrowRight,
  ChefHat,
  UserPlus
} from "lucide-react"

export default function VisitorWelcomePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [isUpgrading, setIsUpgrading] = useState(false)

  // Redirect non-visitors
  if (session && session.user.role !== "VISITOR") {
    router.push("/dashboard")
    return null
  }

  const handleUpgrade = async () => {
    setIsUpgrading(true)

    try {
      const response = await fetch('/api/auth/upgrade-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetRole: 'VIEWER' })
      })

      if (response.ok) {
        // Refresh session and redirect to dashboard
        window.location.href = "/dashboard"
      } else {
        console.error('Upgrade failed')
      }
    } catch (error) {
      console.error('Upgrade error:', error)
    } finally {
      setIsUpgrading(false)
    }
  }

  const handleBrowseRecipes = () => {
    router.push("/recipes")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-primary/10 p-4">
      <div className="max-w-4xl mx-auto pt-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <ChefHat className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Welcome to Pastry Blog!</h1>
          <p className="text-muted-foreground">
            Welcome {session?.user?.name || 'Visitor'}! You're signed in with visitor access.
          </p>
          <Badge variant="outline" className="mt-2">
            <Eye className="w-3 h-3 mr-1" />
            Visitor Access
          </Badge>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* What You Can Do */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-green-500" />
                What You Can Do Now
              </CardTitle>
              <CardDescription>
                As a visitor, you have read-only access
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 p-2 rounded-md bg-green-50 dark:bg-green-950/20">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-sm">Browse all recipe blogs</span>
              </div>
              <div className="flex items-center gap-3 p-2 rounded-md bg-green-50 dark:bg-green-950/20">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-sm">View detailed recipes</span>
              </div>
              <div className="flex items-center gap-3 p-2 rounded-md bg-green-50 dark:bg-green-950/20">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-sm">Read cooking tips and guides</span>
              </div>

              <Button onClick={handleBrowseRecipes} className="w-full mt-4">
                <Eye className="w-4 h-4 mr-2" />
                Start Browsing Recipes
              </Button>
            </CardContent>
          </Card>

          {/* Upgrade Benefits */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-primary" />
                Upgrade to Viewer (Free)
              </CardTitle>
              <CardDescription>
                Unlock interactive features instantly
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 p-2 rounded-md bg-primary/5">
                <Heart className="w-4 h-4 text-red-500" />
                <span className="text-sm">Like your favorite recipes</span>
              </div>
              <div className="flex items-center gap-3 p-2 rounded-md bg-primary/5">
                <MessageCircle className="w-4 h-4 text-blue-500" />
                <span className="text-sm">Comment and ask questions</span>
              </div>
              <div className="flex items-center gap-3 p-2 rounded-md bg-primary/5">
                <BookmarkPlus className="w-4 h-4 text-green-500" />
                <span className="text-sm">Save recipes to favorites</span>
              </div>
              <div className="flex items-center gap-3 p-2 rounded-md bg-primary/5">
                <Star className="w-4 h-4 text-yellow-500" />
                <span className="text-sm">Rate and review recipes</span>
              </div>

              <Button
                onClick={handleUpgrade}
                disabled={isUpgrading}
                className="w-full mt-4"
                size="lg"
              >
                {isUpgrading ? (
                  "Upgrading..."
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Upgrade Now (Free)
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Features Comparison */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Access Levels Comparison</CardTitle>
            <CardDescription>
              See what each account type can do
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Feature</th>
                    <th className="text-center py-2">Visitor</th>
                    <th className="text-center py-2">Viewer</th>
                    <th className="text-center py-2">Editor</th>
                    <th className="text-center py-2">Admin</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-2">Browse Recipes</td>
                    <td className="text-center">✅</td>
                    <td className="text-center">✅</td>
                    <td className="text-center">✅</td>
                    <td className="text-center">✅</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">Like & Comment</td>
                    <td className="text-center">❌</td>
                    <td className="text-center">✅</td>
                    <td className="text-center">✅</td>
                    <td className="text-center">✅</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">Create Recipes</td>
                    <td className="text-center">❌</td>
                    <td className="text-center">❌</td>
                    <td className="text-center">✅</td>
                    <td className="text-center">✅</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">User Management</td>
                    <td className="text-center">❌</td>
                    <td className="text-center">❌</td>
                    <td className="text-center">❌</td>
                    <td className="text-center">✅</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}