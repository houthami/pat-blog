"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { BookmarkPlus, Heart, MessageCircle, Star, ChefHat, X, ArrowRight, Users, TrendingUp } from "lucide-react"
import { signIn } from "next-auth/react"

interface SaveRecipePromptProps {
  recipeId?: string
  recipeTitle?: string
  isOpen: boolean
  onClose: () => void
}

export function SaveRecipePrompt({ recipeId, recipeTitle, isOpen, onClose }: SaveRecipePromptProps) {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState<"prompt" | "register" | "success">("prompt")

  const handleQuickSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Create account with minimal info
      const response = await fetch("/api/auth/quick-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          role: "VISITOR",
          source: "save_recipe",
          recipeId,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        // Auto-sign them in
        await signIn("credentials", {
          email,
          password: data.tempPassword,
          redirect: false,
        })
        setStep("success")
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else {
        throw new Error("Registration failed")
      }
    } catch (error) {
      console.error("Quick registration error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleExistingUser = () => {
    window.location.href = `/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        {step === "prompt" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <BookmarkPlus className="w-5 h-5 text-primary" />
                Save This Recipe
              </DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-4 right-4"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogHeader>
            <CardContent className="space-y-4 p-0">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <ChefHat className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Join our baking community!</h3>
                  <p className="text-sm text-muted-foreground">
                    Save recipes, leave comments, and discover amazing baking content
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-950/20 rounded-md">
                  <Heart className="w-4 h-4 text-red-500" />
                  <span>Like recipes</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-950/20 rounded-md">
                  <MessageCircle className="w-4 h-4 text-blue-500" />
                  <span>Ask questions</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950/20 rounded-md">
                  <BookmarkPlus className="w-4 h-4 text-green-500" />
                  <span>Save favorites</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-yellow-50 dark:bg-yellow-950/20 rounded-md">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span>Rate & review</span>
                </div>
              </div>

              <div className="space-y-2">
                <Button
                  onClick={() => setStep("register")}
                  className="w-full"
                  size="lg"
                >
                  <BookmarkPlus className="w-4 h-4 mr-2" />
                  Save Recipe & Join Free
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button
                  variant="outline"
                  onClick={handleExistingUser}
                  className="w-full"
                >
                  Already have an account? Sign in
                </Button>
              </div>

              <div className="text-center text-xs text-muted-foreground">
                <div className="flex items-center justify-center gap-4">
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    2,847 bakers
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    4.8★ rated
                  </div>
                </div>
              </div>
            </CardContent>
          </>
        )}

        {step === "register" && (
          <>
            <DialogHeader>
              <DialogTitle>Quick Sign Up</DialogTitle>
              <DialogDescription>
                Just your email - we'll save {recipeTitle} for you!
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleQuickSignUp} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mobile-text-improvement"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep("prompt")}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? "Saving..." : "Save Recipe"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                By signing up, you agree to our terms and can unsubscribe anytime
              </p>
            </form>
          </>
        )}

        {step === "success" && (
          <div className="text-center space-y-4 py-6">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto">
              <BookmarkPlus className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-green-600">Recipe Saved!</h3>
              <p className="text-sm text-muted-foreground">
                Welcome to the community! Redirecting you...
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

interface AnonymousBannerProps {
  totalUsers?: number
  totalRecipes?: number
}

export function AnonymousUserBanner({ totalUsers = 2847, totalRecipes = 1203 }: AnonymousBannerProps) {
  const [showSavePrompt, setShowSavePrompt] = useState(false)

  return (
    <>
      <div className="bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <h2 className="text-lg font-semibold mb-1">
                Welcome to Pastry Blog! 👋
              </h2>
              <p className="text-sm text-muted-foreground">
                Join {totalUsers.toLocaleString()} bakers sharing {totalRecipes.toLocaleString()} amazing recipes
              </p>
              <div className="flex items-center justify-center md:justify-start gap-4 mt-2">
                <Badge variant="outline" className="text-xs">
                  <Star className="w-3 h-3 mr-1 text-yellow-500" />
                  4.8/5 rated
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <Users className="w-3 h-3 mr-1 text-blue-500" />
                  Active community
                </Badge>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => setShowSavePrompt(true)}
                size="sm"
                className="bg-secondary hover:bg-secondary/90"
              >
                <BookmarkPlus className="w-4 h-4 mr-2" />
                Save Recipes
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = "/login"}
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </div>

      <SaveRecipePrompt
        isOpen={showSavePrompt}
        onClose={() => setShowSavePrompt(false)}
        recipeTitle="your favorite recipes"
      />
    </>
  )
}

// Hook for tracking anonymous user interactions
export function useAnonymousTracking() {
  const trackInteraction = (action: string, recipeId?: string) => {
    // Track anonymous user behavior for analytics
    if (typeof window !== "undefined") {
      const interactions = JSON.parse(
        localStorage.getItem("anonymous_interactions") || "[]"
      )
      interactions.push({
        action,
        recipeId,
        timestamp: Date.now(),
      })
      // Keep only last 50 interactions
      localStorage.setItem(
        "anonymous_interactions",
        JSON.stringify(interactions.slice(-50))
      )
    }
  }

  return { trackInteraction }
}