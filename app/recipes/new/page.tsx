"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sparkles, Save, Eye, Loader2, Shield } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ImageUpload } from "@/components/image-upload"
import { AIEnhancementModal } from "@/components/ai-enhancement-modal"

interface FormData {
  title: string
  description: string
  ingredients: string
  instructions: string
  imageUrl: string
  source: string
  sourceUrl: string
  sourceNote: string
}

export default function NewRecipePage() {
  const router = useRouter()
  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    ingredients: "",
    instructions: "",
    imageUrl: "",
    source: "original",
    sourceUrl: "",
    sourceNote: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [aiModalOpen, setAiModalOpen] = useState(false)
  const [aiField, setAiField] = useState<keyof FormData | null>(null)
  const [autoSaveStatus, setAutoSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved")

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setAutoSaveStatus("unsaved")

    // Auto-save after 2 seconds of inactivity
    setTimeout(() => {
      setAutoSaveStatus("saving")
      // Simulate auto-save
      setTimeout(() => setAutoSaveStatus("saved"), 1000)
    }, 2000)
  }

  const handleAIEnhancement = (field: keyof FormData) => {
    setAiField(field)
    setAiModalOpen(true)
  }

  const handleAIApply = (enhancedText: string) => {
    if (aiField) {
      handleInputChange(aiField, enhancedText)
    }
    setAiModalOpen(false)
    setAiField(null)
  }

  const handleSubmit = async (published = false) => {
    setIsLoading(true)

    try {
      const response = await fetch("/api/recipes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          published,
        }),
      })

      if (response.ok) {
        router.push("/dashboard")
      } else {
        console.error("Failed to create recipe")
      }
    } catch (error) {
      console.error("Error creating recipe:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-balance">Create New Recipe</h1>
            <p className="text-muted-foreground">Share your delicious creation with the world</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={autoSaveStatus === "saved" ? "default" : "secondary"}>
              {autoSaveStatus === "saving" ? (
                <>
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  Saving...
                </>
              ) : autoSaveStatus === "saved" ? (
                "Saved"
              ) : (
                "Unsaved changes"
              )}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Recipe Title
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleAIEnhancement("title")}
                    className="text-accent hover:text-accent-foreground hover:bg-accent/10"
                  >
                    <Sparkles className="w-4 h-4 mr-1" />
                    AI Enhance
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  placeholder="Enter your recipe title..."
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  className="text-lg font-medium"
                />
              </CardContent>
            </Card>

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Description
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleAIEnhancement("description")}
                    className="text-accent hover:text-accent-foreground hover:bg-accent/10"
                  >
                    <Sparkles className="w-4 h-4 mr-1" />
                    AI Enhance
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Describe your recipe, its inspiration, or what makes it special..."
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  rows={4}
                />
              </CardContent>
            </Card>

            {/* Ingredients */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Ingredients
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleAIEnhancement("ingredients")}
                    className="text-accent hover:text-accent-foreground hover:bg-accent/10"
                  >
                    <Sparkles className="w-4 h-4 mr-1" />
                    AI Enhance
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="• 2 cups all-purpose flour&#10;• 1 cup sugar&#10;• 3 large eggs&#10;• 1/2 cup butter, softened"
                  value={formData.ingredients}
                  onChange={(e) => handleInputChange("ingredients", e.target.value)}
                  rows={8}
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Use bullet points (•) or dashes (-) to list each ingredient
                </p>
              </CardContent>
            </Card>

            {/* Instructions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Instructions
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleAIEnhancement("instructions")}
                    className="text-accent hover:text-accent-foreground hover:bg-accent/10"
                  >
                    <Sparkles className="w-4 h-4 mr-1" />
                    AI Enhance
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="1. Preheat oven to 350°F (175°C)&#10;2. In a large bowl, cream together butter and sugar&#10;3. Add eggs one at a time, beating well after each addition"
                  value={formData.instructions}
                  onChange={(e) => handleInputChange("instructions", e.target.value)}
                  rows={10}
                />
                <div className="text-sm text-muted-foreground mt-2 space-y-1">
                  <p>Number each step for clear, easy-to-follow instructions</p>
                  <p><strong>Special formatting:</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li><code># Title</code> - Creates a section title (not numbered)</li>
                    <li><code>&gt; Description</code> - Creates a highlighted note (not numbered)</li>
                    <li><code>**Bold text**</code> - Makes text bold</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Image Upload */}
            <Card>
              <CardHeader>
                <CardTitle>Recipe Image</CardTitle>
              </CardHeader>
              <CardContent>
                <ImageUpload value={formData.imageUrl} onChange={(url) => handleInputChange("imageUrl", url)} />
              </CardContent>
            </Card>

            {/* Recipe Source - Admin Only */}
            <Card>
              <CardHeader>
                <CardTitle>Recipe Source</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Source Type</label>
                  <select
                    value={formData.source}
                    onChange={(e) => handleInputChange("source", e.target.value)}
                    className="w-full p-2 border border-input bg-background rounded-md text-sm"
                  >
                    <option value="original">Original Recipe</option>
                    <option value="website">Website/Blog</option>
                    <option value="cookbook">Cookbook</option>
                    <option value="family">Family Recipe</option>
                    <option value="magazine">Magazine</option>
                    <option value="restaurant">Restaurant</option>
                    <option value="youtube">YouTube</option>
                    <option value="social">Social Media</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {formData.source !== "original" && (
                  <>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Source URL (if applicable)</label>
                      <Input
                        type="url"
                        placeholder="https://example.com/recipe"
                        value={formData.sourceUrl}
                        onChange={(e) => handleInputChange("sourceUrl", e.target.value)}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Source Notes</label>
                      <Textarea
                        placeholder="Additional details about the source (author name, book title, page number, etc.)"
                        value={formData.sourceNote}
                        onChange={(e) => handleInputChange("sourceNote", e.target.value)}
                        rows={3}
                        className="text-sm"
                      />
                    </div>
                  </>
                )}

                <p className="text-xs text-muted-foreground">
                  This information helps track recipe sources for attribution and copyright purposes.
                </p>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Publish Recipe</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={() => handleSubmit(false)}
                  variant="outline"
                  className="w-full"
                  disabled={isLoading || !formData.title.trim()}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save as Draft
                </Button>
                <Button
                  onClick={() => handleSubmit(true)}
                  className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                  disabled={
                    isLoading || !formData.title.trim()
                  }
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 mr-2" />
                      Publish Recipe
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground">Published recipes will be visible on your blog</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* AI Enhancement Modal */}
      <AIEnhancementModal
        open={aiModalOpen}
        onOpenChange={setAiModalOpen}
        originalText={aiField ? formData[aiField] : ""}
        fieldName={aiField || ""}
        onApply={handleAIApply}
      />
    </DashboardLayout>
  )
}
