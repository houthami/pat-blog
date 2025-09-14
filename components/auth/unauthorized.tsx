"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Shield, ArrowLeft, Crown, Users } from "lucide-react"
import Link from "next/link"

interface UnauthorizedProps {
  requiredRole: string
  message?: string
  showUpgrade?: boolean
}

export function Unauthorized({
  requiredRole,
  message,
  showUpgrade = true
}: UnauthorizedProps) {
  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'Administrator access'
      case 'EDITOR': return 'Premium subscription'
      case 'MEMBER': return 'User account'
      default: return 'Special permission'
    }
  }

  const getUpgradeInfo = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return {
          title: 'Upgrade to Pro',
          description: 'Get full admin access with Pro subscription',
          price: '$19.99/month',
          color: 'text-purple-600'
        }
      case 'EDITOR':
        return {
          title: 'Upgrade to Premium',
          description: 'Access premium features with Premium subscription',
          price: '$9.99/month',
          color: 'text-blue-600'
        }
      default:
        return {
          title: 'Create Account',
          description: 'Sign up to access this feature',
          price: 'Free',
          color: 'text-green-600'
        }
    }
  }

  const upgradeInfo = getUpgradeInfo(requiredRole)

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-red-600" />
          </div>

          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>

          <p className="text-muted-foreground mb-6">
            {message || `This feature requires ${getRoleDescription(requiredRole).toLowerCase()}.`}
          </p>

          <div className="bg-muted/50 p-4 rounded-lg mb-6">
            <div className="flex items-center justify-center mb-2">
              <Crown className="w-5 h-5 text-amber-500 mr-2" />
              <span className="font-medium">Required: {getRoleDescription(requiredRole)}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              You need {getRoleDescription(requiredRole).toLowerCase()} to view this page.
            </p>
          </div>

          <div className="space-y-3">
            {showUpgrade && requiredRole !== 'MEMBER' && (
              <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">{upgradeInfo.title}</h3>
                  <span className={`font-bold ${upgradeInfo.color}`}>
                    {upgradeInfo.price}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  {upgradeInfo.description}
                </p>
                <Button className="w-full" size="sm">
                  <Crown className="mr-2 h-4 w-4" />
                  {upgradeInfo.title}
                </Button>
              </div>
            )}

            <Button variant="outline" asChild className="w-full">
              <Link href="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
          </div>

          <div className="mt-6 pt-6 border-t">
            <div className="flex items-center justify-center text-sm text-muted-foreground">
              <Users className="w-4 h-4 mr-2" />
              Need help? Contact support
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}