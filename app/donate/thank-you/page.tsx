"use client"

import { useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Heart,
  ChefHat,
  ArrowLeft,
  Share2,
  Twitter,
  Facebook,
  CheckCircle
} from "lucide-react"
import Link from "next/link"
import { Suspense } from "react"

function ThankYouContent() {
  const searchParams = useSearchParams()
  const amount = searchParams?.get("amount") || "0"

  const shareText = `I just supported Pastry Blog with a $${amount} donation! 🍰 Help keep amazing recipes free for everyone. #PastryBlog #SupportCreators`

  const handleShare = (platform: string) => {
    const encodedText = encodeURIComponent(shareText)
    const url = encodeURIComponent(window.location.origin)

    let shareUrl = ""
    switch (platform) {
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?text=${encodedText}&url=${url}`
        break
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${encodedText}`
        break
    }

    if (shareUrl) {
      window.open(shareUrl, "_blank", "width=600,height=400")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-primary/10 flex items-center justify-center p-4">
      <div className="max-w-2xl mx-auto">
        {/* Success Animation */}
        <div className="text-center mb-8">
          <div className="relative">
            <div className="w-24 h-24 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <div className="absolute -top-2 -right-2 animate-bounce">
              <Heart className="w-6 h-6 text-red-500 fill-current" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-2">Thank You! 🎉</h1>
          <p className="text-xl text-muted-foreground">
            Your generous donation means the world to us
          </p>
        </div>

        <Card className="mb-6">
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              <div className="text-6xl font-bold text-primary mb-2">${amount}</div>
              <p className="text-muted-foreground">
                Your contribution helps us keep creating amazing recipes
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-primary/5 rounded-lg">
                <ChefHat className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="text-sm font-medium">Recipe Development</p>
              </div>
              <div className="p-4 bg-primary/5 rounded-lg">
                <Heart className="w-8 h-8 text-red-500 mx-auto mb-2" />
                <p className="text-sm font-medium">Community Support</p>
              </div>
              <div className="p-4 bg-primary/5 rounded-lg">
                <Share2 className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <p className="text-sm font-medium">Platform Growth</p>
              </div>
            </div>

            <div className="text-center space-y-4">
              <h3 className="text-lg font-semibold">What happens next?</h3>
              <div className="text-left space-y-2 max-w-md mx-auto">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                  <p className="text-sm">You'll receive a confirmation email shortly</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                  <p className="text-sm">Your support helps us create more content</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                  <p className="text-sm">Keep cooking with our free recipes!</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Share Section */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-center">
              Help us spread the word! 📢
            </h3>
            <p className="text-center text-muted-foreground mb-4">
              Share your support and inspire others to contribute
            </p>
            <div className="flex gap-3 justify-center">
              <Button
                variant="outline"
                onClick={() => handleShare("twitter")}
                className="flex-1 max-w-xs"
              >
                <Twitter className="w-4 h-4 mr-2" />
                Share on Twitter
              </Button>
              <Button
                variant="outline"
                onClick={() => handleShare("facebook")}
                className="flex-1 max-w-xs"
              >
                <Facebook className="w-4 h-4 mr-2" />
                Share on Facebook
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-center">
          <Link href="/feed">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Recipes
            </Button>
          </Link>
          <Link href="/donate">
            <Button>
              <Heart className="w-4 h-4 mr-2" />
              Donate Again
            </Button>
          </Link>
        </div>

        {/* Footer Message */}
        <div className="text-center mt-8">
          <p className="text-muted-foreground text-sm">
            💝 From all of us at Pastry Blog - Thank you for being amazing!
          </p>
          <p className="text-muted-foreground text-xs mt-2">
            Questions about your donation? Contact us at support@pastryblog.com
          </p>
        </div>
      </div>
    </div>
  )
}

export default function ThankYouPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ThankYouContent />
    </Suspense>
  )
}