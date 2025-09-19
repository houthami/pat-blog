"use client"

import { useEffect, useRef, useCallback } from "react"

interface AnalyticsTrackerProps {
  recipeId: string
}

export function AnalyticsTracker({ recipeId }: AnalyticsTrackerProps) {
  const startTime = useRef<number>(Date.now())
  const maxScroll = useRef<number>(0)
  const hasTrackedView = useRef<boolean>(false)
  const visitorId = useRef<string>("")

  const trackView = useCallback(() => {
    if (hasTrackedView.current) return
    hasTrackedView.current = true

    console.log("📊 Tracking initial page view...")

    fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipeId,
        visitorId: visitorId.current,
        type: "view",
        timeSpent: 0,
        scrollDepth: 0,
        bounced: true
      })
    })
    .then(response => response.json())
    .then(data => {
      console.log("✅ View tracked successfully:", data)
    })
    .catch(error => {
      console.error("❌ Error tracking view:", error)
    })
  }, [recipeId])

  useEffect(() => {
    // Generate or get visitor ID from localStorage
    let storedVisitorId = localStorage.getItem("visitor-id")
    if (!storedVisitorId) {
      storedVisitorId = crypto.randomUUID()
      localStorage.setItem("visitor-id", storedVisitorId)
    }
    visitorId.current = storedVisitorId

    console.log("🎯 Analytics Tracker initialized for recipe:", recipeId)
    console.log("👤 Visitor ID:", visitorId.current)

    // Track page view immediately
    trackView()

    // Set up scroll tracking
    const handleScroll = () => {
      const scrollPercent = Math.min(100, Math.round(
        (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
      ))
      maxScroll.current = Math.max(maxScroll.current, scrollPercent)
    }

    // Set up interaction tracking
    const trackInteraction = (type: string, value?: string) => {
      fetch("/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipeId,
          visitorId: visitorId.current,
          type: "interaction",
          interactionType: type,
          interactionValue: value
        })
      }).catch(console.error)
    }

    // Add event listeners for interactions
    const handleShare = () => trackInteraction("share", "web-api")
    const handlePrint = () => trackInteraction("print")
    const handleCopy = () => trackInteraction("copy_ingredients")

    // Add scroll listener
    window.addEventListener("scroll", handleScroll)
    
    // Add interaction listeners
    document.addEventListener("keydown", (e) => {
      if (e.ctrlKey && e.key === "p") handlePrint()
      if (e.ctrlKey && e.key === "c") handleCopy()
    })

    // Track when user leaves page
    const handleBeforeUnload = () => {
      const timeSpent = Math.round((Date.now() - startTime.current) / 1000)
      const bounced = timeSpent < 15 && maxScroll.current < 25
      
      // Use sendBeacon for reliable tracking on page unload
      const data = JSON.stringify({
        recipeId,
        visitorId: visitorId.current,
        type: "view",
        timeSpent,
        scrollDepth: maxScroll.current,
        bounced
      })
      
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/analytics/track", data)
      } else {
        // Fallback for browsers without sendBeacon
        fetch("/api/analytics/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: data,
          keepalive: true
        }).catch(console.error)
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)

    // Cleanup
    return () => {
      window.removeEventListener("scroll", handleScroll)
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [recipeId, trackView])

  // This component renders nothing visible
  return null
}

// Helper component for adding interaction tracking to buttons
export function InteractionButton({ 
  children, 
  onClick, 
  recipeId, 
  interactionType, 
  interactionValue,
  ...props 
}: {
  children: React.ReactNode
  onClick?: () => void
  recipeId: string
  interactionType: string
  interactionValue?: string
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  
  const handleClick = () => {
    // Track interaction
    const visitorId = localStorage.getItem("visitor-id") || crypto.randomUUID()
    
    fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipeId,
        visitorId,
        type: "interaction",
        interactionType,
        interactionValue
      })
    }).catch(console.error)

    // Call original onClick
    onClick?.()
  }

  return (
    <button {...props} onClick={handleClick}>
      {children}
    </button>
  )
}