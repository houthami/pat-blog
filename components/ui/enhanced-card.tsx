import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const cardVariants = cva(
  "rounded-lg border bg-card text-card-foreground transition-all duration-200",
  {
    variants: {
      variant: {
        default: "shadow-sm",
        elevated: "shadow-md",
        outline: "border-2",
        ghost: "border-transparent bg-transparent",
      },
      padding: {
        none: "p-0",
        sm: "p-4",
        md: "p-6",
        lg: "p-8",
      },
      hover: {
        none: "",
        lift: "hover:shadow-lg hover:-translate-y-1",
        glow: "hover:shadow-lg hover:shadow-primary/20",
        scale: "hover:scale-105",
      },
      interactive: {
        true: "cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      padding: "md",
      hover: "none",
      interactive: false,
    },
  }
)

const cardHeaderVariants = cva(
  "flex flex-col space-y-1.5",
  {
    variants: {
      padding: {
        none: "p-0",
        sm: "p-4 pb-2",
        md: "p-6 pb-3",
        lg: "p-8 pb-4",
      },
    },
    defaultVariants: {
      padding: "md",
    },
  }
)

const cardContentVariants = cva(
  "",
  {
    variants: {
      padding: {
        none: "p-0",
        sm: "p-4 pt-0",
        md: "p-6 pt-0",
        lg: "p-8 pt-0",
      },
    },
    defaultVariants: {
      padding: "md",
    },
  }
)

const cardFooterVariants = cva(
  "flex items-center",
  {
    variants: {
      padding: {
        none: "p-0",
        sm: "p-4 pt-0",
        md: "p-6 pt-0",
        lg: "p-8 pt-0",
      },
    },
    defaultVariants: {
      padding: "md",
    },
  }
)

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

export interface CardHeaderProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardHeaderVariants> {}

export interface CardContentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardContentVariants> {}

export interface CardFooterProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardFooterVariants> {}

const EnhancedCard = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, hover, interactive, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, padding, hover, interactive }), className)}
      tabIndex={interactive ? 0 : undefined}
      role={interactive ? "button" : undefined}
      {...props}
    />
  )
)
EnhancedCard.displayName = "EnhancedCard"

const EnhancedCardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, padding, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardHeaderVariants({ padding }), className)}
      {...props}
    />
  )
)
EnhancedCardHeader.displayName = "EnhancedCardHeader"

const EnhancedCardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
EnhancedCardTitle.displayName = "EnhancedCardTitle"

const EnhancedCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
EnhancedCardDescription.displayName = "EnhancedCardDescription"

const EnhancedCardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, padding, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardContentVariants({ padding }), className)}
      {...props}
    />
  )
)
EnhancedCardContent.displayName = "EnhancedCardContent"

const EnhancedCardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, padding, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardFooterVariants({ padding }), className)}
      {...props}
    />
  )
)
EnhancedCardFooter.displayName = "EnhancedCardFooter"

export {
  EnhancedCard,
  EnhancedCardHeader,
  EnhancedCardFooter,
  EnhancedCardTitle,
  EnhancedCardDescription,
  EnhancedCardContent,
}