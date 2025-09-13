import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { headers } from "next/headers"

interface TrackingData {
  recipeId: string
  visitorId: string
  type: "view" | "interaction"
  
  // For views
  timeSpent?: number
  scrollDepth?: number
  bounced?: boolean
  
  // For interactions  
  interactionType?: string
  interactionValue?: string
}

// Simulated IP geolocation
function getLocationFromIP(ip: string) {
  const locations = [
    { country: "United States", city: "New York", region: "NY" },
    { country: "United Kingdom", city: "London", region: "England" },
    { country: "France", city: "Paris", region: "Île-de-France" },
    { country: "Germany", city: "Berlin", region: "Berlin" },
    { country: "Canada", city: "Toronto", region: "ON" },
    { country: "Australia", city: "Sydney", region: "NSW" },
    { country: "Japan", city: "Tokyo", region: "Tokyo" },
    { country: "Brazil", city: "São Paulo", region: "SP" },
    { country: "India", city: "Mumbai", region: "Maharashtra" },
    { country: "Spain", city: "Madrid", region: "Madrid" }
  ]
  
  // Simple hash to consistently return same location for same IP
  const hash = ip.split('').reduce((a, b) => a + b.charCodeAt(0), 0)
  return locations[hash % locations.length]
}

// Extract device info from user agent
function getDeviceInfo(userAgent: string) {
  const mobile = /Mobile|Android|iPhone|iPad/i.test(userAgent)
  const tablet = /iPad|Tablet/i.test(userAgent)
  const device = tablet ? "tablet" : mobile ? "mobile" : "desktop"
  
  let browser = "chrome"
  if (userAgent.includes("Firefox")) browser = "firefox"
  else if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) browser = "safari"
  else if (userAgent.includes("Edge")) browser = "edge"
  
  let os = "windows"
  if (userAgent.includes("Mac")) os = "macos"
  else if (userAgent.includes("Android")) os = "android"
  else if (userAgent.includes("iOS")) os = "ios"
  else if (userAgent.includes("Linux")) os = "linux"
  
  return { device, browser, os }
}

export async function POST(request: Request) {
  try {
    const headersList = await headers()
    const userAgent = headersList.get("user-agent") || "Unknown"
    const ipAddress = headersList.get("x-forwarded-for") || 
                     headersList.get("x-real-ip") || 
                     "127.0.0.1"
    const referrer = headersList.get("referer") || ""
    
    const data: TrackingData = await request.json()
    
    // Get location and device data
    const location = getLocationFromIP(ipAddress)
    const deviceInfo = getDeviceInfo(userAgent)
    
    // Update or create visitor session
    const session = await prisma.visitorSession.upsert({
      where: { visitorId: data.visitorId },
      update: { 
        lastSeen: new Date(),
        pageViews: { increment: 1 },
        totalTime: { increment: data.timeSpent || 0 }
      },
      create: {
        visitorId: data.visitorId,
        device: deviceInfo.device,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        country: location.country,
        city: location.city,
        region: location.region,
        pageViews: 1,
        totalTime: data.timeSpent || 0
      }
    })
    
    if (data.type === "view") {
      // Track recipe view
      const view = await prisma.recipeView.create({
        data: {
          recipeId: data.recipeId,
          visitorId: data.visitorId,
          ipAddress,
          userAgent,
          country: location.country,
          city: location.city,
          region: location.region,
          timezone: "UTC",
          timeSpent: data.timeSpent || 0,
          scrollDepth: data.scrollDepth || 0,
          bounced: data.bounced ?? true,
          referrer,
          source: "direct",
          medium: "direct"
        }
      })
    } else if (data.type === "interaction") {
      // Track recipe interaction
      const interaction = await prisma.recipeInteraction.create({
        data: {
          recipeId: data.recipeId,
          visitorId: data.visitorId,
          type: data.interactionType || "unknown",
          value: data.interactionValue
        }
      })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("❌ Analytics tracking error:", error)
    return NextResponse.json({ 
      error: "Failed to track", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 })
  }
}