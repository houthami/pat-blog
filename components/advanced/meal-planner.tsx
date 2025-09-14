"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Calendar,
  Plus,
  Search,
  ChefHat,
  Clock,
  Users,
  DollarSign,
  ShoppingCart,
  Copy,
  Share2,
  Download,
  Trash2,
  Edit
} from "lucide-react"
import { toast } from "sonner"

interface Recipe {
  id: string
  title: string
  imageUrl?: string
  prepTime?: number
  cookTime?: number
  servings?: number
  difficulty?: string
  cuisine?: string
  mealType: string[]
}

interface MealPlanDay {
  id: string
  dayOfWeek: number
  date: string
  breakfast?: Recipe
  lunch?: Recipe
  dinner?: Recipe
  snacks: Recipe[]
  totalCalories?: number
  totalCost?: number
}

interface MealPlan {
  id: string
  name: string
  weekStart: string
  weekEnd: string
  servings: number
  meals: MealPlanDay[]
  totalCost?: number
  totalCalories?: number
  tags: string[]
  isTemplate: boolean
  isPublic: boolean
}

const DAYS = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
]

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack']

export function MealPlanner() {
  const { data: session } = useSession()
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([])
  const [activePlan, setActivePlan] = useState<MealPlan | null>(null)
  const [availableRecipes, setAvailableRecipes] = useState<Recipe[]>([])
  const [showRecipeSelector, setShowRecipeSelector] = useState<{
    dayId: string
    mealType: string
  } | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [newPlanName, setNewPlanName] = useState("")
  const [showCreatePlan, setShowCreatePlan] = useState(false)

  useEffect(() => {
    if (session?.user) {
      fetchMealPlans()
      fetchAvailableRecipes()
    }
  }, [session])

  const fetchMealPlans = async () => {
    try {
      const response = await fetch('/api/meal-plans')
      if (response.ok) {
        const data = await response.json()
        setMealPlans(data)
        if (data.length > 0 && !activePlan) {
          setActivePlan(data[0])
        }
      }
    } catch (error) {
      console.error('Failed to fetch meal plans:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAvailableRecipes = async () => {
    try {
      const response = await fetch('/api/recipes/published')
      if (response.ok) {
        const data = await response.json()
        setAvailableRecipes(data)
      }
    } catch (error) {
      console.error('Failed to fetch recipes:', error)
    }
  }

  const createMealPlan = async () => {
    if (!newPlanName.trim()) return

    const today = new Date()
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - today.getDay()) // Start of week (Sunday)

    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)

    // Create empty meal plan days
    const meals = DAYS.map((_, index) => {
      const date = new Date(weekStart)
      date.setDate(weekStart.getDate() + index)

      return {
        dayOfWeek: index,
        date: date.toISOString().split('T')[0],
        snacks: []
      }
    })

    try {
      const response = await fetch('/api/meal-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newPlanName.trim(),
          weekStart: weekStart.toISOString(),
          weekEnd: weekEnd.toISOString(),
          servings: 4,
          meals,
          tags: []
        })
      })

      if (response.ok) {
        const newPlan = await response.json()
        setMealPlans(prev => [newPlan, ...prev])
        setActivePlan(newPlan)
        setShowCreatePlan(false)
        setNewPlanName("")
        toast.success("Meal plan created!")
      }
    } catch (error) {
      console.error('Failed to create meal plan:', error)
      toast.error("Failed to create meal plan")
    }
  }

  const addRecipeToMeal = async (dayId: string, mealType: string, recipe: Recipe) => {
    if (!activePlan) return

    try {
      const response = await fetch(`/api/meal-plans/${activePlan.id}/meals`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dayId,
          mealType,
          recipeId: recipe.id
        })
      })

      if (response.ok) {
        const updatedPlan = await response.json()
        setActivePlan(updatedPlan)
        setMealPlans(prev => prev.map(plan => plan.id === activePlan.id ? updatedPlan : plan))
        setShowRecipeSelector(null)
        toast.success(`${recipe.title} added to ${mealType}!`)
      }
    } catch (error) {
      console.error('Failed to add recipe to meal:', error)
      toast.error("Failed to add recipe to meal")
    }
  }

  const removeRecipeFromMeal = async (dayId: string, mealType: string) => {
    if (!activePlan) return

    try {
      const response = await fetch(`/api/meal-plans/${activePlan.id}/meals`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dayId,
          mealType
        })
      })

      if (response.ok) {
        const updatedPlan = await response.json()
        setActivePlan(updatedPlan)
        setMealPlans(prev => prev.map(plan => plan.id === activePlan.id ? updatedPlan : plan))
        toast.success("Recipe removed from meal")
      }
    } catch (error) {
      console.error('Failed to remove recipe from meal:', error)
      toast.error("Failed to remove recipe")
    }
  }

  const generateShoppingList = async () => {
    if (!activePlan) return

    try {
      const response = await fetch(`/api/meal-plans/${activePlan.id}/shopping-list`, {
        method: 'POST'
      })

      if (response.ok) {
        const shoppingList = await response.json()
        toast.success("Shopping list generated!")
        // Could redirect to shopping list page or show in modal
      }
    } catch (error) {
      console.error('Failed to generate shopping list:', error)
      toast.error("Failed to generate shopping list")
    }
  }

  const copyMealPlan = async () => {
    if (!activePlan) return

    try {
      const response = await fetch(`/api/meal-plans/${activePlan.id}/copy`, {
        method: 'POST'
      })

      if (response.ok) {
        const copiedPlan = await response.json()
        setMealPlans(prev => [copiedPlan, ...prev])
        toast.success("Meal plan copied!")
      }
    } catch (error) {
      console.error('Failed to copy meal plan:', error)
      toast.error("Failed to copy meal plan")
    }
  }

  const exportMealPlan = () => {
    if (!activePlan) return

    const content = generateMealPlanText(activePlan)
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${activePlan.name.replace(/\s+/g, '-').toLowerCase()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast.success("Meal plan exported!")
  }

  const filteredRecipes = availableRecipes.filter(recipe => {
    const matchesSearch = recipe.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesMealType = !showRecipeSelector ||
      recipe.mealType.includes(showRecipeSelector.mealType) ||
      recipe.mealType.length === 0 // Show recipes with no meal type specified
    return matchesSearch && matchesMealType
  })

  if (!session?.user) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Plan Your Meals</h3>
          <p className="text-muted-foreground mb-4">
            Sign in to create and manage meal plans
          </p>
          <Button onClick={() => window.location.href = '/login'}>
            Sign In
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="grid grid-cols-7 gap-2">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Meal Plan Selector */}
      {mealPlans.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Calendar className="mr-2 h-5 w-5" />
                Meal Plans
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCreatePlan(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                New Plan
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {mealPlans.map(plan => (
                <Button
                  key={plan.id}
                  variant={activePlan?.id === plan.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActivePlan(plan)}
                >
                  {plan.name}
                  <Badge variant="secondary" className="ml-2">
                    {new Date(plan.weekStart).toLocaleDateString()}
                  </Badge>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create New Plan */}
      {(showCreatePlan || mealPlans.length === 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Meal Plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Meal plan name (e.g., 'Week of Dec 9th')"
              value={newPlanName}
              onChange={(e) => setNewPlanName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && createMealPlan()}
            />
            <div className="flex gap-2">
              <Button onClick={createMealPlan} disabled={!newPlanName.trim()}>
                <Plus className="mr-2 h-4 w-4" />
                Create Plan
              </Button>
              {mealPlans.length > 0 && (
                <Button
                  variant="outline"
                  onClick={() => setShowCreatePlan(false)}
                >
                  Cancel
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Meal Plan */}
      {activePlan && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <Calendar className="mr-2 h-5 w-5" />
                  {activePlan.name}
                </CardTitle>
                <div className="text-sm text-muted-foreground mt-1">
                  {new Date(activePlan.weekStart).toLocaleDateString()} - {new Date(activePlan.weekEnd).toLocaleDateString()}
                  <Badge variant="outline" className="ml-2">
                    <Users className="mr-1 h-3 w-3" />
                    {activePlan.servings} servings
                  </Badge>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {activePlan.totalCost && (
                  <div className="text-right mr-4">
                    <div className="text-sm text-muted-foreground">Weekly Cost</div>
                    <div className="font-semibold text-green-600">
                      ${activePlan.totalCost.toFixed(2)}
                    </div>
                  </div>
                )}

                <Button variant="outline" size="sm" onClick={generateShoppingList}>
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Shopping List
                </Button>

                <Button variant="outline" size="sm" onClick={copyMealPlan}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy
                </Button>

                <Button variant="outline" size="sm" onClick={exportMealPlan}>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {/* Weekly Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
              {activePlan.meals.map((day, dayIndex) => (
                <div key={day.id} className="border rounded-lg">
                  <div className="p-3 border-b bg-muted/50">
                    <div className="font-medium text-center">
                      {DAYS[dayIndex]}
                    </div>
                    <div className="text-xs text-center text-muted-foreground">
                      {new Date(day.date).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>
                  </div>

                  <div className="p-2 space-y-2">
                    {/* Breakfast */}
                    <div className="min-h-16">
                      <div className="text-xs font-medium text-muted-foreground mb-1">Breakfast</div>
                      {day.breakfast ? (
                        <MealCard
                          recipe={day.breakfast}
                          onRemove={() => removeRecipeFromMeal(day.id, 'breakfast')}
                        />
                      ) : (
                        <Button
                          variant="dashed"
                          size="sm"
                          className="w-full h-12 text-xs"
                          onClick={() => setShowRecipeSelector({ dayId: day.id, mealType: 'breakfast' })}
                        >
                          <Plus className="mr-1 h-3 w-3" />
                          Add
                        </Button>
                      )}
                    </div>

                    {/* Lunch */}
                    <div className="min-h-16">
                      <div className="text-xs font-medium text-muted-foreground mb-1">Lunch</div>
                      {day.lunch ? (
                        <MealCard
                          recipe={day.lunch}
                          onRemove={() => removeRecipeFromMeal(day.id, 'lunch')}
                        />
                      ) : (
                        <Button
                          variant="dashed"
                          size="sm"
                          className="w-full h-12 text-xs"
                          onClick={() => setShowRecipeSelector({ dayId: day.id, mealType: 'lunch' })}
                        >
                          <Plus className="mr-1 h-3 w-3" />
                          Add
                        </Button>
                      )}
                    </div>

                    {/* Dinner */}
                    <div className="min-h-16">
                      <div className="text-xs font-medium text-muted-foreground mb-1">Dinner</div>
                      {day.dinner ? (
                        <MealCard
                          recipe={day.dinner}
                          onRemove={() => removeRecipeFromMeal(day.id, 'dinner')}
                        />
                      ) : (
                        <Button
                          variant="dashed"
                          size="sm"
                          className="w-full h-12 text-xs"
                          onClick={() => setShowRecipeSelector({ dayId: day.id, mealType: 'dinner' })}
                        >
                          <Plus className="mr-1 h-3 w-3" />
                          Add
                        </Button>
                      )}
                    </div>

                    {/* Daily Summary */}
                    {(day.totalCalories || day.totalCost) && (
                      <div className="pt-2 border-t text-xs text-muted-foreground">
                        {day.totalCalories && <div>{day.totalCalories} cal</div>}
                        {day.totalCost && <div>${day.totalCost.toFixed(2)}</div>}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recipe Selector Modal */}
      <Dialog open={!!showRecipeSelector} onOpenChange={() => setShowRecipeSelector(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              Choose a recipe for {showRecipeSelector?.mealType}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search recipes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Badge variant="outline">
                {filteredRecipes.length} recipes
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
              {filteredRecipes.map(recipe => (
                <div
                  key={recipe.id}
                  className="border rounded-lg p-3 hover:bg-muted/50 cursor-pointer"
                  onClick={() => showRecipeSelector && addRecipeToMeal(
                    showRecipeSelector.dayId,
                    showRecipeSelector.mealType,
                    recipe
                  )}
                >
                  {recipe.imageUrl && (
                    <img
                      src={recipe.imageUrl}
                      alt={recipe.title}
                      className="w-full h-20 object-cover rounded mb-2"
                    />
                  )}
                  <div className="font-medium text-sm mb-1">{recipe.title}</div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {recipe.prepTime && (
                      <span className="flex items-center">
                        <Clock className="mr-1 h-3 w-3" />
                        {recipe.prepTime + (recipe.cookTime || 0)}m
                      </span>
                    )}
                    {recipe.servings && (
                      <span className="flex items-center">
                        <Users className="mr-1 h-3 w-3" />
                        {recipe.servings}
                      </span>
                    )}
                    {recipe.difficulty && (
                      <Badge variant="outline" className="text-xs">
                        {recipe.difficulty}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {filteredRecipes.length === 0 && (
              <div className="text-center py-8">
                <ChefHat className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No recipes found</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {!showCreatePlan && mealPlans.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No meal plans yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first meal plan to organize your weekly meals
            </p>
            <Button onClick={() => setShowCreatePlan(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Meal Plan
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Helper component for meal cards
function MealCard({ recipe, onRemove }: { recipe: Recipe; onRemove: () => void }) {
  return (
    <div className="relative group bg-white border rounded p-2 hover:shadow-sm transition-shadow">
      {recipe.imageUrl && (
        <img
          src={recipe.imageUrl}
          alt={recipe.title}
          className="w-full h-8 object-cover rounded mb-1"
        />
      )}
      <div className="text-xs font-medium line-clamp-2">{recipe.title}</div>
      <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
        {recipe.prepTime && (
          <span className="flex items-center">
            <Clock className="mr-1 h-2 w-2" />
            {recipe.prepTime + (recipe.cookTime || 0)}m
          </span>
        )}
        {recipe.servings && (
          <span className="flex items-center">
            <Users className="mr-1 h-2 w-2" />
            {recipe.servings}
          </span>
        )}
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="absolute -top-1 -right-1 h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => {
          e.stopPropagation()
          onRemove()
        }}
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  )
}

// Helper function to generate text export
function generateMealPlanText(mealPlan: MealPlan): string {
  let text = `${mealPlan.name}\n${'='.repeat(mealPlan.name.length)}\n\n`
  text += `${new Date(mealPlan.weekStart).toLocaleDateString()} - ${new Date(mealPlan.weekEnd).toLocaleDateString()}\n`
  text += `Servings: ${mealPlan.servings}\n\n`

  mealPlan.meals.forEach((day, index) => {
    text += `${DAYS[index]} (${new Date(day.date).toLocaleDateString()}):\n`
    if (day.breakfast) text += `  Breakfast: ${day.breakfast.title}\n`
    if (day.lunch) text += `  Lunch: ${day.lunch.title}\n`
    if (day.dinner) text += `  Dinner: ${day.dinner.title}\n`
    text += '\n'
  })

  if (mealPlan.totalCost) {
    text += `Total Weekly Cost: $${mealPlan.totalCost.toFixed(2)}\n`
  }

  return text
}