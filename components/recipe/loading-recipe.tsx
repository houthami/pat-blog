"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"

export function LoadingRecipe() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto animate-pulse">
          {/* Header skeleton */}
          <div className="mb-8">
            <div className="h-10 bg-muted rounded w-3/4 mb-4" />
            <div className="h-6 bg-muted rounded w-1/2 mb-4" />
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-muted rounded-full" />
              <div className="h-4 bg-muted rounded w-24" />
              <div className="h-4 bg-muted rounded w-32" />
            </div>
          </div>

          {/* Image skeleton */}
          <div className="aspect-video bg-muted rounded-lg mb-8" />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Content skeleton */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-32" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-4 bg-muted rounded w-full" />
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-32" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="flex gap-4">
                        <div className="w-8 h-8 bg-muted rounded-full flex-shrink-0" />
                        <div className="flex-1">
                          <div className="h-4 bg-muted rounded w-full mb-2" />
                          <div className="h-4 bg-muted rounded w-3/4" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar skeleton */}
            <div className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <div className="h-6 bg-muted rounded w-24 mb-4" />
                  <div className="space-y-3">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-10 bg-muted rounded w-full" />
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="h-6 bg-muted rounded w-24 mb-4" />
                  <div className="h-32 bg-muted rounded w-full" />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}