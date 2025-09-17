"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Globe, Calendar, BarChart3, Settings, ExternalLink, Rocket } from "lucide-react"

interface Site {
  id: string
  name: string
  slug: string
  subdomain: string
  description?: string
  status: string
  category: string
  totalViews: number
  totalPosts: number
  createdAt: string
  _count: {
    blogs: number
  }
}

interface User {
  id: string
  name?: string
  email: string
  role: string
}

interface UserDashboardProps {
  user: User
  sites: Site[]
}

export default function UserDashboard({ user, sites }: UserDashboardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE": return "bg-green-100 text-green-800"
      case "PENDING": return "bg-yellow-100 text-yellow-800"
      case "SUSPENDED": return "bg-red-100 text-red-800"
      case "ARCHIVED": return "bg-gray-100 text-gray-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {user.name || 'User'}!
          </h1>
          <p className="text-muted-foreground">
            {sites.length === 0
              ? "Ready to create your first blog?"
              : `Manage your ${sites.length} site${sites.length > 1 ? 's' : ''}`
            }
          </p>
        </div>

        <Button asChild className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
          <Link href="/create-site">
            <Plus className="h-4 w-4 mr-2" />
            Create New Site
          </Link>
        </Button>
      </div>

      {/* Quick Stats */}
      {sites.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Sites</p>
                  <p className="text-2xl font-bold">{sites.length}</p>
                </div>
                <Globe className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Posts</p>
                  <p className="text-2xl font-bold">
                    {sites.reduce((sum, site) => sum + site._count.blogs, 0)}
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Views</p>
                  <p className="text-2xl font-bold">
                    {sites.reduce((sum, site) => sum + site.totalViews, 0).toLocaleString()}
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* No Sites State */}
      {sites.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <div className="mx-auto w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-6">
              <Rocket className="h-12 w-12 text-blue-600" />
            </div>
            <CardTitle className="text-2xl mb-4">Start Your Blogging Journey</CardTitle>
            <CardDescription className="text-lg mb-6 max-w-md mx-auto">
              Create your own blog site and share your passion with the world. Choose from topics like cooking, technology, lifestyle, and more.
            </CardDescription>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto mb-8">
              <div className="text-center p-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Globe className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold mb-2">Your Own Domain</h3>
                <p className="text-sm text-muted-foreground">Get a personalized subdomain like yoursite.domain.com</p>
              </div>

              <div className="text-center p-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <BarChart3 className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold mb-2">Built-in Analytics</h3>
                <p className="text-sm text-muted-foreground">Track views, engagement, and grow your audience</p>
              </div>

              <div className="text-center p-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Settings className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-semibold mb-2">Easy Customization</h3>
                <p className="text-sm text-muted-foreground">Customize themes, colors, and layout to match your style</p>
              </div>
            </div>

            <div className="space-y-3">
              <Button asChild size="lg" className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                <Link href="/create-site">
                  <Plus className="h-5 w-5 mr-2" />
                  Create Your First Site
                </Link>
              </Button>
              <div>
                <Button variant="outline" asChild>
                  <Link href="/discover">
                    Explore Other Sites
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sites List */}
      {sites.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Your Sites</CardTitle>
              <Button variant="outline" asChild>
                <Link href="/create-site">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Site
                </Link>
              </Button>
            </div>
            <CardDescription>
              Manage and view analytics for all your blog sites
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sites.map((site) => (
                <div key={site.id} className="border rounded-lg p-6 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                          style={{ backgroundColor: "#3b82f6" }}
                        >
                          {site.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">{site.name}</h3>
                            <Badge className={getStatusColor(site.status)}>
                              {site.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Globe className="h-3 w-3" />
                              {site.subdomain}.yourdomain.com
                            </span>
                            <span>•</span>
                            <span className="capitalize">{site.category}</span>
                          </div>
                        </div>
                      </div>

                      {site.description && (
                        <p className="text-muted-foreground mb-3 line-clamp-2">
                          {site.description}
                        </p>
                      )}

                      <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <span>{site._count.blogs} posts</span>
                        <span>{site.totalViews.toLocaleString()} views</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Created {new Date(site.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/${site.subdomain}`} target="_blank">
                          <ExternalLink className="h-4 w-4 mr-1" />
                          View
                        </Link>
                      </Button>
                      <Button size="sm" asChild>
                        <Link href={`/sites/${site.id}/admin`}>
                          <BarChart3 className="h-4 w-4 mr-1" />
                          Manage
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}