"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChefHat, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface RecipeNotFoundProps {
  error: string
  backUrl: string
}

export function RecipeNotFound({ error, backUrl }: RecipeNotFoundProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Card className="text-center py-12 max-w-md mx-auto">
          <CardContent>
            <ChefHat className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h1 className="text-xl font-semibold mb-2">Recipe Not Available</h1>
            <p className="text-muted-foreground mb-6">
              {error}
            </p>
            <Button asChild>
              <Link href={backUrl}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}