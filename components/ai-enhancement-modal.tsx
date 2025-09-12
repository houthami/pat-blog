"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Loader2, Globe, MapPin } from "lucide-react"
import { cn } from "@/lib/utils"

interface AIEnhancementModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  originalText: string
  fieldName: string
  onApply: (enhancedText: string) => void
}

type Audience = "us" | "gulf"

export function AIEnhancementModal({ open, onOpenChange, originalText, fieldName, onApply }: AIEnhancementModalProps) {
  const [audience, setAudience] = useState<Audience>("us")
  const [enhancedText, setEnhancedText] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)

  const generateEnhancement = async () => {
    setIsGenerating(true)

    try {
      const response = await fetch("/api/ai/enhance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: originalText,
          field: fieldName,
          audience,
        }),
      })

      if (response.ok) {
        const { enhancedText: generated } = await response.json()
        setEnhancedText(generated)
      } else {
        console.error("Failed to generate enhancement")
      }
    } catch (error) {
      console.error("Error generating enhancement:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleApply = () => {
    onApply(enhancedText)
    setEnhancedText("")
  }

  const handleCancel = () => {
    onOpenChange(false)
    setEnhancedText("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent" />
            AI Enhancement for {fieldName}
          </DialogTitle>
          <DialogDescription>
            Let AI help improve your {fieldName.toLowerCase()} with suggestions tailored to your audience.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Audience Selection */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Target Audience</h3>
            <div className="flex gap-2">
              <Button
                variant={audience === "us" ? "default" : "outline"}
                size="sm"
                onClick={() => setAudience("us")}
                className={cn(audience === "us" && "bg-accent text-accent-foreground")}
              >
                <Globe className="w-4 h-4 mr-2" />
                US Audience
              </Button>
              <Button
                variant={audience === "gulf" ? "default" : "outline"}
                size="sm"
                onClick={() => setAudience("gulf")}
                className={cn(audience === "gulf" && "bg-accent text-accent-foreground")}
              >
                <MapPin className="w-4 h-4 mr-2" />
                Gulf Countries
              </Button>
            </div>
          </div>

          {/* Content Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Original Text */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Original Text</h3>
                <Badge variant="secondary">Original</Badge>
              </div>
              <Textarea
                value={originalText}
                readOnly
                rows={8}
                className="resize-none bg-muted/50"
                placeholder={`Enter your ${fieldName.toLowerCase()} to get AI suggestions...`}
              />
            </div>

            {/* Enhanced Text */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">AI Enhanced</h3>
                <Badge variant="default" className="bg-accent text-accent-foreground">
                  Enhanced
                </Badge>
              </div>
              {enhancedText ? (
                <Textarea
                  value={enhancedText}
                  onChange={(e) => setEnhancedText(e.target.value)}
                  rows={8}
                  className="resize-none"
                />
              ) : (
                <div className="h-32 border-2 border-dashed border-border rounded-lg flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <Sparkles className="w-8 h-8 text-muted-foreground mx-auto" />
                    <p className="text-sm text-muted-foreground">Click "Generate Enhancement" to see AI suggestions</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={generateEnhancement}
                disabled={isGenerating || !originalText.trim()}
                className="bg-accent/10 text-accent hover:bg-accent hover:text-accent-foreground"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Enhancement
                  </>
                )}
              </Button>
              <Button
                onClick={handleApply}
                disabled={!enhancedText.trim()}
                className="bg-secondary hover:bg-secondary/90 text-secondary-foreground"
              >
                Apply Changes
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
