"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Plus, Search, ChefHat, Clock, Edit } from "lucide-react"
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

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

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

  const filteredRecipes = recipes.filter(
    (recipe) =>
      recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recipe.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-balance">All Recipes</h1>
            <p className="text-muted-foreground">Manage and organize your recipe collection</p>
          </div>
          <Button asChild className="bg-secondary hover:bg-secondary/90 text-secondary-foreground">
            <Link href="/recipes/new">
              <Plus className="mr-2 h-4 w-4" />
              Create New Recipe
            </Link>
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search recipes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Recipes Grid */}
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
        ) : filteredRecipes.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <ChefHat className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <CardTitle className="mb-2">{searchTerm ? "No recipes found" : "No recipes yet"}</CardTitle>
              <CardDescription className="mb-4">
                {searchTerm
                  ? "Try adjusting your search terms"
                  : "Start creating your first delicious recipe to share with the world!"}
              </CardDescription>
              {!searchTerm && (
                <Button asChild className="bg-secondary hover:bg-secondary/90 text-secondary-foreground">
                  <Link href="/recipes/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Recipe
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecipes.map((recipe) => (
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
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="mr-1 h-3 w-3" />
                      {new Date(recipe.createdAt).toLocaleDateString()}
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/recipes/${recipe.id}/edit`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
