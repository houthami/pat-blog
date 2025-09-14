"use client"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ChefHat, Clock, Share2, User } from "lucide-react"

interface Recipe {
  id: string
  title: string
  description: string | null
  createdAt: string
  author: {
    name: string | null
    image: string | null
  }
}

interface RecipeHeaderProps {
  recipe: Recipe
  onShare?: () => void
  showAuthor?: boolean
}

export function RecipeHeader({ recipe, onShare, showAuthor = true }: RecipeHeaderProps) {
  return (
    <div className="mb-8">
      {/* Title and Description */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex-1">
          <h1 className="text-4xl font-bold mb-4 text-balance">{recipe.title}</h1>
          {recipe.description && (
            <p className="text-lg text-muted-foreground leading-relaxed">
              {recipe.description}
            </p>
          )}
        </div>
        {onShare && (
          <Button variant="outline" onClick={onShare}>
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
        )}
      </div>

      {/* Author Info */}
      {showAuthor && (
        <div className="flex items-center gap-4 text-muted-foreground">
          <div className="flex items-center gap-2">
            <Avatar className="w-8 h-8">
              <AvatarImage src={recipe.author.image || undefined} />
              <AvatarFallback>
                <ChefHat className="w-4 h-4" />
              </AvatarFallback>
            </Avatar>
            <div className="flex items-center gap-1">
              <User className="mr-1 h-4 w-4" />
              {recipe.author.name || "Anonymous Chef"}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="mr-1 h-4 w-4" />
            {new Date(recipe.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric"
            })}
          </div>
        </div>
      )}
    </div>
  )
}