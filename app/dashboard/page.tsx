"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { 
  Plus, ChefHat, BookOpen, Clock, Eye, EyeOff, Search, Filter, Edit, Trash2, 
  TrendingUp, Calendar, BarChart3, Users, Globe, Heart, Star, MoreHorizontal,
  Copy, ExternalLink
} from "lucide-react"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"

interface Recipe {
  id: string
  title: string
  description: string | null
  published: boolean
  createdAt: string
  updatedAt: string
  imageUrl: string | null
}

interface DashboardStats {
  totalRecipes: number
  publishedRecipes: number
  draftRecipes: number
  thisWeekRecipes: number
  avgRecipesPerMonth: number
  mostRecentDate: string
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortBy, setSortBy] = useState("newest")
  const [stats, setStats] = useState<DashboardStats>({
    totalRecipes: 0,
    publishedRecipes: 0,
    draftRecipes: 0,
    thisWeekRecipes: 0,
    avgRecipesPerMonth: 0,
    mostRecentDate: ""
  })

  useEffect(() => {
    fetchRecipes()
  }, [])

  useEffect(() => {
    filterAndSortRecipes()
  }, [recipes, searchTerm, statusFilter, sortBy])

  const fetchRecipes = async () => {
    try {
      const response = await fetch("/api/recipes")
      if (response.ok) {
        const data = await response.json()
        setRecipes(data)
        calculateStats(data)
      }
    } catch (error) {
      console.error("Failed to fetch recipes:", error)
      toast.error("Failed to load recipes")
    } finally {
      setIsLoading(false)
    }
  }

  const calculateStats = (recipeData: Recipe[]) => {
    const now = new Date()
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    
    const published = recipeData.filter(r => r.published).length
    const drafts = recipeData.filter(r => !r.published).length
    const thisWeek = recipeData.filter(r => new Date(r.createdAt) >= oneWeekAgo).length
    
    // Calculate average recipes per month
    const oldestRecipe = recipeData.length > 0 ? 
      new Date(Math.min(...recipeData.map(r => new Date(r.createdAt).getTime()))) : now
    const monthsDiff = Math.max(1, (now.getTime() - oldestRecipe.getTime()) / (1000 * 60 * 60 * 24 * 30))
    const avgPerMonth = Math.round((recipeData.length / monthsDiff) * 10) / 10

    const mostRecent = recipeData.length > 0 ? 
      new Date(Math.max(...recipeData.map(r => new Date(r.updatedAt).getTime()))).toLocaleDateString() : ""

    setStats({
      totalRecipes: recipeData.length,
      publishedRecipes: published,
      draftRecipes: drafts,
      thisWeekRecipes: thisWeek,
      avgRecipesPerMonth: avgPerMonth,
      mostRecentDate: mostRecent
    })
  }

  const filterAndSortRecipes = () => {
    let filtered = recipes.filter(recipe => {
      const matchesSearch = recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           recipe.description?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === "all" || 
                           (statusFilter === "published" && recipe.published) ||
                           (statusFilter === "draft" && !recipe.published)
      return matchesSearch && matchesStatus
    })

    // Sort recipes
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        case "updated":
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        case "title":
          return a.title.localeCompare(b.title)
        default:
          return 0
      }
    })

    setFilteredRecipes(filtered)
  }

  const togglePublishStatus = async (recipeId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/recipes/${recipeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !currentStatus })
      })
      
      if (response.ok) {
        setRecipes(prev => prev.map(recipe => 
          recipe.id === recipeId ? { ...recipe, published: !currentStatus } : recipe
        ))
        toast.success(`Recipe ${!currentStatus ? 'published' : 'unpublished'} successfully`)
      }
    } catch (error) {
      toast.error("Failed to update recipe status")
    }
  }

  const deleteRecipe = async (recipeId: string) => {
    if (!confirm("Are you sure you want to delete this recipe?")) return
    
    try {
      const response = await fetch(`/api/recipes/${recipeId}`, {
        method: "DELETE"
      })
      
      if (response.ok) {
        setRecipes(prev => prev.filter(recipe => recipe.id !== recipeId))
        toast.success("Recipe deleted successfully")
      }
    } catch (error) {
      toast.error("Failed to delete recipe")
    }
  }

  const copyRecipeUrl = (recipeId: string) => {
    const url = `${window.location.origin}/blog/recipe/${recipeId}`
    navigator.clipboard.writeText(url)
    toast.success("Recipe URL copied to clipboard")
  }

  const publishedPercentage = stats.totalRecipes > 0 ? (stats.publishedRecipes / stats.totalRecipes) * 100 : 0

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-balance">
              Welcome back, {session?.user?.name || "Chef"}! 👨‍🍳
            </h1>
            <p className="text-muted-foreground">
              {stats.mostRecentDate && `Last activity: ${stats.mostRecentDate}`}
            </p>
          </div>
          <Button asChild className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white">
            <Link href="/recipes/new">
              <Plus className="mr-2 h-4 w-4" />
              Create New Recipe
            </Link>
          </Button>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">Total Recipes</CardTitle>
              <ChefHat className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">{stats.totalRecipes}</div>
              <div className="flex items-center text-xs text-blue-600 mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                {stats.avgRecipesPerMonth}/month avg
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-700">Published</CardTitle>
              <Globe className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900">{stats.publishedRecipes}</div>
              <Progress value={publishedPercentage} className="mt-2 h-2" />
              <p className="text-xs text-green-600 mt-1">{Math.round(publishedPercentage)}% of total</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-700">Drafts</CardTitle>
              <BookOpen className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-900">{stats.draftRecipes}</div>
              <p className="text-xs text-orange-600 mt-1">Ready to publish</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-700">This Week</CardTitle>
              <Calendar className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900">{stats.thisWeekRecipes}</div>
              <p className="text-xs text-purple-600 mt-1">New recipes</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="mr-2 h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" className="h-20 flex-col" asChild>
                <Link href="/recipes/new">
                  <Plus className="h-6 w-6 mb-2" />
                  New Recipe
                </Link>
              </Button>
              <Button variant="outline" className="h-20 flex-col" asChild>
                <Link href="/blog">
                  <Globe className="h-6 w-6 mb-2" />
                  View Blog
                </Link>
              </Button>
              <Button variant="outline" className="h-20 flex-col" asChild>
                <Link href="/recipes">
                  <Edit className="h-6 w-6 mb-2" />
                  Manage All
                </Link>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex-col"
                onClick={() => {
                  const drafts = recipes.filter(r => !r.published)
                  if (drafts.length > 0) {
                    toast.info(`You have ${drafts.length} draft${drafts.length > 1 ? 's' : ''} ready to publish`)
                  } else {
                    toast.success("All recipes are published!")
                  }
                }}
              >
                <Eye className="h-6 w-6 mb-2" />
                Check Drafts
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Advanced Recipe Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recipe Management</CardTitle>
              <div className="flex items-center gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search recipes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                
                {/* Filters */}
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="draft">Drafts</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="oldest">Oldest</SelectItem>
                    <SelectItem value="updated">Recently Updated</SelectItem>
                    <SelectItem value="title">Title A-Z</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg animate-pulse">
                    <div className="w-16 h-16 bg-muted rounded" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-1/3" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredRecipes.length === 0 ? (
              <div className="text-center py-12">
                <ChefHat className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  {searchTerm || statusFilter !== "all" ? "No matching recipes" : "No recipes yet"}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || statusFilter !== "all" 
                    ? "Try adjusting your search or filters" 
                    : "Create your first delicious recipe!"}
                </p>
                {!searchTerm && statusFilter === "all" && (
                  <Button asChild>
                    <Link href="/recipes/new">
                      <Plus className="mr-2 h-4 w-4" />
                      Create First Recipe
                    </Link>
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRecipes.map((recipe) => (
                  <div key={recipe.id} className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    {/* Recipe Image */}
                    <div className="w-16 h-16 bg-muted rounded overflow-hidden flex-shrink-0">
                      {recipe.imageUrl ? (
                        <img
                          src={recipe.imageUrl}
                          alt={recipe.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ChefHat className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    
                    {/* Recipe Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium truncate">{recipe.title}</h3>
                        <Badge variant={recipe.published ? "default" : "secondary"}>
                          {recipe.published ? "Published" : "Draft"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {recipe.description || "No description"}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center">
                          <Clock className="mr-1 h-3 w-3" />
                          Created {new Date(recipe.createdAt).toLocaleDateString()}
                        </span>
                        {recipe.updatedAt !== recipe.createdAt && (
                          <span className="flex items-center">
                            <Edit className="mr-1 h-3 w-3" />
                            Updated {new Date(recipe.updatedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/recipes/${recipe.id}/edit`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => togglePublishStatus(recipe.id, recipe.published)}
                      >
                        {recipe.published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => copyRecipeUrl(recipe.id)}>
                            <Copy className="mr-2 h-4 w-4" />
                            Copy URL
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/blog/recipe/${recipe.id}`} target="_blank">
                              <ExternalLink className="mr-2 h-4 w-4" />
                              View on Blog
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => deleteRecipe(recipe.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Results Summary */}
            {!isLoading && filteredRecipes.length > 0 && (
              <div className="mt-6 text-center text-sm text-muted-foreground">
                Showing {filteredRecipes.length} of {stats.totalRecipes} recipes
                {(searchTerm || statusFilter !== "all") && (
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => {
                      setSearchTerm("")
                      setStatusFilter("all")
                    }}
                    className="ml-2"
                  >
                    Clear filters
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}