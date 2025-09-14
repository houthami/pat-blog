"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ChefHat, BookOpen, Users, Settings, Plus, X, ArrowRight, Check } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface OnboardingStep {
  id: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  action?: {
    label: string
    href: string
    external?: boolean
  }
  role?: string[]
  completed?: boolean
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: "welcome",
    title: "Welcome to Pastry Blog Admin",
    description: "Get started with managing your baking content and recipes.",
    icon: ChefHat,
  },
  {
    id: "profile",
    title: "Complete Your Profile",
    description: "Add your information to personalize your experience.",
    icon: Users,
    action: {
      label: "Edit Profile",
      href: "/settings",
    },
  },
  {
    id: "create-recipe",
    title: "Create Your First Recipe",
    description: "Share your favorite baking recipe with the community.",
    icon: Plus,
    action: {
      label: "Create Recipe",
      href: "/recipes/new",
    },
    role: ["ADMIN", "EDITOR"],
  },
  {
    id: "explore-features",
    title: "Explore Dashboard Features",
    description: "Discover analytics, user management, and content tools.",
    icon: Settings,
    action: {
      label: "View Dashboard",
      href: "/dashboard",
    },
    role: ["ADMIN", "EDITOR"],
  },
  {
    id: "browse-recipes",
    title: "Browse Recipe Collection",
    description: "Explore the growing collection of delicious recipes.",
    icon: BookOpen,
    action: {
      label: "View Recipes",
      href: "/recipes",
    },
  },
]

export function UserOnboarding() {
  const { data: session } = useSession()
  const [currentStep, setCurrentStep] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set())

  useEffect(() => {
    // Check if user has seen onboarding
    const hasSeenOnboarding = localStorage.getItem("hasSeenOnboarding")
    if (!hasSeenOnboarding && session?.user) {
      setIsVisible(true)
    }

    // Load completed steps
    const completed = localStorage.getItem("onboardingCompleted")
    if (completed) {
      setCompletedSteps(new Set(JSON.parse(completed)))
    }
  }, [session])

  const userRole = session?.user?.role || "VIEWER"
  const filteredSteps = onboardingSteps.filter(
    (step) => !step.role || step.role.includes(userRole)
  )

  const markStepCompleted = (stepId: string) => {
    const newCompleted = new Set(completedSteps)
    newCompleted.add(stepId)
    setCompletedSteps(newCompleted)
    localStorage.setItem("onboardingCompleted", JSON.stringify([...newCompleted]))
  }

  const handleNext = () => {
    markStepCompleted(filteredSteps[currentStep].id)
    if (currentStep < filteredSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handleComplete = () => {
    localStorage.setItem("hasSeenOnboarding", "true")
    setIsVisible(false)
  }

  const handleSkip = () => {
    localStorage.setItem("hasSeenOnboarding", "true")
    setIsVisible(false)
  }

  if (!isVisible || !session?.user) {
    return null
  }

  const currentStepData = filteredSteps[currentStep]
  const progress = ((currentStep + 1) / filteredSteps.length) * 100
  const Icon = currentStepData.icon

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="relative">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="mb-2">
              Step {currentStep + 1} of {filteredSteps.length}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="absolute top-4 right-4"
              aria-label="Close onboarding"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <Progress value={progress} className="mb-4" />
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
              <Icon className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-xl">{currentStepData.title}</CardTitle>
              <CardDescription className="text-base">
                {currentStepData.description}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {currentStepData.id === "welcome" && (
              <div className="text-center py-4">
                <p className="text-muted-foreground mb-4">
                  Welcome, {session.user.name}! 👋
                </p>
                <p className="text-sm">
                  We'll help you get started with a quick tour of the platform.
                  This will only take a few minutes.
                </p>
              </div>
            )}

            {currentStepData.action && (
              <Link
                href={currentStepData.action.href}
                onClick={() => markStepCompleted(currentStepData.id)}
                className="block"
              >
                <Button variant="outline" className="w-full justify-between">
                  {currentStepData.action.label}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            )}

            <div className="flex justify-between pt-4">
              {currentStep > 0 ? (
                <Button
                  variant="ghost"
                  onClick={() => setCurrentStep(currentStep - 1)}
                >
                  Previous
                </Button>
              ) : (
                <div />
              )}

              <div className="flex gap-2">
                <Button variant="ghost" onClick={handleSkip}>
                  Skip Tour
                </Button>
                <Button onClick={handleNext}>
                  {currentStep === filteredSteps.length - 1 ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Finish
                    </>
                  ) : (
                    <>
                      Next
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Tooltip component for contextual help
export function OnboardingTooltip({
  children,
  content,
  placement = "top",
}: {
  children: React.ReactNode
  content: string
  placement?: "top" | "bottom" | "left" | "right"
}) {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
      >
        {children}
      </div>
      {isVisible && (
        <div
          className={cn(
            "absolute z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg whitespace-nowrap",
            {
              "bottom-full left-1/2 transform -translate-x-1/2 mb-2": placement === "top",
              "top-full left-1/2 transform -translate-x-1/2 mt-2": placement === "bottom",
              "right-full top-1/2 transform -translate-y-1/2 mr-2": placement === "left",
              "left-full top-1/2 transform -translate-y-1/2 ml-2": placement === "right",
            }
          )}
        >
          {content}
          <div
            className={cn(
              "absolute w-2 h-2 bg-gray-900 transform rotate-45",
              {
                "top-full left-1/2 -translate-x-1/2 -mt-1": placement === "top",
                "bottom-full left-1/2 -translate-x-1/2 -mb-1": placement === "bottom",
                "top-1/2 left-full -translate-y-1/2 -ml-1": placement === "left",
                "top-1/2 right-full -translate-y-1/2 -mr-1": placement === "right",
              }
            )}
          />
        </div>
      )}
    </div>
  )
}