"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ChefHat, Clock, Search, User } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface Recipe {
  id: string
  title: string
  description: string | null
  imageUrl: string | null
  createdAt: string
  author: {
    name: string | null
  }
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
  const [data, setData] = useState<ApiResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

  const fetchRecipes = async (page = 1, search = "") => {
    setIsLoading(true)
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
      }
    } catch (error) {
      console.error("Failed to fetch recipes:", error)
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
            <form onSubmit={handleSearch} className="flex gap-2 max-w-sm">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search recipes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button type="submit">Search</Button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {data.recipes.map((recipe) => (
                <Card key={recipe.id} className="group hover:shadow-lg transition-shadow">
                  <Link href={`/blog/recipe/${recipe.id}`}>
                    <div className="aspect-video bg-muted rounded-t-lg overflow-hidden">
                      {recipe.imageUrl ? (
                        <Image
                          src={recipe.imageUrl}
                          alt={recipe.title}
                          width={400}
                          height={300}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ChefHat className="h-12 w-12 text-muted-foreground" />
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
                      <div className="flex items-center justify-between pt-2 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <User className="mr-1 h-3 w-3" />
                          {recipe.author.name || "Admin"}
                        </div>
                        <div className="flex items-center">
                          <Clock className="mr-1 h-3 w-3" />
                          {new Date(recipe.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </CardHeader>
                  </Link>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {data.pagination.pages > 1 && (
              <div className="flex justify-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={!data.pagination.hasPrev}
                >
                  Previous
                </Button>
                <span className="flex items-center px-4 text-sm text-muted-foreground">
                  Page {currentPage} of {data.pagination.pages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={!data.pagination.hasNext}
                >
                  Next
                </Button>
              </div>
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