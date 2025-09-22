"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RecipeCardSkeleton } from "@/components/ui/loading-states"
import { NetworkError } from "@/components/ui/error-states"
import {
  ChefHat, Clock, Search, User, Heart, MessageCircle, Eye, Star, Plus, Filter,
  Sparkles, Edit, TrendingUp, Award, Flame, Timer, Users2, BookOpen, Grid3X3,
  List, SlidersHorizontal, X, ChevronDown, Zap, Crown, Tag
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { AnonymousUserBanner } from "@/components/anonymous/progressive-registration"
import { DashboardLayout } from "@/components/dashboard-layout"
import { UserAccountDropdown } from "@/components/user/user-account-dropdown"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

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
  published?: boolean
  createdAt: string
  imageUrl: string | null
  difficulty?: 'easy' | 'medium' | 'hard'
  prepTime?: number
  cookTime?: number
  servings?: number
  cuisine?: string
  mealType?: string[]
  author: {
    name: string | null
    image?: string | null
  }
  _count?: {
    interactions: number
    views: number
    comments: number
  }
  averageRating?: number
  tags?: string[]
  isPopular?: boolean
  isTrending?: boolean
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

export default function RecipesPage() {
  const { data: session } = useSession()
  const [data, setData] = useState<ApiResponse | null>(null)
  const [recipes, setRecipes] = useState<Recipe[]>([]) // Keep for dashboard view
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState('latest')
  const [filterBy, setFilterBy] = useState('all')
  const [difficultyFilter, setDifficultyFilter] = useState('all')
  const [timeFilter, setTimeFilter] = useState('all')
  const [showFilters, setShowFilters] = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState('all')

  const isAuthenticated = !!session?.user
  const userRole = session?.user?.role
  const canCreate = userRole && ['ADMIN', 'EDITOR'].includes(userRole)
  const isVisitor = userRole === 'VISITOR'
  const isDashboardUser = canCreate

  // Dual fetch logic based on user role
  const fetchPublicRecipes = async (page = 1, search = "") => {
    setIsLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "12",
        ...(search && { search }),
        ...(selectedCategory !== 'all' && { categoryId: selectedCategory })
      })

      const response = await fetch(`/api/blog/recipes?${params}`)
      if (response.ok) {
        const result = await response.json()
        setData(result)
      } else {
        throw new Error(`Failed to fetch recipes: ${response.status}`)
      }
    } catch (error) {
      console.error("Failed to fetch public recipes:", error)
      setError(error instanceof Error ? error.message : "Failed to fetch recipes")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories")
      if (!response.ok) throw new Error("Failed to fetch categories")
      const data = await response.json()
      setCategories(data || [])
    } catch (error) {
      console.error("Error fetching categories:", error)
    }
  }

  const fetchDashboardRecipes = async () => {
    try {
      const response = await fetch("/api/recipes")
      if (response.ok) {
        const data = await response.json()
        setRecipes(data)
      }
    } catch (error) {
      console.error("Failed to fetch dashboard recipes:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
    if (isDashboardUser) {
      fetchDashboardRecipes()
    } else {
      fetchPublicRecipes(currentPage, searchTerm)
    }
  }, [isDashboardUser, currentPage, searchTerm, selectedCategory])

  const filteredRecipes = recipes.filter(
    (recipe) =>
      recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recipe.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isDashboardUser) {
      setCurrentPage(1)
      fetchPublicRecipes(1, searchTerm)
    }
  }

  // Render dashboard view for ADMIN/EDITOR
  if (isDashboardUser) {
    return (
      <DashboardLayout>
        <div className="space-y-8">
          {/* Dashboard Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-balance">Recipe Management</h1>
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
              placeholder="Search your recipes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Dashboard Recipes Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <RecipeCardSkeleton key={i} />
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
                      <Image
                        src={recipe.imageUrl}
                        alt={recipe.title}
                        width={400}
                        height={225}
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

  // Public SEO-Optimized View for everyone else
  return (
    <div className="min-h-screen bg-background">
      {/* Anonymous User Banner */}
      {!isAuthenticated && <AnonymousUserBanner totalUsers={2847} totalRecipes={data?.pagination?.total || 1203} />}

      {/* Visitor Upgrade Banner */}
      {isVisitor && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-b">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium">Unlock recipe interactions - upgrade to Viewer (Free!)</span>
              </div>
              <Button size="sm" variant="outline">
                <Link href="/visitor-welcome">Upgrade Free</Link>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* SEO-Optimized Header */}
      <header className="border-b bg-background">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start gap-3 mb-3">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <ChefHat className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-foreground">Recipe Collection</h1>
                  <p className="text-muted-foreground text-sm">
                    {data?.pagination?.total || 1203} delicious baking recipes from our community
                  </p>
                </div>
              </div>
              <p className="text-muted-foreground max-w-2xl">
                Discover amazing baking recipes, from classic cookies to artisan breads.
                Join our community of passionate bakers sharing their favorite recipes.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 items-center">
              {canCreate && (
                <Button asChild className="bg-secondary hover:bg-secondary/90">
                  <Link href="/recipes/new">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Recipe
                  </Link>
                </Button>
              )}

              <div className="flex items-center gap-3">
                <form onSubmit={handleSearch} className="flex gap-2 w-full sm:w-auto" role="search" aria-label="Search recipes">
                  <div className="relative flex-1 sm:w-80">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" aria-hidden="true" />
                    <Input
                      placeholder="Search recipes, ingredients, or techniques..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                      aria-label="Search recipes by title, ingredients, or techniques"
                    />
                  </div>
                  <Button type="submit">Search</Button>
                </form>

                {/* Category Filter */}
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4" />
                        All Categories
                      </div>
                    </SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                          {category.icon && <span>{category.icon}</span>}
                          {category.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* User Account Dropdown */}
                <UserAccountDropdown />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {error ? (
          <NetworkError onRetry={() => fetchPublicRecipes(currentPage, searchTerm)} />
        ) : isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(12)].map((_, i) => (
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
              <div>
                <p className="text-lg font-medium">
                  {data.pagination.total} Recipe{data.pagination.total !== 1 ? 's' : ''} Found
                  {searchTerm && ` for "${searchTerm}"`}
                </p>
                <p className="text-sm text-muted-foreground">
                  Showing {data.recipes.length} recipes on page {data.pagination.page} of {data.pagination.pages}
                </p>
              </div>
              <Badge variant="outline">
                Page {data.pagination.page} of {data.pagination.pages}
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {data.recipes.map((recipe, index) => (
                <Card key={recipe.id} className="group hover:shadow-lg transition-all duration-200 overflow-hidden">
                  <Link
                    href={`/recipe/${recipe.id}`}
                    aria-label={`View ${recipe.title} recipe`}
                    className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-lg block"
                  >
                    <div className="aspect-[4/3] bg-muted overflow-hidden">
                      {recipe.imageUrl ? (
                        <Image
                          src={recipe.imageUrl}
                          alt={`${recipe.title} - delicious baking recipe`}
                          width={400}
                          height={300}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          loading={index < 8 ? "eager" : "lazy"}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5">
                          <ChefHat className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    <CardHeader className="p-4">
                      <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors mb-2">
                        {recipe.title}
                      </CardTitle>

                      {recipe.description && (
                        <CardDescription className="line-clamp-2 mb-3">
                          {recipe.description}
                        </CardDescription>
                      )}

                      {recipe.category && (
                        <div className="mb-3">
                          <Badge
                            variant="secondary"
                            className="text-xs"
                            style={{
                              backgroundColor: `${recipe.category.color}20`,
                              color: recipe.category.color,
                              borderColor: `${recipe.category.color}40`
                            }}
                          >
                            {recipe.category.icon && <span className="mr-1">{recipe.category.icon}</span>}
                            {recipe.category.name}
                          </Badge>
                        </div>
                      )}

                      <div className="space-y-3">
                        {(recipe._count?.interactions || recipe._count?.comments || recipe._count?.views || recipe.averageRating) && (
                          <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                            {recipe._count?.interactions && (
                              <div className="flex items-center">
                                <Heart className="mr-1 h-3 w-3 text-red-500" />
                                <span>{recipe._count.interactions} likes</span>
                              </div>
                            )}
                            {recipe._count?.comments && (
                              <div className="flex items-center">
                                <MessageCircle className="mr-1 h-3 w-3 text-blue-500" />
                                <span>{recipe._count.comments} comments</span>
                              </div>
                            )}
                            {recipe._count?.views && (
                              <div className="flex items-center">
                                <Eye className="mr-1 h-3 w-3" />
                                <span>{recipe._count.views} views</span>
                              </div>
                            )}
                            {recipe.averageRating && (
                              <div className="flex items-center">
                                <Star className="mr-1 h-3 w-3 text-yellow-500 fill-current" />
                                <span>{recipe.averageRating.toFixed(1)} rating</span>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t border-border/50">
                          <div className="flex items-center">
                            <User className="mr-1 h-3 w-3" />
                            <span>by {recipe.author.name || "Admin"}</span>
                          </div>
                          <div className="flex items-center">
                            <Clock className="mr-1 h-3 w-3" />
                            <time dateTime={recipe.createdAt}>
                              {new Date(recipe.createdAt).toLocaleDateString()}
                            </time>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                  </Link>
                </Card>
              ))}
            </div>

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

      <footer className="border-t mt-12 bg-muted/20">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <span>🏠 {data?.pagination?.total || 1203} Recipes</span>
              <span>👥 2,847+ Bakers</span>
              <span>⭐ 4.8/5 Average Rating</span>
            </div>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Join our community of passionate bakers sharing their favorite recipes.
              From classic cookies to artisan breads, discover your next baking adventure.
            </p>
            <p className="text-sm text-muted-foreground">
              &copy; 2024 Pastry Blog. Made with ❤️ for baking enthusiasts worldwide.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
