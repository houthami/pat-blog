"use client"

import React, { useState, useCallback } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { ChefHat, ImageOff } from 'lucide-react'

interface OptimizedImageProps {
  src: string | null | undefined
  alt: string
  width?: number
  height?: number
  className?: string
  fallbackIcon?: React.ReactNode
  priority?: boolean
  sizes?: string
  quality?: number
  onLoad?: () => void
  onError?: () => void
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
}

export function OptimizedImage({
  src,
  alt,
  width = 400,
  height = 300,
  className,
  fallbackIcon,
  priority = false,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  quality = 80,
  onLoad,
  onError,
  placeholder = 'empty',
  blurDataURL
}: OptimizedImageProps) {
  const [imageError, setImageError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const handleLoad = useCallback(() => {
    setIsLoading(false)
    onLoad?.()
  }, [onLoad])

  const handleError = useCallback(() => {
    setImageError(true)
    setIsLoading(false)
    onError?.()
  }, [onError])

  // Generate a simple blur placeholder
  const generateBlurDataURL = useCallback((w: number, h: number) => {
    // Create a simple 1x1 pixel blur placeholder
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')

    if (ctx) {
      // Create a gradient from light gray to slightly darker gray
      const gradient = ctx.createLinearGradient(0, 0, w, h)
      gradient.addColorStop(0, '#f3f4f6')
      gradient.addColorStop(1, '#e5e7eb')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, w, h)
    }

    return canvas.toDataURL()
  }, [])

  if (!src || imageError) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-muted rounded-lg",
          className
        )}
        style={{ width, height }}
        role="img"
        aria-label={alt}
      >
        {fallbackIcon || <ChefHat className="w-12 h-12 text-muted-foreground" />}
      </div>
    )
  }

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Loading placeholder */}
      {isLoading && (
        <div
          className="absolute inset-0 bg-muted animate-pulse rounded-lg"
          style={{ width, height }}
        />
      )}

      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={cn(
          "object-cover transition-opacity duration-300",
          isLoading ? "opacity-0" : "opacity-100"
        )}
        priority={priority}
        sizes={sizes}
        quality={quality}
        onLoad={handleLoad}
        onError={handleError}
        placeholder={placeholder}
        blurDataURL={blurDataURL || (placeholder === 'blur' ? generateBlurDataURL(40, 30) : undefined)}
      />
    </div>
  )
}

// Specialized recipe image component
export function RecipeImage({
  src,
  title,
  className,
  priority = false,
  ...props
}: Omit<OptimizedImageProps, 'alt' | 'fallbackIcon'> & {
  title: string
}) {
  return (
    <OptimizedImage
      src={src}
      alt={`Photo of ${title} recipe`}
      className={className}
      fallbackIcon={<ChefHat className="w-12 h-12 text-muted-foreground" />}
      priority={priority}
      placeholder="blur"
      {...props}
    />
  )
}

// Avatar image component
export function AvatarImage({
  src,
  name,
  size = 40,
  className,
  ...props
}: Omit<OptimizedImageProps, 'alt' | 'width' | 'height' | 'fallbackIcon'> & {
  name: string
  size?: number
}) {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className={cn("relative overflow-hidden rounded-full", className)}>
      {src ? (
        <OptimizedImage
          src={src}
          alt={`${name}'s profile picture`}
          width={size}
          height={size}
          className="rounded-full"
          fallbackIcon={
            <div className="w-full h-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
              {initials}
            </div>
          }
          {...props}
        />
      ) : (
        <div
          className="w-full h-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium"
          style={{ width: size, height: size }}
        >
          {initials}
        </div>
      )}
    </div>
  )
}