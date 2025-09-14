"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { VisitorUpgradePrompt } from "@/components/visitor-upgrade-prompt"
import {
  Heart,
  MessageCircle,
  Share2,
  BookmarkPlus,
  Clock,
  Users,
  ChefHat,
  ArrowLeft,
  Star,
  Timer
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface Recipe {
  id: string
  title: string
  description: string
  ingredients: string
  instructions: string
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

export default function RecipeDetailPage() {
  const { data: session } = useSession()
  const params = useParams()
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [loading, setLoading] = useState(true)
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)
  const [upgradeAction, setUpgradeAction] = useState("")

  useEffect(() => {
    if (params.id) {
      fetchRecipe(params.id as string)
    }
  }, [params.id])

  const fetchRecipe = async (id: string) => {
    try {
      const response = await fetch(`/api/recipes/${id}/public`)
      if (response.ok) {
        const data = await response.json()
        setRecipe(data)
      }
    } catch (error) {
      console.error('Failed to fetch recipe:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInteraction = (action: string) => {
    if (!session) {
      window.location.href = '/login'
      return
    }

    if (session.user.role === 'VISITOR') {
      setUpgradeAction(action)
      setShowUpgradePrompt(true)
      return
    }

    console.log(`${action} clicked`)
  }

  if (showUpgradePrompt) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <VisitorUpgradePrompt
          action={`${upgradeAction} this recipe`}
          onUpgrade={() => setShowUpgradePrompt(false)}
        />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3 mb-6"></div>
            <div className="h-64 bg-muted rounded mb-6"></div>
            <div className="h-6 bg-muted rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!recipe) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center">
          <ChefHat className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Recipe not found</h3>
          <p className="text-muted-foreground mb-4">
            The recipe you're looking for doesn't exist.
          </p>
          <Link href="/feed">
            <Button>Back to Feed</Button>
          </Link>
        </Card>
      </div>
    )
  }

  const ingredients = JSON.parse(recipe.ingredients || '[]')
  const instructions = JSON.parse(recipe.instructions || '[]')

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/feed">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <h1 className="text-xl font-bold">Recipe Details</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recipe Image */}
            {recipe.imageUrl && (
              <div className="relative h-96 rounded-lg overflow-hidden bg-muted">
                <Image
                  src={recipe.imageUrl}
                  alt={recipe.title}
                  fill
                  className="object-cover"
                />
              </div>
            )}

            {/* Recipe Header */}
            <div>
              <h1 className="text-3xl font-bold mb-4">{recipe.title}</h1>
              <p className="text-muted-foreground text-lg leading-relaxed">
                {recipe.description}
              </p>
            </div>

            {/* Author Info */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={recipe.author.image || undefined} />
                    <AvatarFallback>
                      <ChefHat className="w-6 h-6" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{recipe.author.name}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(recipe.createdAt).toLocaleDateString()}
                      </div>
                      {recipe._count && (
                        <>
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {recipe._count.views} views
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3" />
                            {recipe._count.interactions} interactions
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Ingredients */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ChefHat className="w-5 h-5" />
                  Ingredients
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {ingredients.map((ingredient: string, index: number) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                      <span>{ingredient}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Instructions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Timer className="w-5 h-5" />
                  Instructions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-4">
                  {instructions.map((instruction: string, index: number) => (
                    <li key={index} className="flex gap-4">
                      <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center flex-shrink-0 mt-1">
                        {index + 1}
                      </div>
                      <p className="leading-relaxed">{instruction}</p>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Action Buttons */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-medium mb-4">Recipe Actions</h3>
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleInteraction('like')}
                  >
                    <Heart className="w-4 h-4 mr-3" />
                    Like Recipe
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleInteraction('save')}
                  >
                    <BookmarkPlus className="w-4 h-4 mr-3" />
                    Save Recipe
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleInteraction('share')}
                  >
                    <Share2 className="w-4 h-4 mr-3" />
                    Share Recipe
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Comments Section */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-medium mb-4">Comments</h3>
                <div className="text-center py-8 text-muted-foreground">
                  <MessageCircle className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">No comments yet</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => handleInteraction('comment')}
                  >
                    Be the first to comment
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Visitor Upgrade Prompt */}
            {session?.user.role === 'VISITOR' && (
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Heart className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-medium mb-2">Love this recipe?</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Upgrade your account to like, save, and comment on recipes
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
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}