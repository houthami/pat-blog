"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { RecipeCardSkeleton, PageLoading } from "@/components/ui/loading-states"
import { ErrorState, NetworkError } from "@/components/ui/error-states"
import { ChefHat, Clock, Search, User, Heart, MessageCircle, Eye, Star, BookmarkPlus, Tag } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useSession } from "next-auth/react"
import { AnonymousUserBanner } from "@/components/anonymous/progressive-registration"

interface Category {
  id: string
  name: string
  slug: string
  color: string
  icon?: string
}

interface Recipe {
  id: string
  title: string
  description: string | null
  imageUrl: string | null
  createdAt: string
  author: {
    name: string | null
  }
  _count?: {
    interactions: number
    views: number
    comments: number
  }
  averageRating?: number
  category?: Category
}

interface ApiResponse {
  recipes: Recipe[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export default function BlogPage() {
  const { data: session } = useSession()
  const [data, setData] = useState<ApiResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

  const isAnonymous = !session?.user

  const fetchRecipes = async (page = 1, search = "") => {
    setIsLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "6",
        ...(search && { search })
      })

      const response = await fetch(`/api/blog/recipes?${params}`)
      if (response.ok) {
        const result = await response.json()
        setData(result)
      } else {
        throw new Error(`Failed to fetch recipes: ${response.status}`)
      }
    } catch (error) {
      console.error("Failed to fetch recipes:", error)
      setError(error instanceof Error ? error.message : "Failed to fetch recipes")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchRecipes(currentPage, searchTerm)
  }, [currentPage, searchTerm])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchRecipes(1, searchTerm)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Anonymous User Banner */}
      {isAnonymous && <AnonymousUserBanner />}

      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <Link href="/blog" className="flex items-center gap-2">
                <ChefHat className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-bold">Pastry Blog</h1>
              </Link>
              <p className="text-muted-foreground mt-2">
                Delicious recipes and baking inspiration
              </p>
            </div>
            
            {/* Search */}
            <form onSubmit={handleSearch} className="flex gap-2 max-w-sm" role="search" aria-label="Search recipes">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" aria-hidden="true" />
                <Input
                  placeholder="Search recipes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  aria-label="Search recipes by title or description"
                  id="recipe-search"
                />
              </div>
              <Button type="submit" aria-describedby="recipe-search">Search</Button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {error ? (
          <NetworkError onRetry={() => fetchRecipes(currentPage, searchTerm)} />
        ) : isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <RecipeCardSkeleton key={i} />
            ))}
          </div>
        ) : !data?.recipes.length ? (
          <Card className="text-center py-12">
            <CardContent>
              <ChefHat className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <CardTitle className="mb-2">No recipes found</CardTitle>
              <CardDescription>
                {searchTerm ? "Try adjusting your search terms" : "Check back soon for delicious recipes!"}
              </CardDescription>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Results Info */}
            <div className="flex justify-between items-center mb-6">
              <p className="text-muted-foreground">
                Showing {data.recipes.length} of {data.pagination.total} recipes
                {searchTerm && ` for "${searchTerm}"`}
              </p>
              <Badge variant="outline">
                Page {data.pagination.page} of {data.pagination.pages}
              </Badge>
            </div>

            {/* Recipe Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8" role="main" aria-label="Recipe collection">
              {data.recipes.map((recipe) => (
                <Card key={recipe.id} className="group hover:shadow-lg transition-shadow">
                  <Link
                    href={`/recipe/${recipe.id}`}
                    aria-label={`View recipe: ${recipe.title}`}
                    className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-lg"
                  >
                    <div className="aspect-video bg-muted rounded-t-lg overflow-hidden">
                      {recipe.imageUrl ? (
                        <Image
                          src={recipe.imageUrl}
                          alt={`Photo of ${recipe.title}`}
                          width={400}
                          height={300}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ChefHat className="h-12 w-12 text-muted-foreground" aria-label="Recipe placeholder image" />
                        </div>
                      )}
                    </div>
                    <CardHeader>
                      <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
                        {recipe.title}
                      </CardTitle>
                      {recipe.description && (
                        <CardDescription className="line-clamp-3">
                          {recipe.description}
                        </CardDescription>
                      )}
                      <div className="space-y-2 pt-2">
                        {/* Social Proof Metrics */}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          {recipe._count?.interactions ? (
                            <div className="flex items-center">
                              <Heart className="mr-1 h-3 w-3 text-red-500" />
                              {recipe._count.interactions}
                            </div>
                          ) : null}
                          {recipe._count?.comments ? (
                            <div className="flex items-center">
                              <MessageCircle className="mr-1 h-3 w-3 text-blue-500" />
                              {recipe._count.comments}
                            </div>
                          ) : null}
                          {recipe._count?.views ? (
                            <div className="flex items-center">
                              <Eye className="mr-1 h-3 w-3" />
                              {recipe._count.views}
                            </div>
                          ) : null}
                          {recipe.averageRating ? (
                            <div className="flex items-center">
                              <Star className="mr-1 h-3 w-3 text-yellow-500 fill-current" />
                              {recipe.averageRating.toFixed(1)}
                            </div>
                          ) : null}
                        </div>

                        {/* Author and Date */}
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <div className="flex items-center">
                            <User className="mr-1 h-3 w-3" />
                            {recipe.author.name || "Admin"}
                          </div>
                          <div className="flex items-center">
                            <Clock className="mr-1 h-3 w-3" />
                            {new Date(recipe.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                  </Link>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {data.pagination.pages > 1 && (
              <nav className="flex justify-center gap-2" role="navigation" aria-label="Recipe pagination">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={!data.pagination.hasPrev}
                  aria-label={`Go to previous page (${currentPage - 1})`}
                >
                  Previous
                </Button>
                <span className="flex items-center px-4 text-sm text-muted-foreground" aria-live="polite">
                  Page {currentPage} of {data.pagination.pages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={!data.pagination.hasNext}
                  aria-label={`Go to next page (${currentPage + 1})`}
                >
                  Next
                </Button>
              </nav>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-muted-foreground">
          <p>&copy; 2024 Pastry Blog. Made with ❤️ for baking enthusiasts.</p>
        </div>
      </footer>
    </div>
  )
}