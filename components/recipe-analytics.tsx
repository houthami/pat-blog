"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { 
  Eye, Clock, TrendingUp, Globe2, Smartphone, Monitor, Tablet, 
  MousePointer, Heart, Share, Printer, Bookmark, Copy, ExternalLink,
  DollarSign, Users, Target, BarChart3, PieChart, MapPin, Activity
} from "lucide-react"

interface RecipeAnalytics {
  overview: {
    totalViews: number
    uniqueVisitors: number
    avgTimeSpent: number
    avgScrollDepth: number
    bounceRate: number
    engagementScore: number
    revenue: {
      total: number
      transactions: number
    }
  }
  geography: {
    countries: Array<{ country: string; views: number }>
    cities: Array<{ city: string; country: string; views: number }>
  }
  technology: {
    devices: Array<{ device: string; views: number }>
  }
  timeline: {
    dailyViews: Array<{ date: string; views: number }>
  }
  interactions: Array<{ type: string; count: number }>
}

interface RecipeAnalyticsProps {
  recipeId: string
  recipeTitle: string
  onClose: () => void
}

export function RecipeAnalytics({ recipeId, recipeTitle, onClose }: RecipeAnalyticsProps) {
  const [analytics, setAnalytics] = useState<RecipeAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [period, setPeriod] = useState("30")

  useEffect(() => {
    fetchAnalytics()
  }, [recipeId, period])

  const fetchAnalytics = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/analytics/recipe/${recipeId}?period=${period}`)
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getDeviceIcon = (device: string) => {
    switch (device.toLowerCase()) {
      case 'mobile': return <Smartphone className="h-4 w-4" />
      case 'tablet': return <Tablet className="h-4 w-4" />
      case 'desktop': return <Monitor className="h-4 w-4" />
      default: return <Monitor className="h-4 w-4" />
    }
  }

  const getInteractionIcon = (type: string) => {
    switch (type) {
      case 'like': return <Heart className="h-4 w-4" />
      case 'share': return <Share className="h-4 w-4" />
      case 'print': return <Printer className="h-4 w-4" />
      case 'save': return <Bookmark className="h-4 w-4" />
      case 'copy_ingredients': return <Copy className="h-4 w-4" />
      case 'copy_url': return <ExternalLink className="h-4 w-4" />
      default: return <MousePointer className="h-4 w-4" />
    }
  }

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`
  }

  const getEngagementColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-50"
    if (score >= 60) return "text-blue-600 bg-blue-50"
    if (score >= 40) return "text-yellow-600 bg-yellow-50"
    return "text-red-600 bg-red-50"
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="w-full max-w-6xl max-h-[90vh] overflow-hidden">
          <CardHeader>
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-muted rounded w-1/3" />
              <div className="h-4 bg-muted rounded w-1/2" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse space-y-6">
              <div className="grid grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-24 bg-muted rounded" />
                ))}
              </div>
              <div className="h-64 bg-muted rounded" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p>Failed to load analytics data</p>
            <Button onClick={onClose} className="mt-4">Close</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { overview, geography, technology, interactions } = analytics

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-7xl max-h-[95vh] overflow-y-auto">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Recipe Analytics: {recipeTitle}
              </CardTitle>
              <CardDescription>
                Detailed insights and performance metrics
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="365">Last year</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={onClose}>Close</Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <Eye className="h-5 w-5 text-blue-600" />
                  <Badge variant="outline" className="text-xs">Total</Badge>
                </div>
                <div className="mt-2">
                  <div className="text-2xl font-bold text-blue-900">
                    {overview.totalViews.toLocaleString()}
                  </div>
                  <p className="text-sm text-blue-600">Views</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <Users className="h-5 w-5 text-green-600" />
                  <Badge variant="outline" className="text-xs">Unique</Badge>
                </div>
                <div className="mt-2">
                  <div className="text-2xl font-bold text-green-900">
                    {overview.uniqueVisitors.toLocaleString()}
                  </div>
                  <p className="text-sm text-green-600">Visitors</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <Clock className="h-5 w-5 text-purple-600" />
                  <Badge variant="outline" className="text-xs">Avg</Badge>
                </div>
                <div className="mt-2">
                  <div className="text-2xl font-bold text-purple-900">
                    {formatDuration(overview.avgTimeSpent)}
                  </div>
                  <p className="text-sm text-purple-600">Time Spent</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <Activity className="h-5 w-5 text-orange-600" />
                  <Badge variant="outline" className="text-xs">Score</Badge>
                </div>
                <div className="mt-2">
                  <div className={`text-2xl font-bold rounded px-2 py-1 ${getEngagementColor(overview.engagementScore)}`}>
                    {overview.engagementScore}
                  </div>
                  <p className="text-sm text-orange-600">Engagement</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <Target className="h-5 w-5 text-red-600" />
                  <Badge variant="outline" className="text-xs">Rate</Badge>
                </div>
                <div className="mt-2">
                  <div className="text-2xl font-bold text-red-900">
                    {overview.bounceRate}%
                  </div>
                  <p className="text-sm text-red-600">Bounce</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <DollarSign className="h-5 w-5 text-emerald-600" />
                  <Badge variant="outline" className="text-xs">Revenue</Badge>
                </div>
                <div className="mt-2">
                  <div className="text-2xl font-bold text-emerald-900">
                    ${overview.revenue.total.toFixed(2)}
                  </div>
                  <p className="text-sm text-emerald-600">
                    {overview.revenue.transactions} transactions
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Geographic Data */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe2 className="h-4 w-4" />
                  Top Locations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <MapPin className="h-3 w-3" />
                    Countries
                  </h4>
                  <div className="space-y-2">
                    {geography.countries.slice(0, 5).map((country, index) => (
                      <div key={country.country} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="w-6 h-6 text-xs p-0 flex items-center justify-center">
                            {index + 1}
                          </Badge>
                          <span className="text-sm">{country.country}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-muted rounded-full">
                            <div 
                              className="h-full bg-blue-500 rounded-full"
                              style={{ width: `${(country.views / geography.countries[0]?.views) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground w-12 text-right">
                            {country.views}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="text-sm font-medium mb-3">Cities</h4>
                  <div className="space-y-2">
                    {geography.cities.slice(0, 5).map((city, index) => (
                      <div key={`${city.city}-${city.country}`} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="w-6 h-6 text-xs p-0 flex items-center justify-center">
                            {index + 1}
                          </Badge>
                          <span className="text-sm">{city.city}, {city.country}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">{city.views}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Device & Interactions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-4 w-4" />
                  Devices & Engagement
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-3">Device Breakdown</h4>
                  <div className="space-y-3">
                    {technology.devices.map((device) => {
                      const percentage = (device.views / overview.totalViews) * 100
                      return (
                        <div key={device.device} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {getDeviceIcon(device.device)}
                              <span className="text-sm capitalize">{device.device}</span>
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {device.views} ({percentage.toFixed(1)}%)
                            </span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      )
                    })}
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="text-sm font-medium mb-3">User Interactions</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {interactions.map((interaction) => (
                      <div key={interaction.type} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                        <div className="flex items-center gap-2">
                          {getInteractionIcon(interaction.type)}
                          <span className="text-xs capitalize">{interaction.type.replace('_', ' ')}</span>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {interaction.count}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {overview.avgScrollDepth}%
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Average Scroll Depth</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Users scroll through {overview.avgScrollDepth}% of your recipe on average
                  </p>
                </div>
                
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {(overview.uniqueVisitors / overview.totalViews * 100).toFixed(1)}%
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Unique Visitor Rate</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Percentage of unique visitors vs total views
                  </p>
                </div>
                
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    ${(overview.revenue.total / overview.totalViews).toFixed(3)}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Revenue per View</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Average revenue generated per recipe view
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  )
}