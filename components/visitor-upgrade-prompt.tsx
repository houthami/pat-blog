"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { UserPlus, Heart, MessageCircle, BookmarkPlus, Star } from "lucide-react"

interface VisitorUpgradePromptProps {
  action?: string
  onUpgrade?: () => void
}

export function VisitorUpgradePrompt({ action = "perform this action", onUpgrade }: VisitorUpgradePromptProps) {
  const { data: session } = useSession()
  const [isUpgrading, setIsUpgrading] = useState(false)

  const handleUpgrade = async () => {
    setIsUpgrading(true)

    try {
      const response = await fetch('/api/auth/upgrade-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetRole: 'VIEWER' })
      })

      if (response.ok) {
        // Refresh session to get updated role
        window.location.reload()
        onUpgrade?.()
      } else {
        console.error('Upgrade failed')
      }
    } catch (error) {
      console.error('Upgrade error:', error)
    } finally {
      setIsUpgrading(false)
    }
  }

  if (!session || session.user.role !== 'VISITOR') {
    return null
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
          <UserPlus className="w-6 h-6 text-primary" />
        </div>
        <CardTitle className="text-lg">Upgrade Your Account</CardTitle>
        <CardDescription>
          You need a viewer account to {action}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <Badge variant="outline" className="mb-3">
            Current: Visitor Access
          </Badge>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-red-500" />
            <span>Like recipes</span>
          </div>
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-blue-500" />
            <span>Comment on recipes</span>
          </div>
          <div className="flex items-center gap-2">
            <BookmarkPlus className="w-4 h-4 text-green-500" />
            <span>Save favorite recipes</span>
          </div>
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-500" />
            <span>Rate and review</span>
          </div>
        </div>

        <Button
          onClick={handleUpgrade}
          disabled={isUpgrading}
          className="w-full"
        >
          {isUpgrading ? "Upgrading..." : "Upgrade to Viewer (Free)"}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Upgrading is free and takes just a moment
        </p>
      </CardContent>
    </Card>
  )
}