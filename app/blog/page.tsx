"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RecipeCardSkeleton, PageLoading } from "@/components/ui/loading-states"
import { ErrorState, NetworkError } from "@/components/ui/error-states"
import { ChefHat, Clock, Search, User, Heart, MessageCircle, Eye, Star, BookOpen, Calendar } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useSession } from "next-auth/react"
import { AnonymousUserBanner } from "@/components/anonymous/progressive-registration"

interface Blog {
  id: string
  title: string
  description?: string
  slug: string
  imageUrl?: string
  publishedAt: string
  categories: string[]
  tags: string[]
  author: {
    id: string
    name?: string
    image?: string
  }
  _count: {
    views: number
    comments: number
    interactions: number
  }
}

interface ApiResponse {
  blogs: Blog[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
  filters: {
    categories: Array<{ category: string; count: number }>
    tags: Array<{ tag: string; count: number }>
  }
}

export default function BlogPage() {
  const { data: session } = useSession()
  const [data, setData] = useState<ApiResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedTag, setSelectedTag] = useState("all")

  const isAnonymous = !session?.user

  const fetchBlogs = async (page = 1, search = "", category = "all", tag = "all") => {
    setIsLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "12",
        ...(search && { search }),
        ...(category !== "all" && { category }),
        ...(tag !== "all" && { tag })
      })

      const response = await fetch(`/api/blogs/public?${params}`)
      if (response.ok) {
        const result = await response.json()
        setData(result)
      } else {
        throw new Error(`Failed to fetch blogs: ${response.status}`)
      }
    } catch (error) {
      console.error("Failed to fetch blogs:", error)
      setError(error instanceof Error ? error.message : "Failed to fetch blogs")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchBlogs(currentPage, searchTerm, selectedCategory, selectedTag)
  }, [currentPage, searchTerm, selectedCategory, selectedTag])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchBlogs(1, searchTerm, selectedCategory, selectedTag)
  }

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
    setCurrentPage(1)
  }

  const handleTagChange = (tag: string) => {
    setSelectedTag(tag)
    setCurrentPage(1)
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
                <BookOpen className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-bold">Blog</h1>
              </Link>
              <p className="text-muted-foreground mt-2">
                Stories, insights, and inspiration from our community
              </p>
            </div>
            
            {/* Search */}
            <form onSubmit={handleSearch} className="flex gap-2 max-w-sm" role="search" aria-label="Search blog posts">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" aria-hidden="true" />
                <Input
                  placeholder="Search blog posts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  aria-label="Search blog posts by title or content"
                  id="blog-search"
                />
              </div>
              <Button type="submit" aria-describedby="blog-search">Search</Button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Filters */}
        {data?.filters && (
          <div className="mb-8 flex flex-wrap gap-4">
            <Select value={selectedCategory} onValueChange={handleCategoryChange}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {data.filters.categories.map(({ category, count }) => (
                  <SelectItem key={category} value={category}>
                    {category} ({count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedTag} onValueChange={handleTagChange}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Tags" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tags</SelectItem>
                {data.filters.tags.map(({ tag, count }) => (
                  <SelectItem key={tag} value={tag}>
                    {tag} ({count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {error ? (
          <NetworkError onRetry={() => fetchBlogs(currentPage, searchTerm, selectedCategory, selectedTag)} />
        ) : isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(12)].map((_, i) => (
              <RecipeCardSkeleton key={i} />
            ))}
          </div>
        ) : !data?.blogs.length ? (
          <Card className="text-center py-12">
            <CardContent>
              <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <CardTitle className="mb-2">No blog posts found</CardTitle>
              <CardDescription>
                {searchTerm ? "Try adjusting your search terms" : "Check back soon for new blog posts!"}
              </CardDescription>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Results Info */}
            <div className="flex justify-between items-center mb-6">
              <p className="text-muted-foreground">
                Showing {data.blogs.length} of {data.pagination.total} blog posts
                {searchTerm && ` for "${searchTerm}"`}
              </p>
              <Badge variant="outline">
                Page {data.pagination.page} of {data.pagination.pages}
              </Badge>
            </div>

            {/* Blog Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8" role="main" aria-label="Blog posts collection">
              {data.blogs.map((blog) => (
                <Card key={blog.id} className="group hover:shadow-lg transition-shadow">
                  <Link
                    href={`/blog/${blog.slug}`}
                    aria-label={`Read blog post: ${blog.title}`}
                    className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-lg"
                  >
                    <div className="aspect-video bg-muted rounded-t-lg overflow-hidden">
                      {blog.imageUrl ? (
                        <Image
                          src={blog.imageUrl}
                          alt={`Featured image for ${blog.title}`}
                          width={400}
                          height={300}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen className="h-12 w-12 text-muted-foreground" aria-label="Blog post placeholder image" />
                        </div>
                      )}
                    </div>
                    <CardHeader>
                      <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
                        {blog.title}
                      </CardTitle>
                      {blog.description && (
                        <CardDescription className="line-clamp-3">
                          {blog.description}
                        </CardDescription>
                      )}

                      {/* Categories and Tags */}
                      <div className="flex flex-wrap gap-1 mb-2">
                        {blog.categories.slice(0, 2).map((category) => (
                          <Badge key={category} variant="secondary" className="text-xs">
                            {category}
                          </Badge>
                        ))}
                        {blog.tags.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      <div className="space-y-2 pt-2">
                        {/* Social Proof Metrics */}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center">
                            <Eye className="mr-1 h-3 w-3" />
                            {blog._count.views}
                          </div>
                          <div className="flex items-center">
                            <MessageCircle className="mr-1 h-3 w-3 text-blue-500" />
                            {blog._count.comments}
                          </div>
                          <div className="flex items-center">
                            <Heart className="mr-1 h-3 w-3 text-red-500" />
                            {blog._count.interactions}
                          </div>
                        </div>

                        {/* Author and Date */}
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            {blog.author.image && (
                              <Image
                                src={blog.author.image}
                                alt={blog.author.name || "Author"}
                                width={16}
                                height={16}
                                className="rounded-full"
                              />
                            )}
                            <span>{blog.author.name || "Anonymous"}</span>
                          </div>
                          <div className="flex items-center">
                            <Calendar className="mr-1 h-3 w-3" />
                            {new Date(blog.publishedAt).toLocaleDateString()}
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
              <nav className="flex justify-center gap-2" role="navigation" aria-label="Blog pagination">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage <= 1}
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
                  disabled={currentPage >= data.pagination.pages}
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
          <p>&copy; 2024 Blog Platform. Made with ❤️ for content creators and readers.</p>
        </div>
      </footer>
    </div>
  )
}