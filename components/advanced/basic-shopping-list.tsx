"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  ShoppingCart,
  Crown,
  ExternalLink,
  DollarSign,
  Lock
} from "lucide-react"

interface BasicShoppingItem {
  id: string
  ingredient: string
  category: string
  checked: boolean
  affiliateLink?: {
    id: string
    affiliateUrl: string
    productName: string
    provider: string
  }
}

interface BasicShoppingListProps {
  recipeId: string
  recipeName: string
  initialIngredients: string[]
  onUpgradeClick: () => void
  className?: string
}

export function BasicShoppingList({
  recipeId,
  recipeName,
  initialIngredients,
  onUpgradeClick,
  className = ""
}: BasicShoppingListProps) {
  const [items, setItems] = useState<BasicShoppingItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    generateBasicList()
    loadAffiliateLinks()
  }, [initialIngredients, recipeId])

  const generateBasicList = () => {
    const basicItems = initialIngredients.slice(0, 8).map((ingredient, index) => ({
      id: `item-${index}`,
      ingredient,
      category: categorizeIngredient(ingredient),
      checked: false
    }))

    setItems(basicItems)
    setIsLoading(false)
  }

  const loadAffiliateLinks = async () => {
    try {
      // Load public affiliate links for this recipe
      const response = await fetch(`/api/affiliate-links?recipeId=${recipeId}&public=true`)
      if (response.ok) {
        const affiliateLinks = await response.json()

        // Match affiliate links to ingredients (simplified matching)
        const updatedItems = items.map(item => {
          const matchingLink = affiliateLinks.find((link: any) =>
            link.ingredients?.some((linkIngredient: string) =>
              item.ingredient.toLowerCase().includes(linkIngredient.toLowerCase()) ||
              linkIngredient.toLowerCase().includes(item.ingredient.toLowerCase())
            )
          )

          if (matchingLink) {
            return {
              ...item,
              affiliateLink: {
                id: matchingLink.id,
                affiliateUrl: matchingLink.affiliateUrl,
                productName: matchingLink.productName,
                provider: matchingLink.provider
              }
            }
          }
          return item
        })

        setItems(updatedItems)
      }
    } catch (error) {
      console.error('Failed to load affiliate links:', error)
    }
  }

  const handleItemCheck = (itemId: string) => {
    setItems(items.map(item =>
      item.id === itemId
        ? { ...item, checked: !item.checked }
        : item
    ))
  }

  const handleAffiliateClick = async (item: BasicShoppingItem) => {
    if (!item.affiliateLink) return

    // Track the click for revenue attribution
    try {
      await fetch('/api/affiliate-links/track', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          linkId: item.affiliateLink.id,
          source: 'SHOPPING_LIST'
        })
      })

      // Open affiliate link
      window.open(item.affiliateLink.affiliateUrl, '_blank', 'noopener,noreferrer')
    } catch (error) {
      console.error('Failed to track affiliate click:', error)
      // Still open the link even if tracking fails
      window.open(item.affiliateLink.affiliateUrl, '_blank', 'noopener,noreferrer')
    }
  }

  const groupedItems = groupItemsByCategory(items)
  const checkedCount = items.filter(item => item.checked).length
  const itemsWithLinks = items.filter(item => item.affiliateLink).length

  if (isLoading) {
    return (
      <div className={`animate-pulse space-y-3 ${className}`}>
        <div className="h-8 bg-muted rounded"></div>
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 bg-muted rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <ShoppingCart className="mr-2 h-5 w-5" />
              Basic Shopping List
            </CardTitle>
            <Badge variant="secondary" className="bg-blue-50 text-blue-700">
              Free Version
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Shopping list for: <span className="font-medium">{recipeName}</span>
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Progress indicator */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{checkedCount} of {items.length} items checked</span>
            {itemsWithLinks > 0 && (
              <span className="flex items-center">
                <ExternalLink className="mr-1 h-3 w-3" />
                {itemsWithLinks} shopping links available
              </span>
            )}
          </div>

          {/* Shopping list items */}
          <div className="space-y-4">
            {Object.entries(groupedItems).map(([category, categoryItems]) => (
              <div key={category}>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">
                  {category}
                </h4>
                <div className="space-y-2">
                  {categoryItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2 rounded border hover:bg-muted/50"
                    >
                      <div className="flex items-center space-x-3 flex-1">
                        <input
                          type="checkbox"
                          checked={item.checked}
                          onChange={() => handleItemCheck(item.id)}
                          className="rounded border-gray-300"
                        />
                        <span className={`text-sm ${item.checked ? 'line-through text-muted-foreground' : ''}`}>
                          {item.ingredient}
                        </span>
                      </div>

                      {item.affiliateLink && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAffiliateClick(item)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Buy
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Revenue attribution */}
          {itemsWithLinks > 0 && (
            <div className="pt-3 border-t">
              <p className="text-xs text-muted-foreground flex items-center">
                <DollarSign className="mr-1 h-3 w-3" />
                We earn a small commission from purchases at no extra cost to you
              </p>
            </div>
          )}

          {/* Premium upgrade prompt */}
          <div className="mt-4 pt-4 border-t">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center">
                    <Crown className="mr-2 h-4 w-4 text-amber-500" />
                    <span className="font-medium text-sm">Upgrade to Premium</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Get unlimited items, multiple recipes, price tracking & more
                  </p>
                </div>
                <Button onClick={onUpgradeClick} size="sm" className="ml-4">
                  Upgrade
                </Button>
              </div>

              <div className="mt-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center text-muted-foreground">
                    <Lock className="mr-1 h-3 w-3" />
                    Limited to 8 items
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <Lock className="mr-1 h-3 w-3" />
                    Single recipe only
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <Lock className="mr-1 h-3 w-3" />
                    No price tracking
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <Lock className="mr-1 h-3 w-3" />
                    No export options
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Helper functions
function categorizeIngredient(ingredient: string): string {
  const ingredient_lower = ingredient.toLowerCase()

  if (/tomato|lettuce|onion|garlic|pepper|carrot|celery|cucumber|spinach|herbs|basil|parsley|cilantro|thyme|rosemary|lemon|lime|apple|banana|berry|fruit|vegetable/.test(ingredient_lower)) {
    return 'Produce'
  }

  if (/milk|cheese|butter|cream|yogurt|eggs?|dairy/.test(ingredient_lower)) {
    return 'Dairy'
  }

  if (/chicken|beef|pork|fish|salmon|shrimp|turkey|lamb|meat|seafood/.test(ingredient_lower)) {
    return 'Meat & Seafood'
  }

  if (/flour|sugar|salt|pepper|oil|vinegar|sauce|spice|baking|vanilla|rice|pasta|bread|cereal|canned|jar/.test(ingredient_lower)) {
    return 'Pantry'
  }

  if (/frozen|ice/.test(ingredient_lower)) {
    return 'Frozen'
  }

  return 'Other'
}

function groupItemsByCategory(items: BasicShoppingItem[]): Record<string, BasicShoppingItem[]> {
  return items.reduce((groups, item) => {
    const category = item.category
    if (!groups[category]) {
      groups[category] = []
    }
    groups[category].push(item)
    return groups
  }, {} as Record<string, BasicShoppingItem[]>)
}