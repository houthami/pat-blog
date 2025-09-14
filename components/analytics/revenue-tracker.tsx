"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  ShoppingCart,
  ExternalLink,
  Crown,
  BarChart3
} from "lucide-react"

interface RevenueMetrics {
  totalRevenue: number
  subscriptionRevenue: number
  affiliateRevenue: number
  adRevenue: number
  monthlyGrowth: number
  userMetrics: {
    totalUsers: number
    freeUsers: number
    premiumUsers: number
    conversionRate: number
  }
  affiliateMetrics: {
    totalClicks: number
    totalConversions: number
    conversionRate: number
    averageCommission: number
  }
  topPerformers: {
    affiliateLinks: Array<{
      id: string
      productName: string
      revenue: number
      clicks: number
      conversionRate: number
    }>
    recipes: Array<{
      id: string
      title: string
      affiliateRevenue: number
      views: number
    }>
  }
}

interface RevenueTrackerProps {
  userId: string
  userRole: string
  timeframe: '7d' | '30d' | '90d'
  className?: string
}

export function RevenueTracker({
  userId,
  userRole,
  timeframe = '30d',
  className = ""
}: RevenueTrackerProps) {
  const [metrics, setMetrics] = useState<RevenueMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedMetric, setSelectedMetric] = useState<'overview' | 'affiliate' | 'subscription'>('overview')

  useEffect(() => {
    if (['ADMIN', 'EDITOR'].includes(userRole)) {
      loadRevenueMetrics()
    }
  }, [timeframe, userRole])

  const loadRevenueMetrics = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/analytics/revenue?timeframe=${timeframe}`)

      if (response.ok) {
        const data = await response.json()
        setMetrics(data)
      }
    } catch (error) {
      console.error('Failed to load revenue metrics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!['ADMIN', 'EDITOR'].includes(userRole)) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <Crown className="w-8 h-8 text-amber-500 mx-auto mb-2" />
          <h4 className="text-sm font-medium mb-1">Premium Analytics</h4>
          <p className="text-xs text-muted-foreground">
            Revenue tracking is available for Pro subscribers
          </p>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="animate-pulse">
          <Card>
            <CardHeader className="pb-2">
              <div className="h-6 bg-muted rounded w-1/3"></div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-8 bg-muted rounded"></div>
                    <div className="h-4 bg-muted rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!metrics) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <BarChart3 className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <h4 className="text-sm font-medium mb-1">No Revenue Data</h4>
          <p className="text-xs text-muted-foreground">
            Start generating revenue to see analytics here
          </p>
        </CardContent>
      </Card>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Revenue Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <DollarSign className="mr-2 h-5 w-5" />
              Revenue Overview
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{timeframe.toUpperCase()}</Badge>
              {metrics.monthlyGrowth > 0 ? (
                <div className="flex items-center text-green-600">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  +{formatPercentage(metrics.monthlyGrowth)}
                </div>
              ) : (
                <div className="flex items-center text-red-600">
                  <TrendingDown className="h-4 w-4 mr-1" />
                  {formatPercentage(metrics.monthlyGrowth)}
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-700">
                {formatCurrency(metrics.totalRevenue)}
              </div>
              <div className="text-sm text-green-600">Total Revenue</div>
            </div>

            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-700">
                {formatCurrency(metrics.subscriptionRevenue)}
              </div>
              <div className="text-sm text-blue-600">Subscriptions</div>
              <div className="text-xs text-blue-500 mt-1">
                {formatPercentage((metrics.subscriptionRevenue / metrics.totalRevenue) * 100)}
              </div>
            </div>

            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-700">
                {formatCurrency(metrics.affiliateRevenue)}
              </div>
              <div className="text-sm text-orange-600">Affiliates</div>
              <div className="text-xs text-orange-500 mt-1">
                {formatPercentage((metrics.affiliateRevenue / metrics.totalRevenue) * 100)}
              </div>
            </div>

            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-700">
                {formatCurrency(metrics.adRevenue)}
              </div>
              <div className="text-sm text-purple-600">Advertising</div>
              <div className="text-xs text-purple-500 mt-1">
                {formatPercentage((metrics.adRevenue / metrics.totalRevenue) * 100)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="mr-2 h-5 w-5" />
            User Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-xl font-bold">{metrics.userMetrics.totalUsers.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Total Users</div>
            </div>

            <div className="text-center">
              <div className="text-xl font-bold text-gray-600">{metrics.userMetrics.freeUsers.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Free Users</div>
            </div>

            <div className="text-center">
              <div className="text-xl font-bold text-blue-600">{metrics.userMetrics.premiumUsers.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Premium Users</div>
            </div>

            <div className="text-center">
              <div className="text-xl font-bold text-green-600">
                {formatPercentage(metrics.userMetrics.conversionRate)}
              </div>
              <div className="text-sm text-muted-foreground">Conversion Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Affiliate Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ExternalLink className="mr-2 h-5 w-5" />
            Affiliate Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-xl font-bold">{metrics.affiliateMetrics.totalClicks.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Total Clicks</div>
            </div>

            <div className="text-center">
              <div className="text-xl font-bold text-green-600">{metrics.affiliateMetrics.totalConversions.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Conversions</div>
            </div>

            <div className="text-center">
              <div className="text-xl font-bold text-blue-600">
                {formatPercentage(metrics.affiliateMetrics.conversionRate)}
              </div>
              <div className="text-sm text-muted-foreground">Conversion Rate</div>
            </div>

            <div className="text-center">
              <div className="text-xl font-bold text-orange-600">
                {formatCurrency(metrics.affiliateMetrics.averageCommission)}
              </div>
              <div className="text-sm text-muted-foreground">Avg Commission</div>
            </div>
          </div>

          <Separator className="my-4" />

          {/* Top Performing Links */}
          <div className="space-y-4">
            <h4 className="font-medium">Top Performing Affiliate Links</h4>
            <div className="space-y-2">
              {metrics.topPerformers.affiliateLinks.map((link, index) => (
                <div key={link.id} className="flex items-center justify-between p-3 bg-muted/50 rounded">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{link.productName}</div>
                      <div className="text-xs text-muted-foreground">
                        {link.clicks} clicks • {formatPercentage(link.conversionRate)} conversion
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-600">{formatCurrency(link.revenue)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Performing Recipes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ShoppingCart className="mr-2 h-5 w-5" />
            Top Revenue-Generating Recipes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {metrics.topPerformers.recipes.map((recipe, index) => (
              <div key={recipe.id} className="flex items-center justify-between p-3 bg-muted/50 rounded">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-orange-500 text-white text-xs flex items-center justify-center">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{recipe.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {recipe.views.toLocaleString()} views
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-orange-600">{formatCurrency(recipe.affiliateRevenue)}</div>
                  <div className="text-xs text-muted-foreground">affiliate revenue</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}