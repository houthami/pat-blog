"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { ArrowLeft, Globe, Palette, Tag, X, Plus } from "lucide-react"
import Link from "next/link"

const categories = [
  { value: "food", label: "Food & Cooking", description: "Recipes, cooking tips, restaurant reviews" },
  { value: "lifestyle", label: "Lifestyle", description: "Daily life, wellness, personal stories" },
  { value: "tech", label: "Technology", description: "Programming, gadgets, software reviews" },
  { value: "travel", label: "Travel", description: "Travel guides, destinations, experiences" },
  { value: "fashion", label: "Fashion", description: "Style, trends, fashion advice" },
  { value: "fitness", label: "Health & Fitness", description: "Workouts, nutrition, wellness tips" },
  { value: "diy", label: "DIY & Crafts", description: "Tutorials, crafting, home improvement" },
  { value: "business", label: "Business", description: "Entrepreneurship, marketing, finance" },
  { value: "photography", label: "Photography", description: "Photo tips, gear reviews, galleries" },
  { value: "parenting", label: "Parenting", description: "Family life, parenting tips, kids activities" },
  { value: "education", label: "Education", description: "Learning, tutorials, academic content" },
  { value: "entertainment", label: "Entertainment", description: "Movies, music, books, games" },
]

const themes = [
  { value: "default", label: "Default", color: "#3b82f6" },
  { value: "minimal", label: "Minimal", color: "#6b7280" },
  { value: "vibrant", label: "Vibrant", color: "#f59e0b" },
  { value: "nature", label: "Nature", color: "#10b981" },
  { value: "dark", label: "Dark", color: "#1f2937" },
  { value: "elegant", label: "Elegant", color: "#8b5cf6" },
]

export default function CreateSiteForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [newTag, setNewTag] = useState("")

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    subdomain: "",
    description: "",
    category: "",
    tags: [] as string[],
    theme: "default",
    primaryColor: "#3b82f6",
    metaTitle: "",
    metaDescription: "",
    keywords: [] as string[],
  })

  // Auto-generate slug and subdomain from name
  const handleNameChange = (name: string) => {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim("-")

    setFormData(prev => ({
      ...prev,
      name,
      slug: prev.slug || slug,
      subdomain: prev.subdomain || slug,
      metaTitle: prev.metaTitle || name,
    }))
  }

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }))
      setNewTag("")
    }
  }

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.category || !formData.subdomain) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/sites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create site")
      }

      const site = await response.json()
      toast.success("Site created successfully!")

      // Redirect to the new site's admin dashboard
      router.push(`/sites/${site.id}/admin`)
    } catch (error) {
      console.error("Error creating site:", error)
      toast.error(error instanceof Error ? error.message : "Failed to create site")
    } finally {
      setIsLoading(false)
    }
  }

  const selectedCategory = categories.find(cat => cat.value === formData.category)
  const selectedTheme = themes.find(theme => theme.value === formData.theme)

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
      </div>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Basic Information
          </CardTitle>
          <CardDescription>
            Set up the basic details for your new site
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Site Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="My Awesome Blog"
              maxLength={100}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="slug">Site Slug *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                placeholder="my-awesome-blog"
                pattern="^[a-z0-9-]+$"
                maxLength={50}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Used in URLs: yoursite.com/my-awesome-blog
              </p>
            </div>

            <div>
              <Label htmlFor="subdomain">Subdomain *</Label>
              <Input
                id="subdomain"
                value={formData.subdomain}
                onChange={(e) => setFormData(prev => ({ ...prev, subdomain: e.target.value }))}
                placeholder="myawesomeblog"
                pattern="^[a-z0-9-]+$"
                maxLength={30}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Your site URL: {formData.subdomain || "subdomain"}.yourdomain.com
              </p>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Tell people what your site is about..."
              rows={3}
              maxLength={500}
            />
          </div>

          <div>
            <Label htmlFor="category">Category *</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Choose your site category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    <div>
                      <div className="font-medium">{category.label}</div>
                      <div className="text-xs text-muted-foreground">{category.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedCategory && (
              <p className="text-xs text-muted-foreground mt-1">
                {selectedCategory.description}
              </p>
            )}
          </div>

          <div>
            <Label>Tags</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add a tag..."
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
              />
              <Button type="button" variant="outline" onClick={addTag}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-1">
              {formData.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
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

      {/* Customization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Customization
          </CardTitle>
          <CardDescription>
            Customize the look and feel of your site
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="theme">Theme</Label>
            <Select value={formData.theme} onValueChange={(value) => setFormData(prev => ({ ...prev, theme: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {themes.map((theme) => (
                  <SelectItem key={theme.value} value={theme.value}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: theme.color }}
                      />
                      {theme.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="primaryColor">Primary Color</Label>
            <div className="flex gap-2">
              <Input
                id="primaryColor"
                type="color"
                value={formData.primaryColor}
                onChange={(e) => setFormData(prev => ({ ...prev, primaryColor: e.target.value }))}
                className="w-20 h-10"
              />
              <Input
                value={formData.primaryColor}
                onChange={(e) => setFormData(prev => ({ ...prev, primaryColor: e.target.value }))}
                placeholder="#3b82f6"
                className="flex-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SEO Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            SEO Settings
          </CardTitle>
          <CardDescription>
            Optimize your site for search engines
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="metaTitle">Meta Title</Label>
            <Input
              id="metaTitle"
              value={formData.metaTitle}
              onChange={(e) => setFormData(prev => ({ ...prev, metaTitle: e.target.value }))}
              placeholder="Your Site Title"
              maxLength={60}
            />
          </div>

          <div>
            <Label htmlFor="metaDescription">Meta Description</Label>
            <Textarea
              id="metaDescription"
              value={formData.metaDescription}
              onChange={(e) => setFormData(prev => ({ ...prev, metaDescription: e.target.value }))}
              placeholder="A brief description of your site..."
              rows={3}
              maxLength={160}
            />
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-end gap-4">
        <Link href="/dashboard">
          <Button variant="outline" type="button">
            Cancel
          </Button>
        </Link>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Creating..." : "Create Site"}
        </Button>
      </div>
    </form>
  )
}