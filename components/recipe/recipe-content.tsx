"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChefHat, Clock } from "lucide-react"

interface RecipeContentProps {
  ingredients: string[]
  instructions: string[]
}

export function RecipeContent({ ingredients, instructions }: RecipeContentProps) {
  return (
    <div className="space-y-6">
      {/* Ingredients */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ChefHat className="mr-2 h-5 w-5" />
            Ingredients
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {ingredients.map((ingredient, index) => (
              <li key={index} className="flex items-start">
                <span className="inline-block w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0" />
                <span className="leading-relaxed">{ingredient}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="mr-2 h-5 w-5" />
            Instructions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-4">
            {instructions.map((instruction, index) => (
              <li key={index} className="flex gap-4">
                <Badge
                  variant="outline"
                  className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center p-0"
                >
                  {index + 1}
                </Badge>
                <div className="flex-1">
                  <p className="leading-relaxed">{instruction}</p>
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}