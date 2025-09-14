"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
  FlaskConical,
  Target,
  TrendingUp,
  TrendingDown,
  Users,
  Zap,
  Crown,
  BarChart3
} from "lucide-react"

interface ABTest {
  id: string
  name: string
  description: string
  status: 'DRAFT' | 'RUNNING' | 'COMPLETED' | 'PAUSED'
  type: 'UPGRADE_PROMPT' | 'AFFILIATE_PLACEMENT' | 'PRICING' | 'FEATURE_ACCESS'
  variants: Array<{
    id: string
    name: string
    description: string
    trafficAllocation: number
    conversions: number
    impressions: number
    conversionRate: number
    isControl: boolean
  }>
  metrics: {
    totalImpressions: number
    totalConversions: number
    overallConversionRate: number
    statisticalSignificance: number
    confidenceLevel: number
  }
  startDate: string
  endDate?: string
  createdAt: string
}

interface ABTestManagerProps {
  userRole: string
  className?: string
}

export function ABTestManager({ userRole, className = "" }: ABTestManagerProps) {
  const [tests, setTests] = useState<ABTest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTest, setSelectedTest] = useState<ABTest | null>(null)

  useEffect(() => {
    if (['ADMIN'].includes(userRole)) {
      loadABTests()
    }
  }, [userRole])

  const loadABTests = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/ab-tests')

      if (response.ok) {
        const data = await response.json()
        setTests(data)
      }
    } catch (error) {
      console.error('Failed to load A/B tests:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleTestStatus = async (testId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'RUNNING' ? 'PAUSED' : 'RUNNING'

    try {
      const response = await fetch(`/api/ab-tests/${testId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        setTests(tests.map(test =>
          test.id === testId ? { ...test, status: newStatus } : test
        ))
      }
    } catch (error) {
      console.error('Failed to toggle test status:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RUNNING': return 'bg-green-100 text-green-800'
      case 'PAUSED': return 'bg-yellow-100 text-yellow-800'
      case 'COMPLETED': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getWinningVariant = (test: ABTest) => {
    return test.variants.reduce((winner, current) =>
      current.conversionRate > winner.conversionRate ? current : winner
    )
  }

  const formatPercentage = (value: number) => `${value.toFixed(2)}%`

  if (!['ADMIN'].includes(userRole)) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <Crown className="w-8 h-8 text-amber-500 mx-auto mb-2" />
          <h4 className="text-sm font-medium mb-1">Admin Only</h4>
          <p className="text-xs text-muted-foreground">
            A/B testing is available for administrators only
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
            <CardHeader>
              <div className="h-6 bg-muted rounded w-1/3"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-20 bg-muted rounded"></div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <FlaskConical className="mr-2 h-5 w-5" />
              A/B Testing Dashboard
            </CardTitle>
            <Button size="sm">
              <Zap className="mr-2 h-4 w-4" />
              New Test
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Active Tests Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {tests.filter(t => t.status === 'RUNNING').length}
            </div>
            <div className="text-sm text-muted-foreground">Running Tests</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {tests.filter(t => t.status === 'COMPLETED').length}
            </div>
            <div className="text-sm text-muted-foreground">Completed Tests</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {tests.reduce((sum, test) => sum + test.metrics.totalConversions, 0)}
            </div>
            <div className="text-sm text-muted-foreground">Total Conversions</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {formatPercentage(
                tests.reduce((sum, test) => sum + test.metrics.overallConversionRate, 0) / Math.max(tests.length, 1)
              )}
            </div>
            <div className="text-sm text-muted-foreground">Avg Conversion</div>
          </CardContent>
        </Card>
      </div>

      {/* Test List */}
      <Card>
        <CardHeader>
          <CardTitle>Current Tests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tests.map((test) => {
              const winningVariant = getWinningVariant(test)
              const isSignificant = test.metrics.statisticalSignificance >= 95

              return (
                <div
                  key={test.id}
                  className={`p-4 border rounded-lg hover:bg-muted/50 cursor-pointer ${
                    selectedTest?.id === test.id ? 'border-primary' : ''
                  }`}
                  onClick={() => setSelectedTest(selectedTest?.id === test.id ? null : test)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Target className="h-5 w-5 text-blue-500" />
                      <div>
                        <h4 className="font-medium">{test.name}</h4>
                        <p className="text-sm text-muted-foreground">{test.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className={getStatusColor(test.status)}>
                        {test.status}
                      </Badge>

                      {test.status === 'RUNNING' && (
                        <div className="flex items-center text-green-600">
                          <TrendingUp className="h-4 w-4 mr-1" />
                          {formatPercentage(test.metrics.overallConversionRate)}
                        </div>
                      )}

                      <Switch
                        checked={test.status === 'RUNNING'}
                        onCheckedChange={() => toggleTestStatus(test.id, test.status)}
                      />
                    </div>
                  </div>

                  {selectedTest?.id === test.id && (
                    <>
                      <Separator className="my-4" />

                      <div className="space-y-4">
                        {/* Test Metrics */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center">
                            <div className="text-lg font-bold">{test.metrics.totalImpressions.toLocaleString()}</div>
                            <div className="text-xs text-muted-foreground">Impressions</div>
                          </div>

                          <div className="text-center">
                            <div className="text-lg font-bold text-green-600">{test.metrics.totalConversions}</div>
                            <div className="text-xs text-muted-foreground">Conversions</div>
                          </div>

                          <div className="text-center">
                            <div className="text-lg font-bold text-blue-600">
                              {formatPercentage(test.metrics.overallConversionRate)}
                            </div>
                            <div className="text-xs text-muted-foreground">Conversion Rate</div>
                          </div>

                          <div className="text-center">
                            <div className={`text-lg font-bold ${isSignificant ? 'text-green-600' : 'text-orange-600'}`}>
                              {formatPercentage(test.metrics.statisticalSignificance)}
                            </div>
                            <div className="text-xs text-muted-foreground">Statistical Significance</div>
                          </div>
                        </div>

                        {/* Variants */}
                        <div>
                          <h5 className="font-medium mb-2">Variants Performance</h5>
                          <div className="space-y-2">
                            {test.variants.map((variant) => {
                              const isWinner = variant.id === winningVariant.id
                              const improvement = variant.isControl
                                ? 0
                                : ((variant.conversionRate - test.variants.find(v => v.isControl)?.conversionRate!) /
                                   test.variants.find(v => v.isControl)?.conversionRate!) * 100

                              return (
                                <div
                                  key={variant.id}
                                  className={`p-3 rounded border ${
                                    isWinner ? 'border-green-500 bg-green-50' : ''
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">{variant.name}</span>
                                      {variant.isControl && (
                                        <Badge variant="outline" className="text-xs">Control</Badge>
                                      )}
                                      {isWinner && isSignificant && (
                                        <Badge className="text-xs bg-green-600">Winner</Badge>
                                      )}
                                    </div>

                                    <div className="flex items-center gap-4 text-sm">
                                      <span>{formatPercentage(variant.trafficAllocation)} traffic</span>
                                      <span className="font-medium">
                                        {formatPercentage(variant.conversionRate)} conversion
                                      </span>
                                      {!variant.isControl && (
                                        <div className={`flex items-center ${
                                          improvement > 0 ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                          {improvement > 0 ? (
                                            <TrendingUp className="h-3 w-3 mr-1" />
                                          ) : (
                                            <TrendingDown className="h-3 w-3 mr-1" />
                                          )}
                                          {Math.abs(improvement).toFixed(1)}%
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <div className="text-xs text-muted-foreground mt-1">
                                    {variant.impressions.toLocaleString()} impressions • {variant.conversions} conversions
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 pt-2">
                          {test.status === 'RUNNING' && (
                            <Button variant="outline" size="sm">
                              <BarChart3 className="mr-2 h-3 w-3" />
                              Detailed Analytics
                            </Button>
                          )}

                          {test.status === 'COMPLETED' && isSignificant && (
                            <Button size="sm">
                              <Target className="mr-2 h-3 w-3" />
                              Implement Winner
                            </Button>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )
            })}

            {tests.length === 0 && (
              <div className="text-center py-8">
                <FlaskConical className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <h4 className="text-sm font-medium mb-1">No A/B Tests</h4>
                <p className="text-xs text-muted-foreground mb-4">
                  Create your first A/B test to optimize conversions
                </p>
                <Button size="sm">
                  <Zap className="mr-2 h-4 w-4" />
                  Create Test
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}