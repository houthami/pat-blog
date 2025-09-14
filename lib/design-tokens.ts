// Design System Tokens for Pastry Blog Admin
// Centralized design tokens for consistent spacing, typography, and sizing

export const designTokens = {
  // Spacing Scale (based on 4px grid)
  spacing: {
    xs: '0.25rem',    // 4px
    sm: '0.5rem',     // 8px
    md: '0.75rem',    // 12px
    lg: '1rem',       // 16px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '2rem',    // 32px
    '4xl': '2.5rem',  // 40px
    '5xl': '3rem',    // 48px
    '6xl': '4rem',    // 64px
    '7xl': '5rem',    // 80px
    '8xl': '6rem',    // 96px
  },

  // Typography Scale
  typography: {
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }],      // 12px
      sm: ['0.875rem', { lineHeight: '1.25rem' }],   // 14px
      base: ['1rem', { lineHeight: '1.5rem' }],      // 16px
      lg: ['1.125rem', { lineHeight: '1.75rem' }],   // 18px
      xl: ['1.25rem', { lineHeight: '1.75rem' }],    // 20px
      '2xl': ['1.5rem', { lineHeight: '2rem' }],     // 24px
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }],   // 36px
      '5xl': ['3rem', { lineHeight: '1' }],           // 48px
      '6xl': ['3.75rem', { lineHeight: '1' }],        // 60px
    },
    fontWeight: {
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
    },
  },

  // Component Sizing
  components: {
    button: {
      height: {
        sm: '2rem',    // 32px
        md: '2.5rem',  // 40px
        lg: '3rem',    // 48px
      },
      padding: {
        sm: { x: '0.75rem', y: '0.5rem' },
        md: { x: '1rem', y: '0.625rem' },
        lg: { x: '1.5rem', y: '0.75rem' },
      },
    },
    card: {
      padding: {
        sm: '1rem',
        md: '1.5rem',
        lg: '2rem',
      },
      borderRadius: '0.5rem',
    },
    input: {
      height: '2.5rem', // 40px
      padding: { x: '0.75rem', y: '0.5rem' },
    },
  },

  // Elevation/Shadow System
  elevation: {
    none: 'none',
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  },

  // Border Radius Scale
  borderRadius: {
    none: '0',
    sm: '0.125rem',   // 2px
    base: '0.25rem',  // 4px
    md: '0.375rem',   // 6px
    lg: '0.5rem',     // 8px
    xl: '0.75rem',    // 12px
    '2xl': '1rem',    // 16px
    '3xl': '1.5rem',  // 24px
    full: '9999px',
  },

  // Breakpoints
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  // Z-Index Scale
  zIndex: {
    hide: -1,
    base: 0,
    dropdown: 10,
    sticky: 20,
    banner: 30,
    overlay: 40,
    modal: 50,
    popover: 60,
    tooltip: 70,
    toast: 80,
    max: 9999,
  },

  // Animation Durations
  animation: {
    duration: {
      fast: '150ms',
      normal: '200ms',
      slow: '300ms',
      slower: '500ms',
    },
    easing: {
      linear: 'linear',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
} as const

// Utility functions for using design tokens
export const getSpacing = (size: keyof typeof designTokens.spacing) => designTokens.spacing[size]
export const getElevation = (level: keyof typeof designTokens.elevation) => designTokens.elevation[level]
export const getBorderRadius = (size: keyof typeof designTokens.borderRadius) => designTokens.borderRadius[size]

// CSS-in-JS utilities
export const createSpacingClasses = () => {
  const classes: Record<string, string> = {}
  Object.entries(designTokens.spacing).forEach(([key, value]) => {
    classes[`spacing-${key}`] = value
  })
  return classes
}

export const createTypographyClasses = () => {
  const classes: Record<string, any> = {}
  Object.entries(designTokens.typography.fontSize).forEach(([key, value]) => {
    classes[`text-${key}`] = {
      fontSize: value[0],
      lineHeight: value[1].lineHeight,
    }
  })
  return classes
}