"use client"

import React, { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { VisitorUpgradePrompt } from "@/components/visitor-upgrade-prompt"
import {
  Heart,
  MessageCircle,
  Share2,
  BookmarkPlus,
  Clock,
  Users,
  ChefHat,
  Eye,
  X,
  ThumbsUp,
  ThumbsDown
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { hasRecentDonation, getDaysUntilNextPrompt } from "@/lib/donation-tracker"

interface Recipe {
  id: string
  title: string
  description: string
  imageUrl: string | null
  createdAt: string
  author: {
    name: string
    image: string | null
  }
  _count?: {
    views: number
    interactions: number
  }
}

export default function RecipeFeedPage() {
  const { data: session } = useSession()
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)
  const [upgradeAction, setUpgradeAction] = useState("")
  const [showDonationBanner, setShowDonationBanner] = useState(false)
  const [hasRecentlyDonated, setHasRecentlyDonated] = useState(false)
  const [redirectMessage, setRedirectMessage] = useState("")
  const [interactions, setInteractions] = useState<Record<string, any>>({})
  const [comments, setComments] = useState<Record<string, any>>({})
  const [showCommentModal, setShowCommentModal] = useState<{ recipeId: string; title: string } | null>(null)

  useEffect(() => {
    fetchRecipes()
    // Check if user has donated recently
    setHasRecentlyDonated(hasRecentDonation())

    // Check for redirect messages
    const params = new URLSearchParams(window.location.search)
    const message = params.get('message')
    if (message === 'dashboard-access-denied') {
      setRedirectMessage('Dashboard access is restricted to content creators only.')
    } else if (message === 'insufficient-permissions') {
      setRedirectMessage('You do not have sufficient permissions to access that page.')
    }

    // Clear the message from URL
    if (message) {
      const newUrl = window.location.pathname
      window.history.replaceState(null, '', newUrl)
    }
  }, [])

  const fetchRecipes = async () => {
    try {
      console.log('Fetching recipes...')
      const response = await fetch('/api/recipes/public')
      if (response.ok) {
        const data = await response.json()
        const recipeList = data.recipes || []
        console.log('Fetched recipes:', recipeList.length)
        setRecipes(recipeList)

        // Fetch interactions for each recipe (even without session for counts)
        if (recipeList.length > 0) {
          console.log('Fetching interactions for recipes...')
          fetchInteractionsForRecipes(recipeList)
        }
      } else {
        console.error('Failed to fetch recipes, status:', response.status)
      }
    } catch (error) {
      console.error('Failed to fetch recipes:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchInteractionsForRecipes = async (recipeList: Recipe[]) => {
    for (const recipe of recipeList) {
      try {
        const response = await fetch(`/api/recipes/${recipe.id}/interactions`)
        if (response.ok) {
          const data = await response.json()
          setInteractions(prev => ({
            ...prev,
            [recipe.id]: data
          }))
        }
      } catch (error) {
        console.error(`Failed to fetch interactions for recipe ${recipe.id}:`, error)
      }
    }
  }

  const handleInteraction = async (recipeId: string, action: string) => {
    console.log('handleInteraction called:', { recipeId, action, sessionExists: !!session })

    if (!session) {
      // Redirect to login for anonymous users
      console.log('No session, redirecting to login')
      window.location.href = '/login'
      return
    }

    if (action === 'comment') {
      // Open comment modal
      const recipe = recipes.find(r => r.id === recipeId)
      setShowCommentModal({ recipeId, title: recipe?.title || 'Recipe' })
      return
    }

    try {
      const response = await fetch(`/api/recipes/${recipeId}/interactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: action })
      })

      if (response.ok) {
        const result = await response.json()

        // Refresh interactions for this recipe
        const interactionResponse = await fetch(`/api/recipes/${recipeId}/interactions`)
        if (interactionResponse.ok) {
          const data = await interactionResponse.json()
          setInteractions(prev => ({
            ...prev,
            [recipeId]: data
          }))
        }

        console.log(`${action} ${result.action} for recipe ${recipeId}`)
      }
    } catch (error) {
      console.error(`Failed to ${action}:`, error)
    }
  }

  if (showUpgradePrompt) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <VisitorUpgradePrompt
          action={`${upgradeAction} recipes`}
          onUpgrade={() => setShowUpgradePrompt(false)}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <ChefHat className="w-5 h-5 text-primary" />
              </div>
              <h1 className="text-xl font-bold">Recipe Feed</h1>
            </div>
            <div className="flex items-center gap-2">
              {session?.user && (
                <Badge variant="default">
                  <Eye className="w-3 h-3 mr-1" />
                  {session.user.role}
                </Badge>
              )}
              {session?.user && ['ADMIN', 'EDITOR'].includes(session.user.role) && (
                <Link href="/dashboard">
                  <Button variant="outline" size="sm">
                    Dashboard
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Redirect Message */}
      {redirectMessage && (
        <div className="max-w-2xl mx-auto px-4 pt-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <p className="text-yellow-800 text-sm">{redirectMessage}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRedirectMessage("")}
                className="text-yellow-600 hover:text-yellow-800"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Feed */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {loading ? (
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <div className="animate-pulse">
                  <div className="h-64 bg-muted"></div>
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {recipes.length === 0 ? (
              <Card className="p-8 text-center">
                <ChefHat className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No recipes yet</h3>
                <p className="text-muted-foreground">
                  Be the first to share a delicious recipe!
                </p>
              </Card>
            ) : (
              recipes.map((recipe) => (
                <Card key={recipe.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  {/* Recipe Image */}
                  {recipe.imageUrl && (
                    <div className="relative h-64 bg-muted">
                      <Image
                        src={recipe.imageUrl}
                        alt={recipe.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}

                  <CardContent className="p-0">
                    {/* Author Info */}
                    <div className="flex items-center gap-3 p-4 pb-2">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={recipe.author.image || undefined} />
                        <AvatarFallback>
                          <ChefHat className="w-5 h-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{recipe.author.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {new Date(recipe.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    {/* Recipe Content */}
                    <div className="px-4 pb-2">
                      <Link href={`/recipe/${recipe.id}`}>
                        <h3 className="font-bold text-lg mb-2 hover:text-primary cursor-pointer">
                          {recipe.title}
                        </h3>
                      </Link>
                      <p className="text-muted-foreground text-sm line-clamp-2">
                        {recipe.description}
                      </p>
                    </div>

                    {/* Stats */}
                    {recipe._count && (
                      <div className="px-4 pb-2">
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {recipe._count.views} views
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {recipe._count.interactions} interactions
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between p-4 pt-2 border-t">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            console.log('Like button clicked for recipe:', recipe.id)
                            handleInteraction(recipe.id, 'like')
                          }}
                          className={`cursor-pointer ${
                            interactions[recipe.id]?.userInteractions?.includes('like')
                              ? 'text-red-500 bg-red-50 hover:bg-red-100'
                              : 'text-muted-foreground hover:text-red-500'
                          }`}
                        >
                          <ThumbsUp className="w-4 h-4 mr-1 pointer-events-none" />
                          <span className="pointer-events-none">{interactions[recipe.id]?.counts?.likes || 0}</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            console.log('Dislike button clicked for recipe:', recipe.id)
                            handleInteraction(recipe.id, 'dislike')
                          }}
                          className={`cursor-pointer ${
                            interactions[recipe.id]?.userInteractions?.includes('dislike')
                              ? 'text-red-500 bg-red-50 hover:bg-red-100'
                              : 'text-muted-foreground hover:text-red-500'
                          }`}
                        >
                          <ThumbsDown className="w-4 h-4 mr-1 pointer-events-none" />
                          <span className="pointer-events-none">{interactions[recipe.id]?.counts?.dislikes || 0}</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleInteraction(recipe.id, 'comment')}
                          className="text-muted-foreground hover:text-blue-500"
                        >
                          <MessageCircle className="w-4 h-4 mr-1" />
                          Comment
                        </Button>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleInteraction(recipe.id, 'save')}
                          className={`${
                            interactions[recipe.id]?.userInteractions?.includes('save')
                              ? 'text-green-500 bg-green-50 hover:bg-green-100'
                              : 'text-muted-foreground hover:text-green-500'
                          }`}
                        >
                          <BookmarkPlus className="w-4 h-4 mr-1" />
                          {interactions[recipe.id]?.userInteractions?.includes('save') ? 'Saved' : 'Save'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleInteraction(recipe.id, 'share')}
                          className="text-muted-foreground hover:text-primary"
                        >
                          <Share2 className="w-4 h-4 mr-1" />
                          Share
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>

      {/* Donation Banner for All Users */}
      {!showDonationBanner && !hasRecentlyDonated && (
        <div className="fixed bottom-0 left-0 right-0 bg-primary text-primary-foreground p-4 z-50">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <div className="flex-1">
              <p className="font-medium">Love what you see?</p>
              <p className="text-sm opacity-90">Support us to keep creating amazing recipes</p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/donate">
                <Button variant="secondary">
                  Donate
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowDonationBanner(true)}
                className="text-primary-foreground hover:bg-primary-foreground/20"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Thank You Message for Recent Donors */}
      {hasRecentlyDonated && (
        <div className="fixed bottom-0 left-0 right-0 bg-green-600 text-white p-4 z-50">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <div className="flex-1 flex items-center gap-3">
              <Heart className="w-5 h-5 fill-current" />
              <div>
                <p className="font-medium">Thank you for your support! 💚</p>
                <p className="text-sm opacity-90">
                  Your donation helps us create amazing recipes. Next ask in {getDaysUntilNextPrompt()} days.
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setHasRecentlyDonated(false)}
              className="text-white hover:bg-white/20"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Comment Modal */}
      {showCommentModal && (
        <CommentModal
          recipeId={showCommentModal.recipeId}
          recipeTitle={showCommentModal.title}
          onClose={() => setShowCommentModal(null)}
        />
      )}
    </div>
  )
}

// Comment Modal Component
function CommentModal({
  recipeId,
  recipeTitle,
  onClose
}: {
  recipeId: string
  recipeTitle: string
  onClose: () => void
}) {
  const [comment, setComment] = useState('')
  const [rating, setRating] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim()) return

    setSubmitting(true)
    try {
      const response = await fetch(`/api/recipes/${recipeId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: comment.trim(), rating })
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Comment submitted:', result.message)
        onClose()
      }
    } catch (error) {
      console.error('Failed to submit comment:', error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Comment on "{recipeTitle}"</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Your Comment</label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your thoughts about this recipe..."
              rows={4}
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Rating (Optional)</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(rating === star ? null : star)}
                  className={`text-2xl transition-colors ${
                    rating && star <= rating
                      ? 'text-yellow-400 hover:text-yellow-500'
                      : 'text-gray-300 hover:text-yellow-300'
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || !comment.trim()}>
              {submitting ? 'Submitting...' : 'Submit Comment'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}