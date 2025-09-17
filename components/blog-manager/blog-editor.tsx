"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Save, Eye, Upload, X, Plus } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

interface BlogEditorProps {
  blogId?: string
}

interface BlogData {
  id?: string
  title: string
  description: string
  content: string
  slug: string
  imageUrl: string
  status: "DRAFT" | "PUBLISHED" | "SUSPENDED" | "ARCHIVED"
  metaTitle: string
  metaDescription: string
  keywords: string[]
  categories: string[]
  tags: string[]
  allowComments: boolean
  allowSharing: boolean
  isPrivate: boolean
  scheduledAt?: string
}

export default function BlogEditor({ blogId }: BlogEditorProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const [loading, setLoading] = useState(!!blogId)
  const [saving, setSaving] = useState(false)
  const [newKeyword, setNewKeyword] = useState("")
  const [newCategory, setNewCategory] = useState("")
  const [newTag, setNewTag] = useState("")

  const [blogData, setBlogData] = useState<BlogData>({
    title: "",
    description: "",
    content: "",
    slug: "",
    imageUrl: "",
    status: "DRAFT",
    metaTitle: "",
    metaDescription: "",
    keywords: [],
    categories: [],
    tags: [],
    allowComments: true,
    allowSharing: true,
    isPrivate: false,
  })

  // Generate slug from title
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim("-")
  }

  // Fetch existing blog data if editing
  useEffect(() => {
    if (blogId) {
      fetchBlog()
    }
  }, [blogId])

  const fetchBlog = async () => {
    try {
      const response = await fetch(`/api/blogs/${blogId}`)
      if (!response.ok) throw new Error("Failed to fetch blog")

      const blog = await response.json()
      setBlogData({
        id: blog.id,
        title: blog.title,
        description: blog.description || "",
        content: blog.content,
        slug: blog.slug,
        imageUrl: blog.imageUrl || "",
        status: blog.status,
        metaTitle: blog.metaTitle || "",
        metaDescription: blog.metaDescription || "",
        keywords: blog.keywords || [],
        categories: blog.categories || [],
        tags: blog.tags || [],
        allowComments: blog.allowComments,
        allowSharing: blog.allowSharing,
        isPrivate: blog.isPrivate,
        scheduledAt: blog.scheduledAt ? new Date(blog.scheduledAt).toISOString().slice(0, 16) : "",
      })
    } catch (error) {
      console.error("Error fetching blog:", error)
      toast.error("Failed to fetch blog data")
      router.push("/blog-manager")
    } finally {
      setLoading(false)
    }
  }

  const handleTitleChange = (title: string) => {
    setBlogData(prev => ({
      ...prev,
      title,
      slug: prev.slug || generateSlug(title)
    }))
  }

  const addKeyword = () => {
    if (newKeyword.trim() && !blogData.keywords.includes(newKeyword.trim())) {
      setBlogData(prev => ({
        ...prev,
        keywords: [...prev.keywords, newKeyword.trim()]
      }))
      setNewKeyword("")
    }
  }

  const removeKeyword = (keyword: string) => {
    setBlogData(prev => ({
      ...prev,
      keywords: prev.keywords.filter(k => k !== keyword)
    }))
  }

  const addCategory = () => {
    if (newCategory.trim() && !blogData.categories.includes(newCategory.trim())) {
      setBlogData(prev => ({
        ...prev,
        categories: [...prev.categories, newCategory.trim()]
      }))
      setNewCategory("")
    }
  }

  const removeCategory = (category: string) => {
    setBlogData(prev => ({
      ...prev,
      categories: prev.categories.filter(c => c !== category)
    }))
  }

  const addTag = () => {
    if (newTag.trim() && !blogData.tags.includes(newTag.trim())) {
      setBlogData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }))
      setNewTag("")
    }
  }

  const removeTag = (tag: string) => {
    setBlogData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }))
  }

  const saveBlog = async (status?: "DRAFT" | "PUBLISHED") => {
    if (!blogData.title.trim() || !blogData.content.trim() || !blogData.slug.trim()) {
      toast.error("Please fill in all required fields")
      return
    }

    setSaving(true)
    try {
      const dataToSave = {
        ...blogData,
        status: status || blogData.status,
        scheduledAt: blogData.scheduledAt || null,
      }

      const url = blogId ? `/api/blogs/${blogId}` : "/api/blogs"
      const method = blogId ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSave),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to save blog")
      }

      const savedBlog = await response.json()
      toast.success(blogId ? "Blog updated successfully" : "Blog created successfully")

      if (!blogId) {
        router.push(`/blog-manager/${savedBlog.id}/edit`)
      }
    } catch (error) {
      console.error("Error saving blog:", error)
      toast.error(error instanceof Error ? error.message : "Failed to save blog")
    } finally {
      setSaving(false)
    }
  }

  const handleImageUpload = async (file: File) => {
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) throw new Error("Failed to upload image")

      const { url } = await response.json()
      setBlogData(prev => ({ ...prev, imageUrl: url }))
      toast.success("Image uploaded successfully")
    } catch (error) {
      console.error("Error uploading image:", error)
      toast.error("Failed to upload image")
    }
  }

  if (!session?.user || session.user.role !== "SUPER_USER") {
    return <div>Access denied</div>
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <Link href="/blog-manager">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Blogs
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">
              {blogId ? "Edit Blog Post" : "Create New Blog Post"}
            </h1>
            <p className="text-muted-foreground">
              {blogId ? "Update your blog content" : "Write and publish your blog post"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => saveBlog("DRAFT")}
            disabled={saving}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Draft
          </Button>
          <Button
            onClick={() => saveBlog("PUBLISHED")}
            disabled={saving}
          >
            {saving ? "Publishing..." : "Publish"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={blogData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Enter blog title..."
                  className="text-lg"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={blogData.description}
                  onChange={(e) => setBlogData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of your blog post..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="content">Content *</Label>
                <Textarea
                  id="content"
                  value={blogData.content}
                  onChange={(e) => setBlogData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Write your blog content here..."
                  rows={20}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  You can use HTML or Markdown for formatting
                </p>
              </div>
            </CardContent>
          </Card>

          {/* SEO Settings */}
          <Card>
            <CardHeader>
              <CardTitle>SEO Settings</CardTitle>
              <CardDescription>
                Optimize your blog for search engines
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="metaTitle">Meta Title</Label>
                <Input
                  id="metaTitle"
                  value={blogData.metaTitle}
                  onChange={(e) => setBlogData(prev => ({ ...prev, metaTitle: e.target.value }))}
                  placeholder="SEO title (leave empty to use blog title)"
                />
              </div>

              <div>
                <Label htmlFor="metaDescription">Meta Description</Label>
                <Textarea
                  id="metaDescription"
                  value={blogData.metaDescription}
                  onChange={(e) => setBlogData(prev => ({ ...prev, metaDescription: e.target.value }))}
                  placeholder="Brief description for search engines..."
                  rows={3}
                />
              </div>

              <div>
                <Label>Keywords</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    placeholder="Add keyword..."
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addKeyword())}
                  />
                  <Button type="button" variant="outline" onClick={addKeyword}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {blogData.keywords.map((keyword) => (
                    <Badge key={keyword} variant="secondary" className="text-xs">
                      {keyword}
                      <button
                        onClick={() => removeKeyword(keyword)}
                        className="ml-1 hover:text-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Publish Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Publish Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={blogData.status}
                  onValueChange={(value: any) => setBlogData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="PUBLISHED">Published</SelectItem>
                    <SelectItem value="SUSPENDED">Suspended</SelectItem>
                    <SelectItem value="ARCHIVED">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="slug">URL Slug *</Label>
                <Input
                  id="slug"
                  value={blogData.slug}
                  onChange={(e) => setBlogData(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="url-friendly-slug"
                />
              </div>

              <div>
                <Label htmlFor="scheduledAt">Schedule Publication</Label>
                <Input
                  id="scheduledAt"
                  type="datetime-local"
                  value={blogData.scheduledAt}
                  onChange={(e) => setBlogData(prev => ({ ...prev, scheduledAt: e.target.value }))}
                />
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="allowComments">Allow Comments</Label>
                  <Switch
                    id="allowComments"
                    checked={blogData.allowComments}
                    onCheckedChange={(checked) => setBlogData(prev => ({ ...prev, allowComments: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="allowSharing">Allow Sharing</Label>
                  <Switch
                    id="allowSharing"
                    checked={blogData.allowSharing}
                    onCheckedChange={(checked) => setBlogData(prev => ({ ...prev, allowSharing: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="isPrivate">Private Blog</Label>
                  <Switch
                    id="isPrivate"
                    checked={blogData.isPrivate}
                    onCheckedChange={(checked) => setBlogData(prev => ({ ...prev, isPrivate: checked }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Featured Image */}
          <Card>
            <CardHeader>
              <CardTitle>Featured Image</CardTitle>
            </CardHeader>
            <CardContent>
              {blogData.imageUrl ? (
                <div className="space-y-2">
                  <img
                    src={blogData.imageUrl}
                    alt="Featured"
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setBlogData(prev => ({ ...prev, imageUrl: "" }))}
                  >
                    Remove Image
                  </Button>
                </div>
              ) : (
                <div>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleImageUpload(file)
                    }}
                    className="mb-2"
                  />
                  <p className="text-xs text-muted-foreground">
                    Or enter URL:
                  </p>
                  <Input
                    value={blogData.imageUrl}
                    onChange={(e) => setBlogData(prev => ({ ...prev, imageUrl: e.target.value }))}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Categories */}
          <Card>
            <CardHeader>
              <CardTitle>Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-2">
                <Input
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="Add category..."
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addCategory())}
                />
                <Button type="button" variant="outline" onClick={addCategory}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {blogData.categories.map((category) => (
                  <Badge key={category} variant="outline">
                    {category}
                    <button
                      onClick={() => removeCategory(category)}
                      className="ml-1 hover:text-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add tag..."
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                />
                <Button type="button" variant="outline" onClick={addTag}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {blogData.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:text-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}