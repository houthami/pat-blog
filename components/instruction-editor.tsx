"use client"

import React, { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import {
  Eye,
  Edit,
  Plus,
  Hash,
  Quote,
  Type,
  Timer,
  ChefHat,
  Sparkles,
  Info
} from "lucide-react"
import { TextFormatter } from "@/components/text-formatter"

interface InstructionEditorProps {
  value: string
  onChange: (value: string) => void
  onAIEnhance?: () => void
}

interface InstructionItem {
  type: 'title' | 'note' | 'step'
  content: string
  id: string
}

export function InstructionEditor({ value, onChange, onAIEnhance }: InstructionEditorProps) {
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit")
  const [instructions, setInstructions] = useState<InstructionItem[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Parse instructions from text value
  useEffect(() => {
    if (value) {
      const lines = value.split('\n').filter(line => line.trim())
      const parsed = lines.map((line, index) => {
        const trimmed = line.trim()
        let type: 'title' | 'note' | 'step' = 'step'
        let content = trimmed

        if (trimmed.startsWith('#')) {
          type = 'title'
          content = trimmed.slice(1).trim()
        } else if (trimmed.startsWith('>')) {
          type = 'note'
          content = trimmed.slice(1).trim()
        } else {
          // Remove existing numbering
          content = trimmed.replace(/^\d+\.\s*/, '').trim()
        }

        return {
          type,
          content,
          id: `${type}-${index}`
        }
      })
      setInstructions(parsed)
    }
  }, [value])

  // Convert instructions back to text format
  const instructionsToText = (items: InstructionItem[]) => {
    return items.map(item => {
      switch (item.type) {
        case 'title':
          return `# ${item.content}`
        case 'note':
          return `> ${item.content}`
        case 'step':
          return item.content
        default:
          return item.content
      }
    }).join('\n')
  }

  // Add quick formatting buttons
  const insertFormatting = (format: 'title' | 'note' | 'step') => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end)

    let prefix = ''
    let placeholder = ''

    switch (format) {
      case 'title':
        prefix = '# '
        placeholder = 'Section Title'
        break
      case 'note':
        prefix = '> '
        placeholder = 'Important note or tip'
        break
      case 'step':
        placeholder = 'Cooking step'
        break
    }

    const newText = selectedText || placeholder
    const before = value.substring(0, start)
    const after = value.substring(end)
    const newValue = `${before}${prefix}${newText}\n${after}`

    onChange(newValue)

    // Set cursor position after the inserted text
    setTimeout(() => {
      if (textarea) {
        const newPosition = start + prefix.length + newText.length
        textarea.setSelectionRange(newPosition, newPosition)
        textarea.focus()
      }
    }, 0)
  }

  // Count different types of instructions
  const stepCount = instructions.filter(i => i.type === 'step').length
  const titleCount = instructions.filter(i => i.type === 'title').length
  const noteCount = instructions.filter(i => i.type === 'note').length

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3">
            <ChefHat className="w-5 h-5" />
            Instructions
            <div className="flex gap-2">
              <Badge variant="secondary" className="text-xs">
                {stepCount} Steps
              </Badge>
              {titleCount > 0 && (
                <Badge variant="outline" className="text-xs">
                  {titleCount} Sections
                </Badge>
              )}
              {noteCount > 0 && (
                <Badge variant="outline" className="text-xs">
                  {noteCount} Notes
                </Badge>
              )}
            </div>
          </CardTitle>
          {onAIEnhance && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onAIEnhance}
              className="text-accent hover:text-accent-foreground hover:bg-accent/10"
            >
              <Sparkles className="w-4 h-4 mr-1" />
              AI Enhance
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "edit" | "preview")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="edit" className="flex items-center gap-2">
              <Edit className="w-4 h-4" />
              Edit
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="edit" className="space-y-4">
            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700 w-full mb-2">Quick Insert:</p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => insertFormatting('title')}
                className="flex items-center gap-2"
              >
                <Hash className="w-3 h-3" />
                Section Title
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => insertFormatting('note')}
                className="flex items-center gap-2"
              >
                <Quote className="w-3 h-3" />
                Note/Tip
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => insertFormatting('step')}
                className="flex items-center gap-2"
              >
                <Type className="w-3 h-3" />
                Cooking Step
              </Button>
            </div>

            {/* Text Editor */}
            <Textarea
              ref={textareaRef}
              placeholder="# Preparation&#10;> Make sure all ingredients are at room temperature&#10;&#10;1. Preheat oven to **350°F (175°C)**&#10;2. In a large bowl, cream together butter and sugar&#10;3. Add eggs one at a time, beating well after each addition"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              rows={12}
              className="font-mono text-sm"
            />

            {/* Formatting Guide */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Info className="w-4 h-4 text-blue-600" />
                <p className="font-medium text-blue-800">Formatting Guide</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="font-medium text-blue-800 mb-1">Section Titles</p>
                  <code className="bg-white px-2 py-1 rounded text-blue-700"># Title</code>
                  <p className="text-blue-600 mt-1">Creates bold section headers</p>
                </div>
                <div>
                  <p className="font-medium text-blue-800 mb-1">Notes & Tips</p>
                  <code className="bg-white px-2 py-1 rounded text-blue-700">&gt; Note</code>
                  <p className="text-blue-600 mt-1">Highlighted information boxes</p>
                </div>
                <div>
                  <p className="font-medium text-blue-800 mb-1">Bold Text</p>
                  <code className="bg-white px-2 py-1 rounded text-blue-700">**Bold**</code>
                  <p className="text-blue-600 mt-1">Emphasize important details</p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="space-y-4">
            <div className="border rounded-lg p-6 bg-white min-h-[300px]">
              {instructions.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-gray-400">
                  <p>Start typing instructions to see preview...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {instructions.map((instruction, index) => {
                    if (instruction.type === 'title') {
                      return (
                        <div key={instruction.id} className="font-bold text-lg text-gray-800 mt-6 mb-3 border-b border-gray-200 pb-2">
                          <TextFormatter>{instruction.content}</TextFormatter>
                        </div>
                      )
                    }

                    if (instruction.type === 'note') {
                      return (
                        <div key={instruction.id} className="italic text-gray-700 bg-amber-50 border-l-4 border-amber-400 p-3 rounded-r-lg my-3">
                          <TextFormatter>{instruction.content}</TextFormatter>
                        </div>
                      )
                    }

                    // Step
                    const stepNumber = instructions.slice(0, index).filter(i => i.type === 'step').length + 1
                    return (
                      <div key={instruction.id} className="flex gap-4 p-4 bg-gray-50 rounded-lg border">
                        <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                          {stepNumber}
                        </div>
                        <div className="flex-1">
                          <TextFormatter>{instruction.content}</TextFormatter>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}