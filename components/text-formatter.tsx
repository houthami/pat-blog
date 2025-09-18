import React from 'react'

interface TextFormatterProps {
  children: string
  className?: string
  isInstruction?: boolean
}

export function TextFormatter({ children, className = "", isInstruction = false }: TextFormatterProps) {
  const formatText = (text: string) => {
    // Handle instruction-specific formatting
    if (isInstruction) {
      // Check if this is a title (starts with #)
      if (text.startsWith('#')) {
        const titleText = text.slice(1).trim()
        const formattedTitle = formatBoldText(titleText)
        return (
          <div className="font-bold text-lg text-gray-800 mt-4 mb-2 border-b border-gray-200 pb-1">
            {formattedTitle}
          </div>
        )
      }

      // Check if this is a description (starts with >)
      if (text.startsWith('>')) {
        const descText = text.slice(1).trim()
        const formattedDesc = formatBoldText(descText)
        return (
          <div className="italic text-gray-600 bg-gray-50 p-2 rounded-md my-2">
            {formattedDesc}
          </div>
        )
      }
    }

    // Regular text formatting with bold support
    return formatBoldText(text)
  }

  const formatBoldText = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g)

    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const boldText = part.slice(2, -2)
        return (
          <strong key={index} className="font-semibold">
            {boldText}
          </strong>
        )
      }
      return part
    })
  }

  return (
    <span className={className}>
      {formatText(children)}
    </span>
  )
}