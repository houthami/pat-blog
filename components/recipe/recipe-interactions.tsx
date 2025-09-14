"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ThumbsUp, ThumbsDown, BookmarkPlus, Share2, Heart } from "lucide-react"
import { VisitorUpgradePrompt } from "@/components/visitor-upgrade-prompt"
import { toast } from "sonner"

interface InteractionData {
  counts: {
    likes: number
    dislikes: number
    saves: number
    shares: number
  }
  userInteractions: string[]
}

interface RecipeInteractionsProps {
  recipeId: string
  userRole?: string
  isAuthenticated: boolean
}

export function RecipeInteractions({
  recipeId,
  userRole,
  isAuthenticated
}: RecipeInteractionsProps) {
  const [interactions, setInteractions] = useState<InteractionData | null>(null)
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)
  const [upgradeAction, setUpgradeAction] = useState("")

  const isVisitor = userRole === 'VISITOR'

  useEffect(() => {
    fetchInteractions()
  }, [recipeId])

  const fetchInteractions = async () => {
    try {
      const response = await fetch(`/api/recipes/${recipeId}/interactions`)
      if (response.ok) {
        const data = await response.json()
        setInteractions(data)
      }
    } catch (error) {
      console.error('Failed to fetch interactions:', error)
    }
  }

  const handleInteraction = async (type: string) => {
    if (!isAuthenticated) {
      window.location.href = '/login'
      return
    }

    if (isVisitor) {
      setUpgradeAction(type)
      setShowUpgradePrompt(true)
      return
    }

    try {
      const response = await fetch(`/api/recipes/${recipeId}/interactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      })

      if (response.ok) {
        const result = await response.json()
        toast.success(result.message || `${type} recorded`)

        // Refresh interactions
        await fetchInteractions()
      } else {
        toast.error('Failed to record interaction')
      }
    } catch (error) {
      console.error(`Error handling ${type}:`, error)
      toast.error('Something went wrong')
    }
  }

  const handleShare = async () => {
    const url = window.location.href

    // Track share interaction if authenticated
    if (isAuthenticated && !isVisitor) {
      handleInteraction('share')
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: document.title,
          url: url
        })
      } catch (error) {
        // Fallback to clipboard
        navigator.clipboard.writeText(url)
        toast.success('Recipe URL copied to clipboard')
      }
    } else {
      navigator.clipboard.writeText(url)
      toast.success('Recipe URL copied to clipboard')
    }
  }

  if (showUpgradePrompt) {
    return (
      <VisitorUpgradePrompt
        action={`${upgradeAction} recipes`}
        onUpgrade={() => setShowUpgradePrompt(false)}
      />
    )
  }

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="font-medium mb-4">Recipe Actions</h3>

        <div className="space-y-3">
          {/* Like Button */}
          <Button
            variant="outline"
            className={`w-full justify-start ${
              interactions?.userInteractions?.includes('like')
                ? 'text-red-600 bg-red-50 border-red-200'
                : ''
            }`}
            onClick={() => handleInteraction('like')}
          >
            <ThumbsUp className="mr-3 h-4 w-4" />
            Like Recipe
            {interactions && (
              <span className="ml-auto text-sm">
                {interactions.counts.likes}
              </span>
            )}
          </Button>

          {/* Dislike Button */}
          <Button
            variant="outline"
            className={`w-full justify-start ${
              interactions?.userInteractions?.includes('dislike')
                ? 'text-blue-600 bg-blue-50 border-blue-200'
                : ''
            }`}
            onClick={() => handleInteraction('dislike')}
          >
            <ThumbsDown className="mr-3 h-4 w-4" />
            Dislike Recipe
            {interactions && (
              <span className="ml-auto text-sm">
                {interactions.counts.dislikes}
              </span>
            )}
          </Button>

          {/* Save Button */}
          <Button
            variant="outline"
            className={`w-full justify-start ${
              interactions?.userInteractions?.includes('save')
                ? 'text-green-600 bg-green-50 border-green-200'
                : ''
            }`}
            onClick={() => handleInteraction('save')}
          >
            <BookmarkPlus className="mr-3 h-4 w-4" />
            {interactions?.userInteractions?.includes('save') ? 'Saved' : 'Save Recipe'}
            {interactions && (
              <span className="ml-auto text-sm">
                {interactions.counts.saves}
              </span>
            )}
          </Button>

          {/* Share Button */}
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={handleShare}
          >
            <Share2 className="mr-3 h-4 w-4" />
            Share Recipe
            {interactions && (
              <span className="ml-auto text-sm">
                {interactions.counts.shares}
              </span>
            )}
          </Button>
        </div>

        {/* Visitor Upgrade Prompt */}
        {isVisitor && (
          <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg text-center">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Heart className="w-5 h-5 text-primary" />
            </div>
            <h4 className="font-medium mb-2">Love this recipe?</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Upgrade your account to interact with recipes
            </p>
            <Button
              size="sm"
              onClick={() => {
                setUpgradeAction('interact with')
                setShowUpgradePrompt(true)
              }}
            >
              Upgrade Free
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}