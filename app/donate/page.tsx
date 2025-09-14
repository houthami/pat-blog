"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Heart,
  Coffee,
  Gift,
  CreditCard,
  DollarSign,
  Smartphone,
  ChefHat,
  Star,
  Users,
  ArrowLeft
} from "lucide-react"
import Link from "next/link"
import { recordDonation } from "@/lib/donation-tracker"

const PRESET_AMOUNTS = [
  { amount: 5, label: "☕ Buy us a coffee", description: "Support our daily content creation" },
  { amount: 15, label: "🥧 Sponsor a recipe", description: "Help us create new recipe content" },
  { amount: 25, label: "📚 Monthly supporter", description: "Become a regular contributor" },
  { amount: 50, label: "⭐ Premium supporter", description: "Help us grow the community" }
]

const PAYMENT_METHODS = [
  { id: 'card', name: 'Credit/Debit Card', icon: CreditCard, popular: true },
  { id: 'paypal', name: 'PayPal', icon: DollarSign, popular: true },
  { id: 'apple', name: 'Apple Pay', icon: Smartphone, popular: false },
  { id: 'google', name: 'Google Pay', icon: Smartphone, popular: false }
]

export default function DonatePage() {
  const [selectedAmount, setSelectedAmount] = useState<number>(15)
  const [customAmount, setCustomAmount] = useState<string>("")
  const [selectedPayment, setSelectedPayment] = useState<string>("card")
  const [donorInfo, setDonorInfo] = useState({
    name: "",
    email: "",
    message: ""
  })
  const [isProcessing, setIsProcessing] = useState(false)

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount)
    setCustomAmount("")
  }

  const handleCustomAmount = (value: string) => {
    setCustomAmount(value)
    setSelectedAmount(0)
  }

  const getFinalAmount = () => {
    return customAmount ? parseFloat(customAmount) : selectedAmount
  }

  const handleDonate = async () => {
    setIsProcessing(true)

    // Simulate payment processing
    setTimeout(() => {
      // Record the donation to track for banner hiding
      recordDonation(getFinalAmount())

      setIsProcessing(false)
      // Redirect to thank you page
      window.location.href = "/donate/thank-you?amount=" + getFinalAmount()
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-primary/10">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/feed">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Recipes
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <ChefHat className="w-5 h-5 text-primary" />
              </div>
              <h1 className="text-xl font-bold">Support Pastry Blog</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Side - Impact & Story */}
          <div className="space-y-6">
            <div className="text-center lg:text-left">
              <h2 className="text-3xl font-bold mb-4">Help Us Keep Cooking! 👨‍🍳</h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Your support helps us create amazing recipe content, maintain our platform,
                and keep everything free for the community. Every donation makes a difference!
              </p>
            </div>

            {/* Impact Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  Your Impact
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-primary/5 rounded-lg">
                  <div className="text-2xl font-bold text-primary">1,200+</div>
                  <div className="text-sm text-muted-foreground">Recipes Created</div>
                </div>
                <div className="text-center p-4 bg-primary/5 rounded-lg">
                  <div className="text-2xl font-bold text-primary">50K+</div>
                  <div className="text-sm text-muted-foreground">Happy Cooks</div>
                </div>
                <div className="text-center p-4 bg-primary/5 rounded-lg">
                  <div className="text-2xl font-bold text-primary">24/7</div>
                  <div className="text-sm text-muted-foreground">Free Access</div>
                </div>
                <div className="text-center p-4 bg-primary/5 rounded-lg">
                  <div className="text-2xl font-bold text-primary">100%</div>
                  <div className="text-sm text-muted-foreground">Ad-Free</div>
                </div>
              </CardContent>
            </Card>

            {/* What Your Money Does */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-500" />
                  How Your Donation Helps
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                  <div>
                    <p className="font-medium">Recipe Development</p>
                    <p className="text-sm text-muted-foreground">Testing new recipes and ingredients</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                  <div>
                    <p className="font-medium">Platform Maintenance</p>
                    <p className="text-sm text-muted-foreground">Servers, security, and updates</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                  <div>
                    <p className="font-medium">Content Creation</p>
                    <p className="text-sm text-muted-foreground">Photography, videos, and tutorials</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                  <div>
                    <p className="font-medium">Community Features</p>
                    <p className="text-sm text-muted-foreground">Comments, ratings, and social features</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Donation Form */}
          <div className="space-y-6">
            {/* Amount Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Choose Your Support Level</CardTitle>
                <CardDescription>
                  Select an amount or enter your own
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  {PRESET_AMOUNTS.map((preset) => (
                    <div
                      key={preset.amount}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        selectedAmount === preset.amount
                          ? "border-primary bg-primary/5"
                          : "border-muted hover:border-primary/50"
                      }`}
                      onClick={() => handleAmountSelect(preset.amount)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{preset.label}</p>
                          <p className="text-sm text-muted-foreground">{preset.description}</p>
                        </div>
                        <div className="text-xl font-bold">${preset.amount}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="custom-amount">Custom Amount</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      id="custom-amount"
                      type="number"
                      placeholder="Enter amount"
                      value={customAmount}
                      onChange={(e) => handleCustomAmount(e.target.value)}
                      className="pl-8"
                      min="1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Methods */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {PAYMENT_METHODS.map((method) => (
                  <div
                    key={method.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center gap-3 ${
                      selectedPayment === method.id
                        ? "border-primary bg-primary/5"
                        : "border-muted hover:border-primary/50"
                    }`}
                    onClick={() => setSelectedPayment(method.id)}
                  >
                    <method.icon className="w-5 h-5 text-muted-foreground" />
                    <span className="font-medium">{method.name}</span>
                    {method.popular && (
                      <Badge variant="secondary" className="ml-auto">Popular</Badge>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Donor Information */}
            <Card>
              <CardHeader>
                <CardTitle>Donor Information (Optional)</CardTitle>
                <CardDescription>
                  Help us thank you properly
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="donor-name">Name</Label>
                  <Input
                    id="donor-name"
                    placeholder="Your name"
                    value={donorInfo.name}
                    onChange={(e) => setDonorInfo({...donorInfo, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="donor-email">Email</Label>
                  <Input
                    id="donor-email"
                    type="email"
                    placeholder="your@email.com"
                    value={donorInfo.email}
                    onChange={(e) => setDonorInfo({...donorInfo, email: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="donor-message">Message (Optional)</Label>
                  <Textarea
                    id="donor-message"
                    placeholder="Leave a message for the team..."
                    value={donorInfo.message}
                    onChange={(e) => setDonorInfo({...donorInfo, message: e.target.value})}
                    className="resize-none"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Donate Button */}
            <Card>
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <div className="text-2xl font-bold">
                    Total: ${getFinalAmount() || "0"}
                  </div>
                  <Button
                    onClick={handleDonate}
                    disabled={!getFinalAmount() || isProcessing}
                    size="lg"
                    className="w-full"
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <Heart className="w-4 h-4 mr-2" />
                        Donate ${getFinalAmount() || "0"}
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Secure payment powered by industry standards. Your information is safe.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}