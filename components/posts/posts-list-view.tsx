"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  MoreHorizontal,
  Calendar,
  MessageCircle,
  Heart,
  ExternalLink,
  ArrowLeft,
} from "lucide-react"

interface Site {
  id: string
  name: string
  subdomain: string
  category: string
}

interface Post {
  id: string
  title: string
  slug: string
  description?: string
  status: string
  publishedAt?: string
  createdAt: string
  tags: string[]
  isFeatured: boolean
  _count: {
    views: number
    comments: number
    interactions: number
  }
}

interface PaginationData {
  page: number
  limit: number
  total: number
  pages: number
}

interface PostsListViewProps {
  site: Site
  posts: Post[]
  pagination: PaginationData
  currentStatus?: string
  currentSearch?: string
}

export default function PostsListView({
  site,
  posts,
  pagination,
  currentStatus,
  currentSearch,
}: PostsListViewProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchInput, setSearchInput] = useState(currentSearch || "")

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PUBLISHED": return "bg-green-100 text-green-800"
      case "DRAFT": return "bg-yellow-100 text-yellow-800"
      case "SUSPENDED": return "bg-red-100 text-red-800"
      case "ARCHIVED": return "bg-gray-100 text-gray-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const handleSearch = () => {
    const params = new URLSearchParams(searchParams)
    if (searchInput.trim()) {
      params.set("search", searchInput.trim())
    } else {
      params.delete("search")
    }
    params.delete("page") // Reset to first page
    router.push(`/sites/${site.id}/posts?${params.toString()}`)
  }

  const handleStatusFilter = (status: string) => {
    const params = new URLSearchParams(searchParams)
    if (status && status !== "all") {
      params.set("status", status)
    } else {
      params.delete("status")
    }
    params.delete("page") // Reset to first page
    router.push(`/sites/${site.id}/posts?${params.toString()}`)
  }

  const clearFilters = () => {
    setSearchInput("")
    router.push(`/sites/${site.id}/posts`)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/sites/${site.id}/admin`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-2">Posts</h1>
          <p className="text-muted-foreground">
            Manage blog posts for {site.name}
          </p>
        </div>
        <Button asChild>
          <Link href={`/sites/${site.id}/posts/new`}>
            <Plus className="h-4 w-4 mr-2" />
            New Post
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search posts..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
              <Button onClick={handleSearch} variant="outline">
                Search
              </Button>
            </div>

            <div className="flex gap-2">
              <Select value={currentStatus || "all"} onValueChange={handleStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="PUBLISHED">Published</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="ARCHIVED">Archived</SelectItem>
                </SelectContent>
              </Select>

              {(currentStatus || currentSearch) && (
                <Button onClick={clearFilters} variant="outline" size="sm">
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Posts Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Posts ({pagination.total})</CardTitle>
              <CardDescription>
                {currentStatus && `Filtering by ${currentStatus.toLowerCase()} posts`}
                {currentSearch && ` • Searching for "${currentSearch}"`}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                {currentSearch || currentStatus ? "No posts found matching your criteria" : "No posts yet"}
              </p>
              <Button asChild>
                <Link href={`/sites/${site.id}/posts/new`}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create your first post
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Desktop Table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Stats</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {posts.map((post) => (
                      <TableRow key={post.id}>
                        <TableCell>
                          <div>
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/sites/${site.id}/posts/${post.id}/edit`}
                                className="font-medium hover:underline"
                              >
                                {post.title}
                              </Link>
                              {post.isFeatured && (
                                <Badge variant="outline" className="text-xs">Featured</Badge>
                              )}
                            </div>
                            {post.description && (
                              <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                                {post.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              {post.tags.slice(0, 3).map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {post.tags.length > 3 && (
                                <span className="text-xs text-muted-foreground">
                                  +{post.tags.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(post.status)}>
                            {post.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {post._count.views}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageCircle className="h-3 w-3" />
                              {post._count.comments}
                            </span>
                            <span className="flex items-center gap-1">
                              <Heart className="h-3 w-3" />
                              {post._count.interactions}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {post.publishedAt
                                ? `Published ${new Date(post.publishedAt).toLocaleDateString()}`
                                : `Created ${new Date(post.createdAt).toLocaleDateString()}`
                              }
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/sites/${site.id}/posts/${post.id}/edit`}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </Link>
                              </DropdownMenuItem>
                              {post.status === "PUBLISHED" && (
                                <DropdownMenuItem asChild>
                                  <Link href={`/${site.subdomain}/${post.slug}`} target="_blank">
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    View
                                  </Link>
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-4">
                {posts.map((post) => (
                  <Card key={post.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Link
                              href={`/sites/${site.id}/posts/${post.id}/edit`}
                              className="font-medium hover:underline"
                            >
                              {post.title}
                            </Link>
                            {post.isFeatured && (
                              <Badge variant="outline" className="text-xs">Featured</Badge>
                            )}
                          </div>
                          <Badge className={getStatusColor(post.status)} size="sm">
                            {post.status}
                          </Badge>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/sites/${site.id}/posts/${post.id}/edit`}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            {post.status === "PUBLISHED" && (
                              <DropdownMenuItem asChild>
                                <Link href={`/${site.subdomain}/${post.slug}`} target="_blank">
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  View
                                </Link>
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {post.description && (
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                          {post.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {post._count.views}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="h-3 w-3" />
                            {post._count.comments}
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="h-3 w-3" />
                            {post._count.interactions}
                          </span>
                        </div>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {post.publishedAt
                            ? new Date(post.publishedAt).toLocaleDateString()
                            : new Date(post.createdAt).toLocaleDateString()
                          }
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex justify-center mt-8">
                  <Pagination>
                    <PaginationContent>
                      {pagination.page > 1 && (
                        <PaginationItem>
                          <PaginationPrevious
                            href={`/sites/${site.id}/posts?${new URLSearchParams({
                              ...Object.fromEntries(searchParams),
                              page: (pagination.page - 1).toString()
                            }).toString()}`}
                          />
                        </PaginationItem>
                      )}

                      {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                        const pageNum = i + 1
                        return (
                          <PaginationItem key={pageNum}>
                            <PaginationLink
                              href={`/sites/${site.id}/posts?${new URLSearchParams({
                                ...Object.fromEntries(searchParams),
                                page: pageNum.toString()
                              }).toString()}`}
                              isActive={pageNum === pagination.page}
                            >
                              {pageNum}
                            </PaginationLink>
                          </PaginationItem>
                        )
                      })}

                      {pagination.page < pagination.pages && (
                        <PaginationItem>
                          <PaginationNext
                            href={`/sites/${site.id}/posts?${new URLSearchParams({
                              ...Object.fromEntries(searchParams),
                              page: (pagination.page + 1).toString()
                            }).toString()}`}
                          />
                        </PaginationItem>
                      )}
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}