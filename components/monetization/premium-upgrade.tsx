"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import {
  Crown,
  Check,
  X,
  Star,
  Calendar,
  ShoppingCart,
  BarChart3,
  Download,
  Users,
  Zap,
  Heart
} from "lucide-react"

interface PremiumUpgradeProps {
  currentFeature: string
  isOpen: boolean
  onClose: () => void
  onUpgrade?: () => void
}

const FEATURES = {
  free: [
    { name: "5 recipes per month", icon: "📝", included: true },
    { name: "Basic recipe viewing", icon: "👁️", included: true },
    { name: "Community comments", icon: "💬", included: true },
    { name: "Mobile access", icon: "📱", included: true },
    { name: "Advertisement supported", icon: "📺", included: true },
  ],
  premium: [
    { name: "Unlimited recipes", icon: "♾️", included: true },
    { name: "Advanced meal planning", icon: "📅", included: true },
    { name: "Smart shopping lists", icon: "🛒", included: true },
    { name: "Recipe scaling", icon: "⚖️", included: true },
    { name: "Nutrition tracking", icon: "🥗", included: true },
    { name: "Export & sharing", icon: "📤", included: true },
    { name: "Ad-free experience", icon: "🚫", included: true },
    { name: "Priority support", icon: "⭐", included: true },
  ],
  pro: [
    { name: "Everything in Premium", icon: "✨", included: true },
    { name: "Recipe analytics", icon: "📊", included: true },
    { name: "Affiliate tracking", icon: "💰", included: true },
    { name: "API access", icon: "🔗", included: true },
    { name: "Custom branding", icon: "🎨", included: true },
    { name: "Bulk operations", icon: "⚡", included: true },
    { name: "Advanced exports", icon: "📋", included: true },
    { name: "White-label options", icon: "🏷️", included: true },
  ]
}

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: 0,
    period: "forever",
    description: "Perfect for casual cooking",
    badge: "",
    color: "border-gray-200",
    buttonStyle: "outline",
    features: FEATURES.free
  },
  {
    id: "premium",
    name: "Premium",
    price: 9.99,
    period: "month",
    description: "Best for serious home cooks",
    badge: "Most Popular",
    color: "border-blue-500 bg-blue-50",
    buttonStyle: "default",
    features: FEATURES.premium
  },
  {
    id: "pro",
    name: "Pro",
    price: 19.99,
    period: "month",
    description: "For food bloggers & creators",
    badge: "Creator Choice",
    color: "border-purple-500 bg-purple-50",
    buttonStyle: "default",
    features: FEATURES.pro
  }
]

export function PremiumUpgrade({ currentFeature, isOpen, onClose, onUpgrade }: PremiumUpgradeProps) {
  const [selectedPlan, setSelectedPlan] = useState("premium")
  const [isAnnual, setIsAnnual] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const getFeatureMessage = (feature: string) => {
    const messages = {
      "meal-planning": {
        title: "Unlock Advanced Meal Planning",
        description: "Plan entire weeks, generate shopping lists, and track nutrition with our premium meal planning tools."
      },
      "shopping-lists": {
        title: "Smart Shopping Lists",
        description: "Automatically generate shopping lists from your meal plans with affiliate links and price tracking."
      },
      "recipe-scaling": {
        title: "Recipe Scaling & Nutrition",
        description: "Scale recipes for any serving size and get detailed nutritional information for every dish."
      },
      "analytics": {
        title: "Recipe Analytics & Insights",
        description: "Track your recipe performance, earnings, and audience engagement with detailed analytics."
      },
      "affiliate": {
        title: "Affiliate Link Management",
        description: "Monetize your content with automatic affiliate link insertion and revenue tracking."
      },
      "unlimited": {
        title: "Unlimited Access",
        description: "Create unlimited recipes, meal plans, and collections without any restrictions."
      }
    }

    return messages[feature] || {
      title: "Upgrade to Premium",
      description: "Unlock all premium features to get the most out of your recipe management."
    }
  }

  const handleUpgrade = async (planId: string) => {
    setIsProcessing(true)

    try {
      // Mock payment processing
      await new Promise(resolve => setTimeout(resolve, 2000))

      // In real app, integrate with Stripe or similar
      const response = await fetch('/api/subscriptions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          isAnnual,
          currentFeature
        })
      })

      if (response.ok) {
        onUpgrade?.()
        onClose()
      }
    } catch (error) {
      console.error('Upgrade failed:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const calculatePrice = (price: number) => {
    if (price === 0) return { monthly: 0, annual: 0, savings: 0 }
    const monthly = price
    const annual = price * 12 * 0.83 // 17% discount for annual
    const savings = (price * 12) - annual
    return { monthly, annual, savings }
  }

  const featureInfo = getFeatureMessage(currentFeature)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4">
              <Crown className="w-8 h-8 text-white" />
            </div>
            <DialogTitle className="text-2xl font-bold">{featureInfo.title}</DialogTitle>
            <p className="text-muted-foreground mt-2 max-w-md mx-auto">
              {featureInfo.description}
            </p>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4">
            <span className={`text-sm ${!isAnnual ? 'font-medium' : 'text-muted-foreground'}`}>
              Monthly
            </span>
            <Switch checked={isAnnual} onCheckedChange={setIsAnnual} />
            <span className={`text-sm ${isAnnual ? 'font-medium' : 'text-muted-foreground'}`}>
              Annual
            </span>
            {isAnnual && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Save 17%
              </Badge>
            )}
          </div>

          {/* Pricing Plans */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANS.map((plan) => {
              const pricing = calculatePrice(plan.price)
              const displayPrice = isAnnual ? pricing.annual / 12 : pricing.monthly

              return (
                <Card
                  key={plan.id}
                  className={`relative cursor-pointer transition-all duration-200 ${
                    selectedPlan === plan.id
                      ? plan.color + " shadow-lg scale-105"
                      : "hover:shadow-md hover:scale-[1.02]"
                  }`}
                  onClick={() => setSelectedPlan(plan.id)}
                >
                  {plan.badge && (
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                      {plan.badge}
                    </Badge>
                  )}

                  <CardHeader className="text-center">
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <div className="text-3xl font-bold">
                      {plan.price === 0 ? (
                        "Free"
                      ) : (
                        <>
                          <span className="text-2xl">$</span>
                          {displayPrice.toFixed(2)}
                          <span className="text-base font-normal text-muted-foreground">
                            /{isAnnual ? 'mo' : plan.period}
                          </span>
                        </>
                      )}
                    </div>
                    {isAnnual && plan.price > 0 && (
                      <div className="text-sm text-green-600">
                        Save ${pricing.savings.toFixed(2)}/year
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-3">
                      {plan.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <div className="flex-shrink-0">
                            {feature.included ? (
                              <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                                <Check className="w-3 h-3 text-green-600" />
                              </div>
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center">
                                <X className="w-3 h-3 text-red-600" />
                              </div>
                            )}
                          </div>
                          <span className="text-sm flex items-center gap-2">
                            <span>{feature.icon}</span>
                            {feature.name}
                          </span>
                        </div>
                      ))}
                    </div>

                    <Button
                      className="w-full mt-6"
                      variant={selectedPlan === plan.id ? "default" : "outline"}
                      onClick={(e) => {
                        e.stopPropagation()
                        if (plan.id !== "free") {
                          handleUpgrade(plan.id)
                        }
                      }}
                      disabled={isProcessing || plan.id === "free"}
                    >
                      {isProcessing && selectedPlan === plan.id ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          Processing...
                        </>
                      ) : plan.id === "free" ? (
                        "Current Plan"
                      ) : (
                        `Upgrade to ${plan.name}`
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Feature Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Calendar className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <h4 className="font-medium">Smart Meal Planning</h4>
              <p className="text-sm text-muted-foreground">Plan weeks in advance with nutritional insights</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <ShoppingCart className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <h4 className="font-medium">Auto Shopping Lists</h4>
              <p className="text-sm text-muted-foreground">Generate lists with affiliate links and prices</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <BarChart3 className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <h4 className="font-medium">Advanced Analytics</h4>
              <p className="text-sm text-muted-foreground">Track performance and optimize your content</p>
            </div>
          </div>

          {/* Social Proof */}
          <div className="bg-muted/50 rounded-lg p-6 text-center">
            <div className="flex justify-center gap-1 mb-3">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <blockquote className="text-lg font-medium mb-2">
              "The meal planning feature has completely transformed how I cook. I save hours every week!"
            </blockquote>
            <cite className="text-sm text-muted-foreground">- Sarah K., Premium User</cite>

            <div className="flex justify-center gap-8 mt-4 text-sm text-muted-foreground">
              <div>
                <div className="text-lg font-semibold text-foreground">10,000+</div>
                <div>Happy Users</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-foreground">500,000+</div>
                <div>Recipes Planned</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-foreground">95%</div>
                <div>Satisfaction Rate</div>
              </div>
            </div>
          </div>

          {/* Money-Back Guarantee */}
          <div className="text-center p-4 border border-green-200 bg-green-50 rounded-lg">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Heart className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-800">30-Day Money-Back Guarantee</span>
            </div>
            <p className="text-sm text-green-700">
              Try premium risk-free. If you're not completely satisfied, we'll refund your money.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}