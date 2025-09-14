"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  ExternalLink,
  Star,
  Clock,
  ChefHat,
  DollarSign,
  Eye,
  Settings,
  X
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"

interface SponsoredContent {
  id: string
  title: string
  description: string
  imageUrl?: string
  sponsorName: string
  sponsorLogo?: string
  contentType: 'RECIPE' | 'PRODUCT' | 'ARTICLE' | 'VIDEO'
  ctaText: string
  ctaUrl: string
  price?: number
  rating?: number
  cookTime?: number
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD'
  tags: string[]
  isActive: boolean
  impressions: number
  clicks: number
  revenue: number
}

interface SponsoredContentProps {
  recipeId?: string
  category?: string
  placement: 'INLINE' | 'SIDEBAR' | 'FOOTER' | 'RELATED'
  userRole?: string
  isPremiumUser?: boolean
  maxItems?: number
  className?: string
}

export function SponsoredContent({
  recipeId,
  category,
  placement,
  userRole,
  isPremiumUser = false,
  maxItems = 3,
  className = ""
}: SponsoredContentProps) {
  const [content, setContent] = useState<SponsoredContent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    if (isPremiumUser) {
      setIsLoading(false)
      return
    }

    loadSponsoredContent()
  }, [placement, recipeId, category, isPremiumUser])

  const loadSponsoredContent = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams({
        placement,
        limit: maxItems.toString(),
        ...(recipeId && { recipeId }),
        ...(category && { category }),
        active: 'true'
      })

      const response = await fetch(`/api/sponsored-content?${params}`)
      if (response.ok) {
        const contentData = await response.json()
        setContent(contentData)
      }
    } catch (error) {
      console.error('Failed to load sponsored content:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const trackView = async (contentId: string) => {
    try {
      await fetch('/api/sponsored-content/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentId,
          event: 'VIEW',
          placement,
          recipeId,
          timestamp: new Date().toISOString()
        })
      })
    } catch (error) {
      console.error('Failed to track view:', error)
    }
  }

  const trackClick = async (contentId: string) => {
    try {
      await fetch('/api/sponsored-content/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentId,
          event: 'CLICK',
          placement,
          recipeId,
          timestamp: new Date().toISOString()
        })
      })
    } catch (error) {
      console.error('Failed to track click:', error)
    }
  }

  const handleClick = (item: SponsoredContent) => {
    trackClick(item.id)
    window.open(item.ctaUrl, '_blank', 'noopener,noreferrer')
  }

  useEffect(() => {
    content.forEach(item => trackView(item.id))
  }, [content])

  // Don't render for premium users
  if (isPremiumUser) {
    return null
  }

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {Array.from({ length: maxItems }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <Card>
              <div className="p-4">
                <div className="flex gap-3">
                  <div className="w-20 h-20 bg-muted rounded-lg"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                    <div className="h-3 bg-muted rounded w-1/4"></div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        ))}
      </div>
    )
  }

  if (content.length === 0) {
    return null
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center">
          <DollarSign className="mr-2 h-4 w-4 text-muted-foreground" />
          Sponsored
        </h3>

        {userRole && ['ADMIN', 'EDITOR'].includes(userRole) && (
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="h-3 w-3" />
            </Button>

            {showSettings && (
              <Card className="absolute top-8 right-0 w-64 shadow-lg z-20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center justify-between">
                    Sponsored Content Settings
                    <Button variant="ghost" size="sm" onClick={() => setShowSettings(false)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Placement:</span>
                    <span>{placement}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Items:</span>
                    <span>{content.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Revenue:</span>
                    <span>${content.reduce((sum, item) => sum + item.revenue, 0).toFixed(2)}</span>
                  </div>
                  <Button variant="outline" size="sm" className="w-full mt-2">
                    Manage Content
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Sponsored Content Items */}
      <div className="space-y-3">
        {content.map((item) => (
          <SponsoredContentCard
            key={item.id}
            item={item}
            onClick={() => handleClick(item)}
            placement={placement}
          />
        ))}
      </div>

      <div className="text-xs text-muted-foreground text-center pt-2 border-t">
        Sponsored content helps keep this platform free
      </div>
    </div>
  )
}

interface SponsoredContentCardProps {
  item: SponsoredContent
  onClick: () => void
  placement: string
}

function SponsoredContentCard({ item, onClick, placement }: SponsoredContentCardProps) {
  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-all duration-200 border-muted hover:border-primary/20"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex gap-3">
          {/* Content Image */}
          {item.imageUrl && (
            <div className="flex-shrink-0">
              <div className="relative w-20 h-20 rounded-lg overflow-hidden">
                <Image
                  src={item.imageUrl}
                  alt={item.title}
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          )}

          {/* Content Info */}
          <div className="flex-1 min-w-0 space-y-2">
            <div>
              <h4 className="font-medium text-sm line-clamp-2 mb-1">
                {item.title}
              </h4>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {item.description}
              </p>
            </div>

            {/* Metadata */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {item.rating && (
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  {item.rating.toFixed(1)}
                </div>
              )}

              {item.cookTime && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {item.cookTime}min
                </div>
              )}

              {item.difficulty && (
                <Badge variant="outline" className="text-xs px-1 py-0">
                  {item.difficulty.toLowerCase()}
                </Badge>
              )}

              {item.price && (
                <div className="font-medium text-primary">
                  ${item.price.toFixed(2)}
                </div>
              )}
            </div>

            {/* Tags */}
            {item.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {item.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs px-1 py-0">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Sponsor & CTA */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                {item.sponsorLogo && (
                  <Avatar className="w-4 h-4">
                    <AvatarImage src={item.sponsorLogo} alt={item.sponsorName} />
                    <AvatarFallback className="text-xs">
                      {item.sponsorName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                )}
                <span className="text-xs text-muted-foreground">
                  By {item.sponsorName}
                </span>
              </div>

              <div className="flex items-center gap-1 text-xs font-medium text-primary">
                {item.ctaText}
                <ExternalLink className="h-3 w-3" />
              </div>
            </div>
          </div>
        </div>

        {/* Sponsored Label */}
        <div className="mt-2 pt-2 border-t border-muted">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-xs">
              Sponsored
            </Badge>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Eye className="h-3 w-3" />
              {item.impressions.toLocaleString()}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}