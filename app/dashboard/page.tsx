"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, ChefHat, BookOpen, Clock, Eye } from "lucide-react"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"

interface Recipe {
  id: string
  title: string
  description: string | null
  published: boolean
  createdAt: string
  imageUrl: string | null
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        const response = await fetch("/api/recipes")
        if (response.ok) {
          const data = await response.json()
          setRecipes(data)
        }
      } catch (error) {
        console.error("Failed to fetch recipes:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchRecipes()
  }, [])

  const publishedCount = recipes.filter((recipe) => recipe.published).length
  const draftCount = recipes.filter((recipe) => !recipe.published).length

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-balance">Welcome back, {session?.user?.name || "Chef"}!</h1>
            <p className="text-muted-foreground">Manage your delicious recipes and blog content</p>
          </div>
          <Button asChild className="bg-secondary hover:bg-secondary/90 text-secondary-foreground">
            <Link href="/recipes/new">
              <Plus className="mr-2 h-4 w-4" />
              Create New Recipe
            </Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Recipes</CardTitle>
              <ChefHat className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{recipes.length}</div>
              <p className="text-xs text-muted-foreground">All your delicious creations</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Published</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{publishedCount}</div>
              <p className="text-xs text-muted-foreground">Live on your blog</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Drafts</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{draftCount}</div>
              <p className="text-xs text-muted-foreground">Work in progress</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Recipes */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold">Recent Recipes</h2>
            <Button variant="outline" asChild>
              <Link href="/recipes">View All</Link>
            </Button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-48 bg-muted rounded-t-lg" />
                  <CardHeader>
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : recipes.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <ChefHat className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <CardTitle className="mb-2">No recipes yet</CardTitle>
                <CardDescription className="mb-4">
                  Start creating your first delicious recipe to share with the world!
                </CardDescription>
                <Button asChild className="bg-secondary hover:bg-secondary/90 text-secondary-foreground">
                  <Link href="/recipes/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Recipe
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recipes.slice(0, 6).map((recipe) => (
                <Card key={recipe.id} className="group hover:shadow-lg transition-shadow">
                  <div className="aspect-video bg-muted rounded-t-lg overflow-hidden">
                    {recipe.imageUrl ? (
                      <img
                        src={recipe.imageUrl || "/placeholder.svg"}
                        alt={recipe.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ChefHat className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg line-clamp-2">{recipe.title}</CardTitle>
                      <Badge variant={recipe.published ? "default" : "secondary"}>
                        {recipe.published ? "Published" : "Draft"}
                      </Badge>
                    </div>
                    {recipe.description && (
                      <CardDescription className="line-clamp-2">{recipe.description}</CardDescription>
                    )}
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="mr-1 h-3 w-3" />
                      {new Date(recipe.createdAt).toLocaleDateString()}
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
