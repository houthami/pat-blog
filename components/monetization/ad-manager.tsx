"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Eye,
  DollarSign,
  TrendingUp,
  Settings,
  X,
  ExternalLink,
  Target,
  BarChart3
} from "lucide-react"

interface Ad {
  id: string
  title: string
  description: string
  imageUrl?: string
  clickUrl: string
  provider: 'GOOGLE_ADSENSE' | 'AMAZON' | 'DIRECT' | 'AFFILIATE'
  placement: 'BANNER' | 'SIDEBAR' | 'CONTENT' | 'FOOTER'
  isActive: boolean
  impressions: number
  clicks: number
  revenue: number
  ctr: number
}

interface AdManagerProps {
  recipeId?: string
  placement: 'BANNER' | 'SIDEBAR' | 'CONTENT' | 'FOOTER'
  userRole?: string
  isPremiumUser?: boolean
  className?: string
}

export function AdManager({
  recipeId,
  placement,
  userRole,
  isPremiumUser = false,
  className = ""
}: AdManagerProps) {
  const [ads, setAds] = useState<Ad[]>([])
  const [currentAd, setCurrentAd] = useState<Ad | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    if (isPremiumUser) {
      // Premium users don't see ads
      setIsLoading(false)
      return
    }

    loadAds()
  }, [placement, recipeId, isPremiumUser])

  const loadAds = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams({
        placement,
        ...(recipeId && { recipeId }),
        active: 'true'
      })

      const response = await fetch(`/api/ads?${params}`)
      if (response.ok) {
        const adsData = await response.json()
        setAds(adsData)

        // Select ad based on targeting logic
        if (adsData.length > 0) {
          const selectedAd = selectOptimalAd(adsData)
          setCurrentAd(selectedAd)
        }
      }
    } catch (error) {
      console.error('Failed to load ads:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const selectOptimalAd = (availableAds: Ad[]): Ad => {
    // Simple ad selection algorithm - in production use more sophisticated targeting
    const weightedAds = availableAds.map(ad => ({
      ...ad,
      weight: calculateAdWeight(ad)
    }))

    // Sort by weight and add some randomization
    const sortedAds = weightedAds.sort((a, b) => b.weight - a.weight)
    const topAds = sortedAds.slice(0, Math.min(3, sortedAds.length))

    return topAds[Math.floor(Math.random() * topAds.length)]
  }

  const calculateAdWeight = (ad: Ad): number => {
    let weight = ad.revenue * 10 // Higher paying ads get more weight
    weight += (100 - ad.ctr) // Balance CTR - not too high or too low
    weight *= ad.isActive ? 1 : 0
    return weight
  }

  const trackAdView = async (ad: Ad) => {
    try {
      await fetch('/api/ads/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adId: ad.id,
          event: 'IMPRESSION',
          placement,
          recipeId,
          timestamp: new Date().toISOString()
        })
      })
    } catch (error) {
      console.error('Failed to track ad view:', error)
    }
  }

  const trackAdClick = async (ad: Ad) => {
    try {
      await fetch('/api/ads/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adId: ad.id,
          event: 'CLICK',
          placement,
          recipeId,
          timestamp: new Date().toISOString()
        })
      })
    } catch (error) {
      console.error('Failed to track ad click:', error)
    }
  }

  const handleAdClick = (ad: Ad) => {
    trackAdClick(ad)
    window.open(ad.clickUrl, '_blank', 'noopener,noreferrer')
  }

  useEffect(() => {
    if (currentAd) {
      trackAdView(currentAd)
    }
  }, [currentAd])

  // Don't render ads for premium users
  if (isPremiumUser) {
    return null
  }

  // Don't render if no ad available
  if (!currentAd && !isLoading) {
    return null
  }

  if (isLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="bg-muted rounded-lg p-4">
          <div className="h-20 bg-muted-foreground/20 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      {/* Admin Controls */}
      {userRole && ['ADMIN', 'EDITOR'].includes(userRole) && (
        <div className="absolute top-2 right-2 z-10">
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
                  Ad Settings
                  <Button variant="ghost" size="sm" onClick={() => setShowSettings(false)}>
                    <X className="h-3 w-3" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Provider:</span>
                  <Badge variant="outline">{currentAd?.provider}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Placement:</span>
                  <span>{currentAd?.placement}</span>
                </div>
                <div className="flex justify-between">
                  <span>CTR:</span>
                  <span>{currentAd?.ctr.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Revenue:</span>
                  <span>${currentAd?.revenue.toFixed(2)}</span>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-2">
                  <BarChart3 className="mr-2 h-3 w-3" />
                  View Analytics
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Ad Content */}
      <Card
        className="cursor-pointer hover:shadow-md transition-shadow duration-200 border-muted"
        onClick={() => currentAd && handleAdClick(currentAd)}
      >
        <div className="p-3">
          <div className="flex items-start gap-3">
            {currentAd?.imageUrl && (
              <div className="flex-shrink-0">
                <img
                  src={currentAd.imageUrl}
                  alt={currentAd.title}
                  className="w-16 h-16 rounded object-cover"
                />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-medium text-sm line-clamp-1">
                  {currentAd?.title}
                </h4>
                <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0 ml-1" />
              </div>

              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                {currentAd?.description}
              </p>

              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="text-xs">
                  Sponsored
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {getProviderDisplayName(currentAd?.provider)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Ad Label */}
      <div className="text-xs text-muted-foreground text-center mt-1">
        Advertisement
      </div>
    </div>
  )
}

// Render different ad layouts based on placement
export function BannerAd(props: Omit<AdManagerProps, 'placement'>) {
  return (
    <AdManager
      {...props}
      placement="BANNER"
      className="w-full max-w-4xl mx-auto"
    />
  )
}

export function SidebarAd(props: Omit<AdManagerProps, 'placement'>) {
  return (
    <AdManager
      {...props}
      placement="SIDEBAR"
      className="w-full"
    />
  )
}

export function ContentAd(props: Omit<AdManagerProps, 'placement'>) {
  return (
    <AdManager
      {...props}
      placement="CONTENT"
      className="my-6"
    />
  )
}

export function FooterAd(props: Omit<AdManagerProps, 'placement'>) {
  return (
    <AdManager
      {...props}
      placement="FOOTER"
      className="mt-8"
    />
  )
}

function getProviderDisplayName(provider?: string): string {
  const displayNames = {
    'GOOGLE_ADSENSE': 'Google AdSense',
    'AMAZON': 'Amazon Associates',
    'DIRECT': 'Direct',
    'AFFILIATE': 'Affiliate'
  }

  return displayNames[provider as keyof typeof displayNames] || 'Unknown'
}