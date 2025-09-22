"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DollarSign,
  Users,
  TrendingUp,
  BarChart3,
  FlaskConical,
  Crown,
  ShoppingCart,
  ExternalLink,
  Settings,
  Tag
} from "lucide-react"
import { RevenueTracker } from "@/components/analytics/revenue-tracker"
import { ABTestManager } from "@/components/optimization/ab-test-manager"
import { Unauthorized } from "@/components/auth/unauthorized"

export default function AdminDashboard() {
  const { data: session } = useSession()
  const [selectedTimeframe, setSelectedTimeframe] = useState<'7d' | '30d' | '90d'>('30d')

  // Check if user has admin access
  if (!session?.user?.id || !['ADMIN'].includes(session.user.role)) {
    return <Unauthorized requiredRole="ADMIN" />
  }

  const timeframeOptions = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' }
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-muted-foreground mt-1">
                Revenue analytics, A/B testing, and monetization management
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Timeframe:</span>
                <div className="flex border rounded-lg p-1">
                  {timeframeOptions.map((option) => (
                    <Button
                      key={option.value}
                      variant={selectedTimeframe === option.value ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setSelectedTimeframe(option.value as any)}
                      className="text-xs"
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              <Badge variant="outline" className="bg-amber-50 text-amber-700">
                <Crown className="mr-1 h-3 w-3" />
                Admin Access
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="revenue" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="revenue" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Revenue
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="monetization" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Monetization
            </TabsTrigger>
            <TabsTrigger value="testing" className="flex items-center gap-2">
              <FlaskConical className="h-4 w-4" />
              A/B Testing
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Categories
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Revenue Analytics */}
          <TabsContent value="revenue" className="mt-6">
            <RevenueTracker
              userId={session.user.id}
              userRole={session.user.role}
              timeframe={selectedTimeframe}
            />
          </TabsContent>

          {/* User Analytics */}
          <TabsContent value="users" className="mt-6">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="mr-2 h-5 w-5" />
                    User Growth & Conversion
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">User Analytics Coming Soon</h3>
                    <p className="text-muted-foreground">
                      Detailed user behavior, conversion funnels, and retention metrics
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Monetization Management */}
          <TabsContent value="monetization" className="mt-6">
            <div className="grid gap-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">$2,450</div>
                    <div className="text-sm text-muted-foreground">Monthly Subscriptions</div>
                    <div className="flex items-center justify-center text-xs text-green-600 mt-1">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +12.5%
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-orange-600">$892</div>
                    <div className="text-sm text-muted-foreground">Affiliate Revenue</div>
                    <div className="flex items-center justify-center text-xs text-orange-600 mt-1">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +8.3%
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">$320</div>
                    <div className="text-sm text-muted-foreground">Ad Revenue</div>
                    <div className="flex items-center justify-center text-xs text-blue-600 mt-1">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +5.7%
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">18.5%</div>
                    <div className="text-sm text-muted-foreground">Conversion Rate</div>
                    <div className="flex items-center justify-center text-xs text-purple-600 mt-1">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +2.1%
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Monetization Features */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <ExternalLink className="mr-2 h-5 w-5" />
                      Affiliate Link Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded">
                        <div>
                          <div className="font-medium">Amazon Kitchen Tools</div>
                          <div className="text-sm text-muted-foreground">1,234 clicks • 4.2% conversion</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-600">$180.50</div>
                          <div className="text-xs text-muted-foreground">this month</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded">
                        <div>
                          <div className="font-medium">Williams Sonoma Bakeware</div>
                          <div className="text-sm text-muted-foreground">892 clicks • 3.8% conversion</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-600">$156.20</div>
                          <div className="text-xs text-muted-foreground">this month</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded">
                        <div>
                          <div className="font-medium">Target Grocery Essentials</div>
                          <div className="text-sm text-muted-foreground">2,156 clicks • 2.1% conversion</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-600">$89.30</div>
                          <div className="text-xs text-muted-foreground">this month</div>
                        </div>
                      </div>
                    </div>

                    <Button variant="outline" className="w-full mt-4">
                      Manage Affiliate Links
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Crown className="mr-2 h-5 w-5" />
                      Premium Subscriptions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-blue-50 rounded">
                          <div className="text-xl font-bold text-blue-700">245</div>
                          <div className="text-sm text-blue-600">Premium Users</div>
                          <div className="text-xs text-blue-500">$9.99/month</div>
                        </div>

                        <div className="text-center p-3 bg-purple-50 rounded">
                          <div className="text-xl font-bold text-purple-700">62</div>
                          <div className="text-sm text-purple-600">Pro Users</div>
                          <div className="text-xs text-purple-500">$19.99/month</div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Monthly Recurring Revenue</span>
                          <span className="font-bold">$3,688</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Annual Recurring Revenue</span>
                          <span className="font-bold">$44,256</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Churn Rate</span>
                          <span className="font-bold text-green-600">2.1%</span>
                        </div>
                      </div>
                    </div>

                    <Button variant="outline" className="w-full mt-4">
                      Manage Subscriptions
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* A/B Testing */}
          <TabsContent value="testing" className="mt-6">
            <ABTestManager userRole={session.user.role} />
          </TabsContent>

          {/* Categories */}
          <TabsContent value="categories" className="mt-6">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Tag className="mr-2 h-5 w-5" />
                      Recipe Categories
                    </div>
                    <Button asChild>
                      <a href="/admin/categories">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Manage Categories
                      </a>
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Tag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Category Management</h3>
                    <p className="text-muted-foreground mb-4">
                      Create and organize categories to help users find recipes more easily
                    </p>
                    <Button asChild variant="outline">
                      <a href="/admin/categories">
                        Open Category Manager
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Settings */}
          <TabsContent value="settings" className="mt-6">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="mr-2 h-5 w-5" />
                    Platform Settings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Settings className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Settings Panel Coming Soon</h3>
                    <p className="text-muted-foreground">
                      Configure pricing tiers, feature flags, and platform settings
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}