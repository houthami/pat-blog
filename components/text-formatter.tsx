import React from 'react'

interface TextFormatterProps {
  children: string
  className?: string
}

export function TextFormatter({ children, className = "" }: TextFormatterProps) {
  const formatText = (text: string) => {
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