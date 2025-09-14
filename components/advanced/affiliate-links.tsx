"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
  ExternalLink,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  Eye,
  EyeOff,
  Plus,
  Edit,
  Trash2,
  AlertCircle
} from "lucide-react"
import { toast } from "sonner"

interface AffiliateLink {
  id: string
  productName: string
  productId?: string
  imageUrl?: string
  affiliateUrl: string
  provider: string
  commission?: number
  clickCount: number
  conversionCount: number
  revenue: number
  categories: string[]
  keywords: string[]
  isActive: boolean
  expiresAt?: string
}

interface AffiliateSuggestion {
  ingredient: string
  matchedLinks: AffiliateLink[]
  confidence: number
}

interface AffiliateLinksProps {
  recipeId: string
  ingredients: string[]
  isEditable?: boolean
  showRevenue?: boolean
}

export function AffiliateLinks({
  recipeId,
  ingredients,
  isEditable = false,
  showRevenue = false
}: AffiliateLinksProps) {
  const [affiliateLinks, setAffiliateLinks] = useState<AffiliateLink[]>([])
  const [suggestions, setSuggestions] = useState<AffiliateSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [editingLink, setEditingLink] = useState<AffiliateLink | null>(null)
  const [newLink, setNewLink] = useState({
    productName: '',
    affiliateUrl: '',
    provider: '',
    keywords: '',
    categories: '',
    commission: ''
  })

  useEffect(() => {
    fetchAffiliateLinks()
    if (ingredients.length > 0) {
      generateSuggestions()
    }
  }, [recipeId, ingredients])

  const fetchAffiliateLinks = async () => {
    try {
      const response = await fetch(`/api/recipes/${recipeId}/affiliate-links`)
      if (response.ok) {
        const data = await response.json()
        setAffiliateLinks(data)
      }
    } catch (error) {
      console.error('Failed to fetch affiliate links:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const generateSuggestions = async () => {
    try {
      const response = await fetch('/api/affiliate-links/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients, recipeId })
      })

      if (response.ok) {
        const data = await response.json()
        setSuggestions(data)
      }
    } catch (error) {
      console.error('Failed to generate suggestions:', error)
    }
  }

  const addAffiliateLink = async (linkData: Partial<AffiliateLink>) => {
    try {
      const response = await fetch(`/api/recipes/${recipeId}/affiliate-links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(linkData)
      })

      if (response.ok) {
        const newAffiliateLink = await response.json()
        setAffiliateLinks(prev => [...prev, newAffiliateLink])
        toast.success("Affiliate link added!")
      }
    } catch (error) {
      console.error('Failed to add affiliate link:', error)
      toast.error("Failed to add affiliate link")
    }
  }

  const updateAffiliateLink = async (linkId: string, updates: Partial<AffiliateLink>) => {
    try {
      const response = await fetch(`/api/affiliate-links/${linkId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (response.ok) {
        const updatedLink = await response.json()
        setAffiliateLinks(prev =>
          prev.map(link => link.id === linkId ? updatedLink : link)
        )
        toast.success("Affiliate link updated!")
      }
    } catch (error) {
      console.error('Failed to update affiliate link:', error)
      toast.error("Failed to update affiliate link")
    }
  }

  const deleteAffiliateLink = async (linkId: string) => {
    if (!confirm("Are you sure you want to delete this affiliate link?")) return

    try {
      const response = await fetch(`/api/affiliate-links/${linkId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setAffiliateLinks(prev => prev.filter(link => link.id !== linkId))
        toast.success("Affiliate link deleted!")
      }
    } catch (error) {
      console.error('Failed to delete affiliate link:', error)
      toast.error("Failed to delete affiliate link")
    }
  }

  const acceptSuggestion = (suggestion: AffiliateSuggestion, link: AffiliateLink) => {
    addAffiliateLink({
      ...link,
      keywords: [...link.keywords, suggestion.ingredient]
    })
  }

  const toggleLinkActive = (linkId: string, isActive: boolean) => {
    updateAffiliateLink(linkId, { isActive })
  }

  const trackClick = async (linkId: string, affiliateUrl: string) => {
    // Track click for analytics
    try {
      await fetch(`/api/affiliate-links/${linkId}/click`, {
        method: 'POST'
      })
    } catch (error) {
      console.error('Failed to track click:', error)
    }

    // Open affiliate link
    window.open(affiliateUrl, '_blank', 'noopener,noreferrer')
  }

  const createNewLink = async () => {
    if (!newLink.productName || !newLink.affiliateUrl) {
      toast.error("Product name and affiliate URL are required")
      return
    }

    const linkData = {
      productName: newLink.productName,
      affiliateUrl: newLink.affiliateUrl,
      provider: newLink.provider || 'custom',
      keywords: newLink.keywords.split(',').map(k => k.trim()).filter(Boolean),
      categories: newLink.categories.split(',').map(c => c.trim()).filter(Boolean),
      commission: newLink.commission ? parseFloat(newLink.commission) / 100 : undefined
    }

    await addAffiliateLink(linkData)

    // Reset form
    setNewLink({
      productName: '',
      affiliateUrl: '',
      provider: '',
      keywords: '',
      categories: '',
      commission: ''
    })
  }

  const getProviderBadge = (provider: string) => {
    const colors = {
      amazon: "bg-orange-100 text-orange-800 border-orange-200",
      instacart: "bg-green-100 text-green-800 border-green-200",
      "williams-sonoma": "bg-blue-100 text-blue-800 border-blue-200",
      target: "bg-red-100 text-red-800 border-red-200",
      custom: "bg-gray-100 text-gray-800 border-gray-200"
    }
    return colors[provider.toLowerCase()] || colors.custom
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-muted rounded" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Suggestions */}
      {suggestions.length > 0 && showSuggestions && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <ShoppingBag className="mr-2 h-5 w-5" />
                Affiliate Link Suggestions
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSuggestions(false)}
              >
                <EyeOff className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {suggestions.map((suggestion, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="font-medium">{suggestion.ingredient}</span>
                    <Badge variant="outline" className="ml-2">
                      {Math.round(suggestion.confidence * 100)}% match
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {suggestion.matchedLinks.slice(0, 4).map(link => (
                    <div
                      key={link.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{link.productName}</div>
                        <div className="text-sm text-muted-foreground">
                          <Badge variant="outline" className={`text-xs ${getProviderBadge(link.provider)}`}>
                            {link.provider}
                          </Badge>
                          {link.commission && (
                            <span className="ml-2">{(link.commission * 100).toFixed(1)}% commission</span>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => acceptSuggestion(suggestion, link)}
                      >
                        <Plus className="mr-1 h-3 w-3" />
                        Add
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Current Affiliate Links */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <ExternalLink className="mr-2 h-5 w-5" />
              Affiliate Links ({affiliateLinks.length})
            </CardTitle>
            {showRevenue && (
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Total Revenue</div>
                <div className="text-lg font-semibold text-green-600">
                  ${affiliateLinks.reduce((sum, link) => sum + link.revenue, 0).toFixed(2)}
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {affiliateLinks.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No affiliate links yet</h3>
              <p className="text-muted-foreground">
                Add affiliate links to monetize your recipe ingredients
              </p>
            </div>
          ) : (
            affiliateLinks.map(link => (
              <div
                key={link.id}
                className={`border rounded-lg p-4 ${!link.isActive ? 'opacity-60' : ''}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {link.imageUrl && (
                      <img
                        src={link.imageUrl}
                        alt={link.productName}
                        className="w-12 h-12 object-cover rounded"
                      />
                    )}
                    <div>
                      <div className="font-medium">{link.productName}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className={`text-xs ${getProviderBadge(link.provider)}`}>
                          {link.provider}
                        </Badge>
                        {link.commission && (
                          <span className="text-xs text-green-600">
                            {(link.commission * 100).toFixed(1)}% commission
                          </span>
                        )}
                        {link.expiresAt && new Date(link.expiresAt) < new Date() && (
                          <Badge variant="destructive" className="text-xs">
                            Expired
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isEditable && (
                      <Switch
                        checked={link.isActive}
                        onCheckedChange={(checked) => toggleLinkActive(link.id, checked)}
                      />
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => trackClick(link.id, link.affiliateUrl)}
                    >
                      <ExternalLink className="mr-1 h-3 w-3" />
                      Visit
                    </Button>
                    {isEditable && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingLink(link)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteAffiliateLink(link.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Performance Metrics */}
                {showRevenue && (
                  <div className="grid grid-cols-3 gap-4 mt-3 pt-3 border-t">
                    <div className="text-center">
                      <div className="text-lg font-semibold">{link.clickCount}</div>
                      <div className="text-xs text-muted-foreground">Clicks</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold">{link.conversionCount}</div>
                      <div className="text-xs text-muted-foreground">Conversions</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-green-600">
                        ${link.revenue.toFixed(2)}
                      </div>
                      <div className="text-xs text-muted-foreground">Revenue</div>
                    </div>
                  </div>
                )}

                {/* Keywords */}
                {link.keywords.length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="text-sm text-muted-foreground mb-1">Matches:</div>
                    <div className="flex flex-wrap gap-1">
                      {link.keywords.map((keyword, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}

          {/* Add New Link Form */}
          {isEditable && (
            <>
              <Separator />
              <div className="space-y-4">
                <h4 className="font-medium">Add New Affiliate Link</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    placeholder="Product name"
                    value={newLink.productName}
                    onChange={(e) => setNewLink(prev => ({ ...prev, productName: e.target.value }))}
                  />
                  <Input
                    placeholder="Provider (e.g., Amazon, Instacart)"
                    value={newLink.provider}
                    onChange={(e) => setNewLink(prev => ({ ...prev, provider: e.target.value }))}
                  />
                  <Input
                    placeholder="Commission % (optional)"
                    type="number"
                    value={newLink.commission}
                    onChange={(e) => setNewLink(prev => ({ ...prev, commission: e.target.value }))}
                  />
                  <Input
                    placeholder="Keywords (comma-separated)"
                    value={newLink.keywords}
                    onChange={(e) => setNewLink(prev => ({ ...prev, keywords: e.target.value }))}
                  />
                </div>
                <Textarea
                  placeholder="Affiliate URL"
                  value={newLink.affiliateUrl}
                  onChange={(e) => setNewLink(prev => ({ ...prev, affiliateUrl: e.target.value }))}
                />
                <Button onClick={createNewLink}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Affiliate Link
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Monetization Tips */}
      {isEditable && affiliateLinks.length === 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-1" />
              <div>
                <h4 className="font-medium text-blue-900 mb-2">Maximize Your Affiliate Revenue</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Link to high-quality kitchen tools and unique ingredients</li>
                  <li>• Use Amazon Associates for general ingredients and tools</li>
                  <li>• Partner with grocery delivery services like Instacart</li>
                  <li>• Include specialty items that readers might not have</li>
                  <li>• Match affiliate links to recipe difficulty and audience</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}