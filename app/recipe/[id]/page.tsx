"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  ChefHat, Clock, User, ArrowLeft, ShoppingCart, Calculator, ExternalLink, Crown,
  Heart, Star, Eye, MessageCircle, Share, Bookmark, Copy, Timer, Users2,
  Flame, Award, TrendingUp, CheckCircle, PlayCircle, PauseCircle, RotateCcw,
  Utensils, Scale, ThermometerSun, AlertTriangle, Info, Lightbulb, Zap
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { AnalyticsTracker } from "@/components/analytics-tracker"
import { RecipeHeader } from "@/components/recipe/recipe-header"
import { RecipeContent } from "@/components/recipe/recipe-content"
import { RecipeInteractions } from "@/components/recipe/recipe-interactions"
import { RecipeComments } from "@/components/recipe/recipe-comments"
import { LoadingRecipe } from "@/components/recipe/loading-recipe"
import { RecipeNotFound } from "@/components/recipe/recipe-not-found"
import { ShoppingList } from "@/components/advanced/shopping-list"
import { RecipeScaling } from "@/components/advanced/recipe-scaling"
import { AffiliateLinks } from "@/components/advanced/affiliate-links"
import { BasicShoppingList } from "@/components/advanced/basic-shopping-list"
import { BasicAffiliateLinks } from "@/components/advanced/basic-affiliate-links"
import { PremiumUpgrade } from "@/components/monetization/premium-upgrade"
import { BannerAd, SidebarAd, ContentAd } from "@/components/monetization/ad-manager"
import { SponsoredContent } from "@/components/monetization/sponsored-content"
import { SaveRecipePrompt } from "@/components/anonymous/progressive-registration"
import { TextFormatter } from "@/components/text-formatter"

interface Recipe {
  id: string
  title: string
  description: string | null
  ingredients: string[]
  instructions: string[]
  imageUrl: string | null
  prepTime?: number
  cookTime?: number
  servings?: number
  difficulty?: 'easy' | 'medium' | 'hard'
  cuisine?: string
  mealType?: string[]
  createdAt: string
  updatedAt: string
  status: 'DRAFT' | 'PUBLISHED' | 'SUSPENDED'
  author: {
    name: string | null
    image: string | null
  }
  _count?: {
    views: number
    interactions: number
    comments: number
  }
  averageRating?: number
  tags?: string[]
  nutrition?: {
    calories?: number
    protein?: number
    carbs?: number
    fat?: number
  }
}

export default function UnifiedRecipePage() {
  const { data: session } = useSession()
  const params = useParams()
  const router = useRouter()
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showPremiumUpgrade, setShowPremiumUpgrade] = useState(false)
  const [upgradeFeature, setUpgradeFeature] = useState("")
  const [scaledRecipe, setScaledRecipe] = useState<Recipe | null>(null)
  const [activeTab, setActiveTab] = useState<"recipe" | "scaling" | "shopping" | "affiliate">("recipe")
  const [showSavePrompt, setShowSavePrompt] = useState(false)
  const [cookingMode, setCookingMode] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())
  const [cookingTimer, setCookingTimer] = useState<number | null>(null)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [showNutrition, setShowNutrition] = useState(false)

  // Determine user context and navigation
  const isAuthenticated = !!session
  const isPublicUser = !session
  const userRole = session?.user?.role
  const isVisitor = userRole === 'VISITOR'
  const canEdit = userRole && ['ADMIN', 'EDITOR'].includes(userRole)

  // Determine back navigation based on referrer or default
  const getBackUrl = () => {
    if (typeof window !== 'undefined') {
      const referrer = document.referrer
      if (referrer.includes('/recipes')) return '/recipes'
      if (referrer.includes('/dashboard')) return '/dashboard'
    }
    return '/recipes'
  }

  useEffect(() => {
    if (params.id) {
      fetchRecipe(params.id as string)
    }
  }, [params.id])

  const fetchRecipe = async (id: string) => {
    try {
      setIsLoading(true)
      setError(null)

      // Use unified API endpoint that handles both public and authenticated requests
      const response = await fetch(`/api/recipes/${id}`, {
        credentials: 'include' // Include session cookies
      })

      if (!response.ok) {
        if (response.status === 404) {
          setError("Recipe not found")
        } else if (response.status === 403) {
          setError("You don't have permission to view this recipe")
        } else {
          setError("Failed to load recipe")
        }
        return
      }

      const data = await response.json()
      setRecipe(data)

    } catch (err) {
      console.error("Failed to fetch recipe:", err)
      setError("Failed to load recipe")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRecipeUpdate = (updatedRecipe: Recipe) => {
    setRecipe(updatedRecipe)
  }

  const handleShare = async () => {
    const url = window.location.href

    if (navigator.share && recipe) {
      try {
        await navigator.share({
          title: recipe.title,
          text: recipe.description || "Check out this delicious recipe!",
          url: url
        })
      } catch (error) {
        // Fallback to clipboard
        navigator.clipboard.writeText(url)
      }
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(url)
    }
  }

  const handlePremiumFeature = (feature: string) => {
    if (!canUsePremiumFeatures()) {
      setUpgradeFeature(feature)
      setShowPremiumUpgrade(true)
      return false
    }
    return true
  }

  const canUsePremiumFeatures = () => {
    return userRole && ['ADMIN', 'EDITOR'].includes(userRole)
    // In real app, check subscription status
  }

  const handleScaledRecipe = (scaled: any) => {
    setScaledRecipe(scaled)
  }

  if (isLoading) {
    return <LoadingRecipe />
  }

  if (error || !recipe) {
    return (
      <RecipeNotFound
        error={error || "Recipe not found"}
        backUrl={getBackUrl()}
      />
    )
  }

  // Check if user can view this recipe
  if (recipe.status !== 'PUBLISHED' && !canEdit) {
    return (
      <RecipeNotFound
        error="This recipe is not available"
        backUrl={getBackUrl()}
      />
    )
  }

  // Utility functions
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800 border-green-300'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'hard': return 'bg-red-100 text-red-800 border-red-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getTotalTime = () => {
    const total = (recipe?.prepTime || 0) + (recipe?.cookTime || 0)
    if (total < 60) return `${total}m`
    const hours = Math.floor(total / 60)
    const minutes = total % 60
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
  }

  const toggleStepComplete = (stepIndex: number) => {
    const newCompleted = new Set(completedSteps)
    if (newCompleted.has(stepIndex)) {
      newCompleted.delete(stepIndex)
    } else {
      newCompleted.add(stepIndex)
    }
    setCompletedSteps(newCompleted)
  }

  const startCookingMode = () => {
    setCookingMode(true)
    setCurrentStep(0)
    setCompletedSteps(new Set())
  }

  const exitCookingMode = () => {
    setCookingMode(false)
    setCurrentStep(0)
    setCompletedSteps(new Set())
    setCookingTimer(null)
    setIsTimerRunning(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/30 via-background to-amber-50/30">
      {/* Analytics Tracker for authenticated users */}
      {isAuthenticated && <AnalyticsTracker recipeId={params.id as string} />}

      {/* Enhanced Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-lg border-b border-orange-100 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            <div className="flex items-center gap-4">
              <Button variant="ghost" asChild className="hover:bg-orange-50">
                <Link href={getBackUrl()}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Recipes
                </Link>
              </Button>

              {/* Breadcrumb */}
              <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
                <span>Recipe</span>
                <span>/</span>
                <span className="text-foreground font-medium truncate max-w-48">
                  {recipe.title}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Status Badge */}
              {recipe.status !== 'PUBLISHED' && (
                <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                  {recipe.status}
                </Badge>
              )}

              {/* Cooking Mode Toggle */}
              <Button
                variant={cookingMode ? "default" : "outline"}
                onClick={cookingMode ? exitCookingMode : startCookingMode}
                className={cn(
                  "gap-2",
                  cookingMode
                    ? "bg-orange-500 hover:bg-orange-600 text-white"
                    : "hover:bg-orange-50 border-orange-200 text-orange-700"
                )}
              >
                <Utensils className="h-4 w-4" />
                {cookingMode ? "Exit Cook Mode" : "Start Cooking"}
              </Button>

              {/* Edit Button */}
              {canEdit && (
                <Button variant="outline" size="sm" asChild className="hover:bg-orange-50">
                  <Link href={`/recipes/${recipe.id}/edit`}>
                    Edit Recipe
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Cooking Mode Overlay */}
      <AnimatePresence>
        {cookingMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-60 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Cooking Mode</h2>
                <Button variant="ghost" onClick={exitCookingMode}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Exit
                </Button>
              </div>

              {/* Progress */}
              <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Step {currentStep + 1} of {recipe.instructions.length}</span>
                  <span>{Math.round(((currentStep + 1) / recipe.instructions.length) * 100)}% Complete</span>
                </div>
                <Progress
                  value={((currentStep + 1) / recipe.instructions.length) * 100}
                  className="h-2"
                />
              </div>

              {/* Current Step */}
              <div className="bg-orange-50 rounded-xl p-6 mb-6">
                <div className="flex items-start gap-4">
                  <div className="bg-orange-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                    {currentStep + 1}
                  </div>
                  <div className="flex-1">
                    <div className="text-lg leading-relaxed text-gray-900">
                      <TextFormatter isInstruction={true}>{recipe.instructions[currentStep]}</TextFormatter>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step Controls */}
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                  disabled={currentStep === 0}
                >
                  Previous Step
                </Button>

                <Button
                  onClick={() => toggleStepComplete(currentStep)}
                  variant={completedSteps.has(currentStep) ? "default" : "outline"}
                  className={cn(
                    completedSteps.has(currentStep)
                      ? "bg-green-500 hover:bg-green-600 text-white"
                      : "hover:bg-green-50 border-green-300 text-green-700"
                  )}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {completedSteps.has(currentStep) ? "Completed" : "Mark Complete"}
                </Button>

                <Button
                  onClick={() => setCurrentStep(Math.min(recipe.instructions.length - 1, currentStep + 1))}
                  disabled={currentStep === recipe.instructions.length - 1}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  Next Step
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <article className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            {/* Recipe Title & Meta */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-4 mb-4">
                {recipe.difficulty && (
                  <Badge className={cn("text-sm", getDifficultyColor(recipe.difficulty))}>
                    {recipe.difficulty.charAt(0).toUpperCase() + recipe.difficulty.slice(1)}
                  </Badge>
                )}
                {recipe.averageRating && (
                  <Badge className="bg-amber-100 text-amber-800 border-amber-300">
                    <Star className="w-3 h-3 mr-1 fill-amber-500 text-amber-500" />
                    {recipe.averageRating.toFixed(1)} Rating
                  </Badge>
                )}
                <Badge className="bg-blue-100 text-blue-800 border-blue-300">
                  <Eye className="w-3 h-3 mr-1" />
                  {recipe._count?.views || 0} Views
                </Badge>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
                {recipe.title}
              </h1>

              {recipe.description && (
                <div className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                  <TextFormatter>{recipe.description}</TextFormatter>
                </div>
              )}

              {/* Quick Stats */}
              <div className="flex items-center justify-center gap-8 mt-6 flex-wrap">
                {(recipe.prepTime || recipe.cookTime) && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Timer className="w-5 h-5 text-orange-500" />
                    <div>
                      <div className="font-semibold">{getTotalTime()}</div>
                      <div className="text-sm">Total Time</div>
                    </div>
                  </div>
                )}
                {recipe.servings && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Users2 className="w-5 h-5 text-blue-500" />
                    <div>
                      <div className="font-semibold">{recipe.servings}</div>
                      <div className="text-sm">Servings</div>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2 text-gray-600">
                  <Heart className="w-5 h-5 text-red-500" />
                  <div>
                    <div className="font-semibold">{recipe._count?.interactions || 0}</div>
                    <div className="text-sm">Likes</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <MessageCircle className="w-5 h-5 text-green-500" />
                  <div>
                    <div className="font-semibold">{recipe._count?.comments || 0}</div>
                    <div className="text-sm">Comments</div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-center gap-4 mt-8 flex-wrap">
                <Button
                  onClick={startCookingMode}
                  className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-6 py-3 text-lg shadow-lg"
                >
                  <PlayCircle className="w-5 h-5 mr-2" />
                  Start Cooking
                </Button>
                <Button variant="outline" onClick={handleShare} className="px-6 py-3">
                  <Share className="w-4 h-4 mr-2" />
                  Share Recipe
                </Button>
                <Button variant="outline" className="px-6 py-3">
                  <Bookmark className="w-4 h-4 mr-2" />
                  Save Recipe
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Banner Ad */}
          <div className="my-6">
            <BannerAd
              recipeId={recipe.id}
              userRole={userRole}
              isPremiumUser={canUsePremiumFeatures()}
            />
          </div>

          {/* Hero Image */}
          {recipe.imageUrl && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative aspect-[16/10] mb-12 rounded-2xl overflow-hidden shadow-2xl"
            >
              <Image
                src={recipe.imageUrl}
                alt={recipe.title}
                width={1200}
                height={750}
                className="w-full h-full object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

              {/* Overlay Info */}
              <div className="absolute bottom-6 left-6 right-6">
                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                      <User className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium">
                      by {recipe.author.name || "Chef"}
                    </span>
                  </div>
                  <div className="text-sm opacity-90">
                    Updated {new Date(recipe.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Modern Content Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Main Recipe Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Ingredients Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                  <CardHeader className="bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-t-lg">
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <Scale className="w-6 h-6" />
                      Ingredients
                      {recipe.servings && (
                        <Badge className="bg-white/20 text-white border-white/30">
                          Serves {recipe.servings}
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      {recipe.ingredients.map((ingredient, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.4, delay: index * 0.1 }}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-orange-50 transition-colors"
                        >
                          <div className="w-2 h-2 bg-orange-400 rounded-full" />
                          <span className="text-gray-700 leading-relaxed">
                            <TextFormatter>{ingredient}</TextFormatter>
                          </span>
                        </motion.div>
                      ))}
                    </div>
                    <div className="mt-6 flex gap-3">
                      <Button variant="outline" className="flex-1">
                        <Copy className="w-4 h-4 mr-2" />
                        Copy List
                      </Button>
                      <Button variant="outline" className="flex-1">
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Add to Cart
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Instructions Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                  <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-t-lg">
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <Utensils className="w-6 h-6" />
                      Instructions
                      <Badge className="bg-white/20 text-white border-white/30">
                        {recipe.instructions.length} Steps
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-6">
                      {recipe.instructions.map((instruction, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: index * 0.1 }}
                          className={cn(
                            "flex gap-4 p-4 rounded-xl transition-all duration-300",
                            completedSteps.has(index)
                              ? "bg-green-50 border border-green-200"
                              : "bg-gray-50 hover:bg-blue-50 border border-transparent hover:border-blue-200"
                          )}
                        >
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors",
                            completedSteps.has(index)
                              ? "bg-green-500 text-white"
                              : "bg-blue-500 text-white"
                          )}>
                            {completedSteps.has(index) ? (
                              <CheckCircle className="w-4 h-4" />
                            ) : (
                              index + 1
                            )}
                          </div>
                          <div className="flex-1">
                            <div className={cn(
                              "leading-relaxed transition-colors",
                              completedSteps.has(index)
                                ? "text-green-800 line-through"
                                : "text-gray-700"
                            )}>
                              <TextFormatter isInstruction={true}>{instruction}</TextFormatter>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => toggleStepComplete(index)}
                              className={cn(
                                "mt-2 h-8",
                                completedSteps.has(index)
                                  ? "text-green-600 hover:text-green-700"
                                  : "text-blue-600 hover:text-blue-700"
                              )}
                            >
                              {completedSteps.has(index) ? "Undo" : "Mark Done"}
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Recipe Actions */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">Recipe Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      onClick={startCookingMode}
                      className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
                    >
                      <PlayCircle className="w-4 h-4 mr-2" />
                      Start Cooking Mode
                    </Button>
                    <Button variant="outline" className="w-full">
                      <Scale className="w-4 h-4 mr-2" />
                      Scale Recipe
                    </Button>
                    <Button variant="outline" className="w-full">
                      <Bookmark className="w-4 h-4 mr-2" />
                      Save Recipe
                    </Button>
                    <Button variant="outline" onClick={handleShare} className="w-full">
                      <Share className="w-4 h-4 mr-2" />
                      Share Recipe
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Nutrition Info */}
              {recipe.nutrition && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                >
                  <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Info className="w-5 h-5 text-green-500" />
                        Nutrition Facts
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {recipe.nutrition.calories && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Calories</span>
                            <span className="font-semibold">{recipe.nutrition.calories}</span>
                          </div>
                        )}
                        {recipe.nutrition.protein && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Protein</span>
                            <span className="font-semibold">{recipe.nutrition.protein}g</span>
                          </div>
                        )}
                        {recipe.nutrition.carbs && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Carbs</span>
                            <span className="font-semibold">{recipe.nutrition.carbs}g</span>
                          </div>
                        )}
                        {recipe.nutrition.fat && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Fat</span>
                            <span className="font-semibold">{recipe.nutrition.fat}g</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Recipe Interactions */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                <RecipeInteractions
                  recipeId={recipe.id}
                  userRole={userRole}
                  isAuthenticated={isAuthenticated}
                />
              </motion.div>

              {/* Sidebar Ad */}
              <SidebarAd
                recipeId={recipe.id}
                userRole={userRole}
                isPremiumUser={canUsePremiumFeatures()}
              />
            </div>
          </div>

          {/* Advanced Features Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-12"
          >
            <Tabs defaultValue="scaling" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-muted/50">
                <TabsTrigger
                  value="scaling"
                  className="flex items-center gap-2"
                  onClick={() => {
                    if (!canUsePremiumFeatures()) {
                      handlePremiumFeature("recipe-scaling")
                    }
                  }}
                >
                  <Calculator className="h-4 w-4" />
                  Recipe Scaling
                  {!canUsePremiumFeatures() && <Crown className="h-3 w-3 text-amber-500" />}
                </TabsTrigger>
                <TabsTrigger
                  value="shopping"
                  className="flex items-center gap-2"
                  onClick={() => {
                    if (!canUsePremiumFeatures()) {
                      handlePremiumFeature("shopping-lists")
                    }
                  }}
                >
                  <ShoppingCart className="h-4 w-4" />
                  Shopping List
                  {!canUsePremiumFeatures() && <Crown className="h-3 w-3 text-amber-500" />}
                </TabsTrigger>
                <TabsTrigger
                  value="affiliate"
                  className="flex items-center gap-2"
                  onClick={() => {
                    if (!canUsePremiumFeatures()) {
                      handlePremiumFeature("affiliate")
                    }
                  }}
                >
                  <ExternalLink className="h-4 w-4" />
                  Recommended Products
                  {!canUsePremiumFeatures() && <Crown className="h-3 w-3 text-amber-500" />}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="scaling" className="mt-6">
              {canUsePremiumFeatures() ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <RecipeScaling
                    recipe={recipe}
                    onScaledRecipe={handleScaledRecipe}
                  />
                  <div className="space-y-6">
                    <RecipeInteractions
                      recipeId={recipe.id}
                      userRole={userRole}
                      isAuthenticated={isAuthenticated}
                      onAnonymousSave={() => setShowSavePrompt(true)}
                    />
                  </div>
                </div>
              ) : (
                <Card className="p-8 text-center">
                  <Crown className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Premium Feature</h3>
                  <p className="text-muted-foreground mb-4">
                    Recipe scaling is available with Premium subscription
                  </p>
                  <Button onClick={() => handlePremiumFeature("recipe-scaling")}>
                    <Crown className="mr-2 h-4 w-4" />
                    Upgrade to Premium
                  </Button>
                </Card>
              )}
            </TabsContent>

              <TabsContent value="shopping" className="mt-6">
              {canUsePremiumFeatures() ? (
                <ShoppingList
                  recipeId={recipe.id}
                  recipeName={recipe.title}
                  initialIngredients={recipe.ingredients}
                />
              ) : (
                <BasicShoppingList
                  recipeId={recipe.id}
                  recipeName={recipe.title}
                  initialIngredients={recipe.ingredients}
                  onUpgradeClick={() => handlePremiumFeature("shopping-lists")}
                />
              )}
            </TabsContent>

              <TabsContent value="affiliate" className="mt-6">
              {canUsePremiumFeatures() ? (
                <AffiliateLinks
                  recipeId={recipe.id}
                  ingredients={recipe.ingredients}
                  isEditable={canEdit}
                  showRevenue={canEdit}
                />
              ) : (
                <BasicAffiliateLinks
                  recipeId={recipe.id}
                  ingredients={recipe.ingredients}
                  onUpgradeClick={() => handlePremiumFeature("affiliate")}
                />
              )}
            </TabsContent>
            </Tabs>
          </motion.div>

          {/* Comments Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="mt-12"
          >
            <RecipeComments
              recipeId={recipe.id}
              userRole={userRole}
              isAuthenticated={isAuthenticated}
            />
          </motion.div>

          {/* Related Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="mt-16"
          >
            <SponsoredContent
              recipeId={recipe.id}
              placement="RELATED"
              userRole={userRole}
              isPremiumUser={canUsePremiumFeatures()}
              maxItems={3}
            />
          </motion.div>

          {/* Recipe Meta */}
          <div className="mt-12 pt-8 border-t">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div>
                <p>Published on {new Date(recipe.createdAt).toLocaleDateString()}</p>
                {recipe.createdAt !== recipe.updatedAt && (
                  <p>Updated on {new Date(recipe.updatedAt).toLocaleDateString()}</p>
                )}
              </div>
              <div className="flex items-center gap-4">
                {recipe._count && (
                  <>
                    <span>{recipe._count.views} views</span>
                    <span>{recipe._count.interactions} interactions</span>
                    <span>{recipe._count.comments} comments</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </article>
      </main>

      {/* Premium Upgrade Modal */}
      <PremiumUpgrade
        currentFeature={upgradeFeature}
        isOpen={showPremiumUpgrade}
        onClose={() => setShowPremiumUpgrade(false)}
        onUpgrade={() => {
          // In real app, refresh user subscription status
          setShowPremiumUpgrade(false)
        }}
      />

      {/* Anonymous User Save Recipe Prompt */}
      {isPublicUser && (
        <SaveRecipePrompt
          recipeId={recipe?.id}
          recipeTitle={recipe?.title}
          isOpen={showSavePrompt}
          onClose={() => setShowSavePrompt(false)}
        />
      )}
    </div>
  )
}