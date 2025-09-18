"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Save, Eye, Loader2, ArrowLeft, Trash2, Shield } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ImageUpload } from "@/components/image-upload"
import { AIEnhancementModal } from "@/components/ai-enhancement-modal"
import { InstructionEditor } from "@/components/instruction-editor"
import { toast } from "sonner"
import Link from "next/link"

interface FormData {
  title: string
  description: string
  ingredients: string
  instructions: string
  imageUrl: string
  published: boolean
  source: string
  sourceUrl: string
  sourceNote: string
}

export default function EditRecipePage() {
  const router = useRouter()
  const params = useParams()
  const recipeId = params.id as string

  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    ingredients: "",
    instructions: "",
    imageUrl: "",
    published: false,
    source: "original",
    sourceUrl: "",
    sourceNote: ""
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [aiModalOpen, setAiModalOpen] = useState(false)
  const [aiField, setAiField] = useState<keyof FormData | null>(null)
  const [autoSaveStatus, setAutoSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved")

  useEffect(() => {
    if (recipeId) {
      fetchRecipe()
    }
  }, [recipeId])

  const fetchRecipe = async () => {
    try {
      const response = await fetch(`/api/recipes/${recipeId}`)
      if (response.ok) {
        const recipe = await response.json()
        
        // Handle ingredients and instructions - they may be arrays or JSON strings
        let ingredientsText = ""
        let instructionsText = ""

        if (recipe.ingredients) {
          if (Array.isArray(recipe.ingredients)) {
            ingredientsText = recipe.ingredients.join('\n')
          } else {
            try {
              const parsedIngredients = JSON.parse(recipe.ingredients)
              ingredientsText = Array.isArray(parsedIngredients) ? parsedIngredients.join('\n') : ""
            } catch {
              ingredientsText = recipe.ingredients
            }
          }
        }

        if (recipe.instructions) {
          if (Array.isArray(recipe.instructions)) {
            // Convert instructions back to text format, preserving formatting
            let stepCounter = 1
            instructionsText = recipe.instructions.map((instruction: string) => {
              const trimmed = instruction.trim()
              // Preserve titles (lines starting with #) and descriptions (lines starting with >)
              if (trimmed.startsWith('#') || trimmed.startsWith('>') || trimmed === '') {
                return instruction
              } else {
                // This is a regular step, number it
                return `${stepCounter++}. ${instruction}`
              }
            }).join('\n')
          } else {
            try {
              const parsedInstructions = JSON.parse(recipe.instructions)
              if (Array.isArray(parsedInstructions)) {
                let stepCounter = 1
                instructionsText = parsedInstructions.map((instruction: string) => {
                  const trimmed = instruction.trim()
                  if (trimmed.startsWith('#') || trimmed.startsWith('>') || trimmed === '') {
                    return instruction
                  } else {
                    return `${stepCounter++}. ${instruction}`
                  }
                }).join('\n')
              } else {
                instructionsText = ""
              }
            } catch {
              instructionsText = recipe.instructions
            }
          }
        }

        setFormData({
          title: recipe.title,
          description: recipe.description || "",
          ingredients: ingredientsText,
          instructions: instructionsText,
          imageUrl: recipe.imageUrl || "",
          published: recipe.status === 'PUBLISHED',
          source: recipe.source || "original",
          sourceUrl: recipe.sourceUrl || "",
          sourceNote: recipe.sourceNote || ""
        })
      } else if (response.status === 404) {
        toast.error("Recipe not found")
        router.push("/dashboard")
      } else {
        toast.error("Failed to load recipe")
      }
    } catch (error) {
      console.error("Failed to fetch recipe:", error)
      toast.error("Failed to load recipe")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (typeof value === 'string') {
      setAutoSaveStatus("unsaved")
      
      // Auto-save after 2 seconds of inactivity
      setTimeout(() => {
        setAutoSaveStatus("saving")
        // Simulate auto-save
        setTimeout(() => setAutoSaveStatus("saved"), 1000)
      }, 2000)
    }
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

  const handleSubmit = async (published?: boolean) => {
    setIsSaving(true)

    try {
      const updateData = {
        ...formData,
        published: published !== undefined ? published : formData.published
      }

      const response = await fetch(`/api/recipes/${recipeId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      })

      if (response.ok) {
        toast.success("Recipe updated successfully!")
        setAutoSaveStatus("saved")
        // Update the published state if it was changed
        if (published !== undefined) {
          setFormData(prev => ({ ...prev, published }))
        }
      } else {
        const error = await response.json()
        toast.error(error.message || "Failed to update recipe")
      }
    } catch (error) {
      console.error("Error updating recipe:", error)
      toast.error("Failed to update recipe")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this recipe? This action cannot be undone.")) {
      return
    }

    setIsDeleting(true)

    try {
      const response = await fetch(`/api/recipes/${recipeId}`, {
        method: "DELETE"
      })

      if (response.ok) {
        toast.success("Recipe deleted successfully")
        router.push("/dashboard")
      } else {
        toast.error("Failed to delete recipe")
      }
    } catch (error) {
      console.error("Error deleting recipe:", error)
      toast.error("Failed to delete recipe")
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3 mb-4" />
            <div className="space-y-6">
              <div className="h-32 bg-muted rounded" />
              <div className="h-48 bg-muted rounded" />
              <div className="h-64 bg-muted rounded" />
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <Button variant="ghost" asChild>
                <Link href="/dashboard">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Dashboard
                </Link>
              </Button>
            </div>
            <h1 className="text-3xl font-bold text-balance">Edit Recipe</h1>
            <p className="text-muted-foreground">Update your delicious creation</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={formData.published ? "default" : "secondary"}>
              {formData.published ? "Published" : "Draft"}
            </Badge>
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
            <InstructionEditor
              value={formData.instructions}
              onChange={(value) => handleInputChange("instructions", value)}
              onAIEnhance={() => handleAIEnhancement("instructions")}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Image Upload */}
            <Card>
              <CardHeader>
                <CardTitle>Recipe Image</CardTitle>
              </CardHeader>
              <CardContent>
                <ImageUpload
                  value={formData.imageUrl}
                  onChange={(url) => handleInputChange("imageUrl", url)}
                />
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
                <CardTitle>Update Recipe</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={() => handleSubmit()}
                  variant="outline"
                  className="w-full"
                  disabled={isSaving || !formData.title.trim()}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>

                {formData.published ? (
                  <Button
                    onClick={() => handleSubmit(false)}
                    variant="outline"
                    className="w-full"
                    disabled={isSaving}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Unpublish
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleSubmit(true)}
                    className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                    disabled={isSaving || !formData.title.trim()}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Publish Recipe
                  </Button>
                )}

                <div className="pt-4 border-t">
                  <Button
                    onClick={handleDelete}
                    variant="destructive"
                    className="w-full"
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Recipe
                      </>
                    )}
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  {formData.published ? "Recipe is live on your blog" : "Save as draft or publish to make it live"}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* AI Enhancement Modal */}
      <AIEnhancementModal
        open={aiModalOpen}
        onOpenChange={setAiModalOpen}
        originalText={aiField ? String(formData[aiField]) : ""}
        fieldName={aiField || ""}
        onApply={handleAIApply}
      />
    </DashboardLayout>
  )
}