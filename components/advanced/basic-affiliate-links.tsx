"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  ExternalLink,
  DollarSign,
  Crown,
  Lock,
  Star,
  TrendingUp
} from "lucide-react"
import Image from "next/image"

interface BasicAffiliateLink {
  id: string
  productName: string
  productDescription?: string
  productUrl: string
  affiliateUrl: string
  provider: 'AMAZON' | 'TARGET' | 'WALMART' | 'WILLIAMS_SONOMA' | 'CUSTOM'
  category: string
  price?: number
  ingredients: string[]
  clickCount: number
}

interface BasicAffiliateLinksProps {
  recipeId: string
  ingredients: string[]
  onUpgradeClick: () => void
  className?: string
}

export function BasicAffiliateLinks({
  recipeId,
  ingredients,
  onUpgradeClick,
  className = ""
}: BasicAffiliateLinksProps) {
  const [links, setLinks] = useState<BasicAffiliateLink[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadBasicAffiliateLinks()
  }, [recipeId, ingredients])

  const loadBasicAffiliateLinks = async () => {
    try {
      setIsLoading(true)
      // Load public affiliate links for this recipe
      const response = await fetch(`/api/affiliate-links?recipeId=${recipeId}&public=true&limit=3`)

      if (response.ok) {
        const affiliateLinks = await response.json()
        setLinks(affiliateLinks)
      }
    } catch (error) {
      console.error('Failed to load affiliate links:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAffiliateClick = async (link: BasicAffiliateLink) => {
    try {
      // Track the click for revenue attribution
      await fetch('/api/affiliate-links/track', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          linkId: link.id,
          source: 'RECIPE_PAGE'
        })
      })

      // Open affiliate link
      window.open(link.affiliateUrl, '_blank', 'noopener,noreferrer')
    } catch (error) {
      console.error('Failed to track affiliate click:', error)
      // Still open the link even if tracking fails
      window.open(link.affiliateUrl, '_blank', 'noopener,noreferrer')
    }
  }

  const getProviderIcon = (provider: string) => {
    const icons = {
      AMAZON: '🛒',
      TARGET: '🎯',
      WALMART: '🏪',
      WILLIAMS_SONOMA: '🍽️',
      CUSTOM: '🔗'
    }
    return icons[provider as keyof typeof icons] || '🔗'
  }

  const getProviderColor = (provider: string) => {
    const colors = {
      AMAZON: 'bg-orange-50 text-orange-700 border-orange-200',
      TARGET: 'bg-red-50 text-red-700 border-red-200',
      WALMART: 'bg-blue-50 text-blue-700 border-blue-200',
      WILLIAMS_SONOMA: 'bg-green-50 text-green-700 border-green-200',
      CUSTOM: 'bg-gray-50 text-gray-700 border-gray-200'
    }
    return colors[provider as keyof typeof colors] || colors.CUSTOM
  }

  if (isLoading) {
    return (
      <div className={`space-y-3 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded mb-4"></div>
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-4">
              <div className="flex gap-3">
                <div className="w-16 h-16 bg-muted rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                  <div className="h-3 bg-muted rounded w-1/4"></div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (links.length === 0) {
    return (
      <div className={className}>
        <Card>
          <CardContent className="p-6 text-center">
            <ExternalLink className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <h4 className="text-sm font-medium mb-1">No Affiliate Links Available</h4>
            <p className="text-xs text-muted-foreground">
              Affiliate links help support this platform at no extra cost to you
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <ExternalLink className="mr-2 h-5 w-5" />
              Recommended Products
            </CardTitle>
            <Badge variant="secondary" className="bg-green-50 text-green-700">
              Free Access
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Essential ingredients and tools for this recipe
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Basic affiliate links */}
          <div className="space-y-3">
            {links.map((link) => (
              <Card
                key={link.id}
                className="cursor-pointer hover:shadow-md transition-shadow duration-200 border-muted hover:border-primary/20"
                onClick={() => handleAffiliateClick(link)}
              >
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    {/* Product placeholder image */}
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 rounded bg-muted flex items-center justify-center text-2xl">
                        {getProviderIcon(link.provider)}
                      </div>
                    </div>

                    {/* Product info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-sm line-clamp-1">
                          {link.productName}
                        </h4>
                        <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0 ml-2" />
                      </div>

                      {link.productDescription && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                          {link.productDescription}
                        </p>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={`text-xs px-2 py-0 ${getProviderColor(link.provider)}`}
                          >
                            {link.provider.replace('_', ' ')}
                          </Badge>

                          {link.price && (
                            <span className="text-sm font-medium text-green-600">
                              ${link.price.toFixed(2)}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <TrendingUp className="h-3 w-3" />
                          {link.clickCount.toLocaleString()} clicks
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Revenue attribution */}
          <div className="pt-3 border-t">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground flex items-center">
                <DollarSign className="mr-1 h-3 w-3" />
                We earn commission from purchases (no extra cost to you)
              </p>
              <Badge variant="outline" className="text-xs">
                {links.length} of {links.length} shown
              </Badge>
            </div>
          </div>

          {/* Premium upgrade prompt */}
          <div className="mt-4 pt-4 border-t">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center">
                    <Crown className="mr-2 h-4 w-4 text-amber-500" />
                    <span className="font-medium text-sm">Unlock Premium Features</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Get advanced analytics, custom links, and revenue tracking
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
                    Limited to 3 links
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <Lock className="mr-1 h-3 w-3" />
                    No custom links
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <Lock className="mr-1 h-3 w-3" />
                    No revenue analytics
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <Lock className="mr-1 h-3 w-3" />
                    No link management
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