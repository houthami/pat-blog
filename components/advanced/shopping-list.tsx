"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  ShoppingCart,
  Plus,
  Trash2,
  DollarSign,
  ExternalLink,
  Check,
  Download,
  Share2
} from "lucide-react"
import { toast } from "sonner"

interface ShoppingListItem {
  id: string
  ingredient: string
  amount: string
  unit?: string
  category: string
  price?: number
  currency: string
  checked: boolean
  affiliateLink?: {
    id: string
    affiliateUrl: string
    productName: string
    provider: string
    commission?: number
  }
  recipeId?: string
  recipeName?: string
}

interface ShoppingList {
  id: string
  name: string
  items: ShoppingListItem[]
  totalCost?: number
  store?: string
  isPublic: boolean
  recipes: { id: string; title: string }[]
}

interface ShoppingListProps {
  recipeId?: string
  recipeName?: string
  initialIngredients?: string[]
}

export function ShoppingList({ recipeId, recipeName, initialIngredients }: ShoppingListProps) {
  const { data: session } = useSession()
  const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>([])
  const [activeList, setActiveList] = useState<ShoppingList | null>(null)
  const [newListName, setNewListName] = useState("")
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session?.user) {
      fetchShoppingLists()
    }
  }, [session])

  useEffect(() => {
    if (initialIngredients && initialIngredients.length > 0) {
      setShowCreateForm(true)
      setNewListName(recipeName ? `${recipeName} Shopping List` : "New Shopping List")
    }
  }, [initialIngredients, recipeName])

  const fetchShoppingLists = async () => {
    try {
      const response = await fetch('/api/shopping-lists')
      if (response.ok) {
        const data = await response.json()
        setShoppingLists(data)
        if (data.length > 0 && !activeList) {
          setActiveList(data[0])
        }
      }
    } catch (error) {
      console.error('Failed to fetch shopping lists:', error)
    } finally {
      setLoading(false)
    }
  }

  const createShoppingList = async () => {
    if (!newListName.trim()) return

    try {
      const items = initialIngredients?.map((ingredient, index) => ({
        ingredient: parseIngredientName(ingredient),
        amount: parseIngredientAmount(ingredient),
        unit: parseIngredientUnit(ingredient),
        category: categorizeIngredient(ingredient),
        currency: "USD",
        checked: false,
        recipeId: recipeId,
        recipeName: recipeName
      })) || []

      const response = await fetch('/api/shopping-lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newListName.trim(),
          items,
          recipeIds: recipeId ? [recipeId] : []
        })
      })

      if (response.ok) {
        const newList = await response.json()
        setShoppingLists(prev => [newList, ...prev])
        setActiveList(newList)
        setShowCreateForm(false)
        setNewListName("")
        toast.success("Shopping list created!")
      }
    } catch (error) {
      console.error('Failed to create shopping list:', error)
      toast.error("Failed to create shopping list")
    }
  }

  const addToExistingList = async (listId: string) => {
    if (!initialIngredients || !recipeId) return

    try {
      const response = await fetch(`/api/shopping-lists/${listId}/add-recipe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipeId,
          ingredients: initialIngredients
        })
      })

      if (response.ok) {
        await fetchShoppingLists()
        toast.success("Ingredients added to shopping list!")
      }
    } catch (error) {
      console.error('Failed to add ingredients:', error)
      toast.error("Failed to add ingredients")
    }
  }

  const toggleItemChecked = async (itemId: string, checked: boolean) => {
    if (!activeList) return

    try {
      const response = await fetch(`/api/shopping-lists/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checked })
      })

      if (response.ok) {
        setActiveList(prev => prev ? {
          ...prev,
          items: prev.items.map(item =>
            item.id === itemId ? { ...item, checked } : item
          )
        } : null)
      }
    } catch (error) {
      console.error('Failed to update item:', error)
    }
  }

  const deleteItem = async (itemId: string) => {
    if (!activeList) return

    try {
      const response = await fetch(`/api/shopping-lists/items/${itemId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setActiveList(prev => prev ? {
          ...prev,
          items: prev.items.filter(item => item.id !== itemId)
        } : null)
        toast.success("Item removed")
      }
    } catch (error) {
      console.error('Failed to delete item:', error)
      toast.error("Failed to remove item")
    }
  }

  const exportList = () => {
    if (!activeList) return

    const content = generateShoppingListText(activeList)
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${activeList.name}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast.success("Shopping list exported!")
  }

  const shareList = async () => {
    if (!activeList) return

    const url = `${window.location.origin}/shopping-list/${activeList.id}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: activeList.name,
          text: `Check out my shopping list: ${activeList.name}`,
          url: url
        })
      } catch (error) {
        navigator.clipboard.writeText(url)
        toast.success("Shopping list URL copied to clipboard")
      }
    } else {
      navigator.clipboard.writeText(url)
      toast.success("Shopping list URL copied to clipboard")
    }
  }

  if (!session?.user) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Create Shopping Lists</h3>
          <p className="text-muted-foreground mb-4">
            Sign in to create and manage shopping lists from recipes
          </p>
          <Button onClick={() => window.location.href = '/login'}>
            Sign In
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-4 bg-muted rounded" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Shopping List Selector */}
      {shoppingLists.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ShoppingCart className="mr-2 h-5 w-5" />
              Shopping Lists
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {shoppingLists.map(list => (
                <Button
                  key={list.id}
                  variant={activeList?.id === list.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveList(list)}
                >
                  {list.name} ({list.items.filter(item => !item.checked).length})
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create New List */}
      {(showCreateForm || shoppingLists.length === 0) && (
        <Card>
          <CardHeader>
            <CardTitle>
              {initialIngredients ? "Create Shopping List from Recipe" : "Create New Shopping List"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Shopping list name"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && createShoppingList()}
            />
            {initialIngredients && (
              <div className="text-sm text-muted-foreground">
                This will add {initialIngredients.length} ingredients from {recipeName}
              </div>
            )}
            <div className="flex gap-2">
              <Button onClick={createShoppingList} disabled={!newListName.trim()}>
                <Plus className="mr-2 h-4 w-4" />
                Create List
              </Button>
              {shoppingLists.length > 0 && (
                <Button
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add to Existing List */}
      {!showCreateForm && shoppingLists.length > 0 && initialIngredients && (
        <Card>
          <CardContent className="p-6">
            <h3 className="font-medium mb-4">Add {recipeName} to existing list:</h3>
            <div className="flex flex-wrap gap-2">
              {shoppingLists.map(list => (
                <Button
                  key={list.id}
                  variant="outline"
                  size="sm"
                  onClick={() => addToExistingList(list.id)}
                >
                  <Plus className="mr-2 h-3 w-3" />
                  {list.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Shopping List */}
      {activeList && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <ShoppingCart className="mr-2 h-5 w-5" />
                {activeList.name}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={exportList}>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
                <Button variant="outline" size="sm" onClick={shareList}>
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
              </div>
            </div>
            {activeList.totalCost && activeList.totalCost > 0 && (
              <div className="flex items-center text-sm text-muted-foreground">
                <DollarSign className="mr-1 h-4 w-4" />
                Estimated total: ${activeList.totalCost.toFixed(2)}
              </div>
            )}
          </CardHeader>
          <CardContent>
            {/* Progress */}
            <div className="mb-6">
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                <span>{activeList.items.filter(item => item.checked).length} of {activeList.items.length} items</span>
                <span>{Math.round((activeList.items.filter(item => item.checked).length / activeList.items.length) * 100)}% complete</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(activeList.items.filter(item => item.checked).length / activeList.items.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Items by Category */}
            {Object.entries(groupItemsByCategory(activeList.items)).map(([category, items]) => (
              <div key={category} className="mb-6">
                <h4 className="font-medium mb-3 flex items-center">
                  <Badge variant="outline" className="mr-2">
                    {category}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    ({items.filter(item => !item.checked).length}/{items.length})
                  </span>
                </h4>

                <div className="space-y-2">
                  {items.map(item => (
                    <div
                      key={item.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border ${
                        item.checked ? 'bg-muted/50' : 'bg-background'
                      }`}
                    >
                      <Checkbox
                        checked={item.checked}
                        onCheckedChange={(checked) =>
                          toggleItemChecked(item.id, checked as boolean)
                        }
                      />

                      <div className="flex-1 min-w-0">
                        <div className={`font-medium ${item.checked ? 'line-through text-muted-foreground' : ''}`}>
                          {item.amount} {item.unit} {item.ingredient}
                        </div>
                        {item.recipeName && (
                          <div className="text-xs text-muted-foreground">
                            from {item.recipeName}
                          </div>
                        )}
                        {item.price && (
                          <div className="text-xs text-green-600">
                            ${item.price.toFixed(2)}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {item.affiliateLink && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(item.affiliateLink?.affiliateUrl, '_blank')}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteItem(item.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {activeList.items.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <ShoppingCart className="w-12 h-12 mx-auto mb-4" />
                <p>No items in this shopping list yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!showCreateForm && shoppingLists.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No shopping lists yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first shopping list to organize your ingredients
            </p>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Shopping List
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Helper functions
function parseIngredientName(ingredient: string): string {
  // Remove amount and unit, return just the ingredient name
  return ingredient.replace(/^[\d\s\/]*\s*\w+\s+/, '').trim()
}

function parseIngredientAmount(ingredient: string): string {
  const match = ingredient.match(/^([\d\s\/]+)/)
  return match ? match[1].trim() : "1"
}

function parseIngredientUnit(ingredient: string): string | undefined {
  const match = ingredient.match(/^[\d\s\/]+\s+(\w+)/)
  return match ? match[1] : undefined
}

function categorizeIngredient(ingredient: string): string {
  const produce = ['onion', 'garlic', 'tomato', 'lettuce', 'carrot', 'potato', 'apple', 'banana', 'lemon', 'lime']
  const meat = ['chicken', 'beef', 'pork', 'fish', 'turkey', 'bacon', 'sausage']
  const dairy = ['milk', 'cheese', 'butter', 'yogurt', 'cream', 'eggs']
  const pantry = ['flour', 'sugar', 'salt', 'pepper', 'oil', 'vinegar', 'rice', 'pasta']

  const lowerIngredient = ingredient.toLowerCase()

  if (produce.some(item => lowerIngredient.includes(item))) return 'Produce'
  if (meat.some(item => lowerIngredient.includes(item))) return 'Meat & Seafood'
  if (dairy.some(item => lowerIngredient.includes(item))) return 'Dairy'
  if (pantry.some(item => lowerIngredient.includes(item))) return 'Pantry'

  return 'Other'
}

function groupItemsByCategory(items: ShoppingListItem[]) {
  return items.reduce((groups, item) => {
    const category = item.category || 'Other'
    if (!groups[category]) {
      groups[category] = []
    }
    groups[category].push(item)
    return groups
  }, {} as Record<string, ShoppingListItem[]>)
}

function generateShoppingListText(shoppingList: ShoppingList): string {
  const categories = groupItemsByCategory(shoppingList.items)
  let text = `${shoppingList.name}\n${'='.repeat(shoppingList.name.length)}\n\n`

  Object.entries(categories).forEach(([category, items]) => {
    text += `${category}:\n`
    items.forEach(item => {
      const checked = item.checked ? '✓' : '◯'
      text += `  ${checked} ${item.amount} ${item.unit || ''} ${item.ingredient}\n`
    })
    text += '\n'
  })

  if (shoppingList.totalCost && shoppingList.totalCost > 0) {
    text += `Estimated Total: $${shoppingList.totalCost.toFixed(2)}\n`
  }

  return text
}