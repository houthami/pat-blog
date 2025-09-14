"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChefHat, Clock, User, ArrowLeft, ShoppingCart, Calculator, ExternalLink, Crown } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
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

interface Recipe {
  id: string
  title: string
  description: string | null
  ingredients: string[]
  instructions: string[]
  imageUrl: string | null
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

  return (
    <div className="min-h-screen bg-background">
      {/* Analytics Tracker for authenticated users */}
      {isAuthenticated && <AnalyticsTracker recipeId={params.id as string} />}

      {/* Header */}
      <header className="border-b sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <Button variant="ghost" asChild>
              <Link href={getBackUrl()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>

            <div className="flex items-center gap-2">
              {recipe.status !== 'PUBLISHED' && (
                <Badge variant="secondary">{recipe.status}</Badge>
              )}
              {canEdit && (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/recipes/${recipe.id}/edit`}>
                    Edit Recipe
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <article className="max-w-4xl mx-auto">
          {/* Recipe Header */}
          <RecipeHeader
            recipe={recipe}
            onShare={handleShare}
            showAuthor={true}
          />

          {/* Banner Ad */}
          <div className="my-6">
            <BannerAd
              recipeId={recipe.id}
              userRole={userRole}
              isPremiumUser={canUsePremiumFeatures()}
            />
          </div>

          {/* Recipe Image */}
          {recipe.imageUrl && (
            <div className="aspect-video mb-8 rounded-lg overflow-hidden">
              <Image
                src={recipe.imageUrl}
                alt={recipe.title}
                width={800}
                height={600}
                className="w-full h-full object-cover"
                priority
              />
            </div>
          )}

          {/* Advanced Features Tabs */}
          <Tabs defaultValue="recipe" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="recipe" className="flex items-center gap-2">
                <ChefHat className="h-4 w-4" />
                Recipe
              </TabsTrigger>
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
                Scaling
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
                Shopping
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
                Links
                {!canUsePremiumFeatures() && <Crown className="h-3 w-3 text-amber-500" />}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="recipe" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recipe Content */}
                <div className="lg:col-span-2">
                  <RecipeContent
                    ingredients={(scaledRecipe || recipe).ingredients}
                    instructions={(scaledRecipe || recipe).instructions}
                  />
                </div>

                {/* Sidebar with interactions */}
                <div className="space-y-6">
                  <RecipeInteractions
                    recipeId={recipe.id}
                    userRole={userRole}
                    isAuthenticated={isAuthenticated}
                  />

                  {/* Sidebar Ad */}
                  <SidebarAd
                    recipeId={recipe.id}
                    userRole={userRole}
                    isPremiumUser={canUsePremiumFeatures()}
                  />

                  {/* Sponsored Content */}
                  <SponsoredContent
                    recipeId={recipe.id}
                    placement="SIDEBAR"
                    userRole={userRole}
                    isPremiumUser={canUsePremiumFeatures()}
                    maxItems={2}
                  />

                  <RecipeComments
                    recipeId={recipe.id}
                    userRole={userRole}
                    isAuthenticated={isAuthenticated}
                  />
                </div>
              </div>
            </TabsContent>

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

          {/* Content Ad - Related Recipes/Products */}
          <div className="mt-8">
            <SponsoredContent
              recipeId={recipe.id}
              placement="RELATED"
              userRole={userRole}
              isPremiumUser={canUsePremiumFeatures()}
              maxItems={3}
            />
          </div>

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