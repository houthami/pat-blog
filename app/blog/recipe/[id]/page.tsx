"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ChefHat, Clock, User, ArrowLeft, Share2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { AnalyticsTracker } from "@/components/analytics-tracker"

interface Recipe {
  id: string
  title: string
  description: string | null
  ingredients: string[]
  instructions: string[]
  imageUrl: string | null
  createdAt: string
  updatedAt: string
  author: {
    name: string | null
  }
}

export default function RecipeDetailPage() {
  const params = useParams()
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        const response = await fetch(`/api/blog/recipes/${params.id}`)
        if (response.ok) {
          const data = await response.json()
          setRecipe(data)
        } else if (response.status === 404) {
          setError("Recipe not found")
        } else {
          setError("Failed to load recipe")
        }
      } catch (error) {
        console.error("Failed to fetch recipe:", error)
        setError("Failed to load recipe")
      } finally {
        setIsLoading(false)
      }
    }

    if (params.id) {
      fetchRecipe()
    }
  }, [params.id])

  const handleShare = async () => {
    // Track the share interaction
    const trackShare = (method: string, success: boolean = true) => {
      const visitorId = localStorage.getItem("visitor-id") || crypto.randomUUID()
      localStorage.setItem("visitor-id", visitorId)

      fetch("/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipeId: params.id,
          visitorId,
          type: "interaction",
          interactionType: "share",
          interactionValue: `${method}_${success ? "success" : "fallback"}`
        })
      }).catch(console.error)
    }

    if (navigator.share && recipe) {
      try {
        await navigator.share({
          title: recipe.title,
          text: recipe.description || "Check out this delicious recipe!",
          url: window.location.href
        })
        trackShare("native_share", true)
      } catch (error) {
        // Fallback to copying to clipboard
        navigator.clipboard.writeText(window.location.href)
        trackShare("native_share", false)
      }
    } else {
      // Fallback to copying to clipboard
      navigator.clipboard.writeText(window.location.href)
      trackShare("clipboard", true)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3 mb-4" />
            <div className="h-64 bg-muted rounded mb-6" />
            <div className="h-4 bg-muted rounded w-2/3 mb-2" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !recipe) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Card className="text-center py-12">
            <CardContent>
              <ChefHat className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <CardTitle className="mb-2">{error || "Recipe not found"}</CardTitle>
              <CardDescription className="mb-4">
                The recipe you're looking for doesn't exist or has been removed.
              </CardDescription>
              <Button asChild>
                <Link href="/blog">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Blog
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Analytics Tracker */}
      <AnalyticsTracker recipeId={params.id as string} />
      
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" asChild>
              <Link href="/blog">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Blog
              </Link>
            </Button>
            <Button variant="outline" onClick={handleShare}>
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <article className="max-w-4xl mx-auto">
          {/* Recipe Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4">{recipe.title}</h1>
            <div className="flex items-center gap-4 text-muted-foreground mb-4">
              <div className="flex items-center">
                <User className="mr-1 h-4 w-4" />
                {recipe.author.name || "Admin"}
              </div>
              <div className="flex items-center">
                <Clock className="mr-1 h-4 w-4" />
                {new Date(recipe.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric"
                })}
              </div>
            </div>
            {recipe.description && (
              <p className="text-lg text-muted-foreground leading-relaxed">
                {recipe.description}
              </p>
            )}
          </div>

          {/* Recipe Image */}
          {recipe.imageUrl && (
            <div className="aspect-video mb-8 rounded-lg overflow-hidden">
              <Image
                src={recipe.imageUrl}
                alt={recipe.title}
                width={800}
                height={600}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Ingredients */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <ChefHat className="mr-2 h-5 w-5" />
                    Ingredients
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {recipe.ingredients.map((ingredient, index) => (
                      <li key={index} className="flex items-start">
                        <span className="inline-block w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0" />
                        <span>{ingredient}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Instructions */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Instructions</CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-4">
                    {recipe.instructions.map((instruction, index) => (
                      <li key={index} className="flex">
                        <Badge variant="outline" className="mr-4 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center">
                          {index + 1}
                        </Badge>
                        <div className="flex-1">
                          <p className="leading-relaxed">{instruction}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Recipe Meta */}
          <div className="mt-8 pt-8 border-t">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <p>
                Published on {new Date(recipe.createdAt).toLocaleDateString()}
                {recipe.createdAt !== recipe.updatedAt && (
                  <span> • Updated on {new Date(recipe.updatedAt).toLocaleDateString()}</span>
                )}
              </p>
              <Button variant="outline" asChild>
                <Link href="/blog">View More Recipes</Link>
              </Button>
            </div>
          </div>
        </article>
      </main>
    </div>
  )
}