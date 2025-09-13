const { PrismaClient } = require('@prisma/client')
const { randomBytes } = require('crypto')

const prisma = new PrismaClient()

const countries = [
  { country: "United States", cities: ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix"] },
  { country: "United Kingdom", cities: ["London", "Manchester", "Birmingham", "Glasgow", "Liverpool"] },
  { country: "France", cities: ["Paris", "Lyon", "Marseille", "Toulouse", "Nice"] },
  { country: "Germany", cities: ["Berlin", "Hamburg", "Munich", "Cologne", "Frankfurt"] },
  { country: "Canada", cities: ["Toronto", "Vancouver", "Montreal", "Calgary", "Ottawa"] },
  { country: "Australia", cities: ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide"] },
  { country: "Japan", cities: ["Tokyo", "Osaka", "Kyoto", "Yokohama", "Nagoya"] },
  { country: "Brazil", cities: ["São Paulo", "Rio de Janeiro", "Brasília", "Salvador", "Fortaleza"] },
  { country: "India", cities: ["Mumbai", "Delhi", "Bangalore", "Chennai", "Kolkata"] },
  { country: "Spain", cities: ["Madrid", "Barcelona", "Valencia", "Seville", "Bilbao"] }
]

const devices = ["desktop", "mobile", "tablet"]
const browsers = ["chrome", "firefox", "safari", "edge"]
const operatingSystems = ["windows", "macos", "android", "ios", "linux"]
const referrerSources = ["google", "facebook", "twitter", "instagram", "direct", "referral"]
const interactionTypes = ["like", "share", "print", "save", "copy_ingredients", "copy_url"]

function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)]
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function generateVisitorId() {
  return randomBytes(16).toString('hex')
}

function getRandomDate(daysAgo) {
  const date = new Date()
  date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo))
  date.setHours(Math.floor(Math.random() * 24))
  date.setMinutes(Math.floor(Math.random() * 60))
  return date
}

async function seedAnalytics() {
  try {
    console.log('🚀 Starting analytics seeding...')
    
    // Get all recipes
    const recipes = await prisma.recipe.findMany()
    console.log(`📊 Found ${recipes.length} recipes to add analytics for`)
    
    // Create visitor sessions
    const visitorIds = []
    for (let i = 0; i < 500; i++) { // 500 unique visitors
      const visitorId = generateVisitorId()
      visitorIds.push(visitorId)
      
      const locationData = randomChoice(countries)
      const city = randomChoice(locationData.cities)
      
      await prisma.visitorSession.create({
        data: {
          visitorId,
          device: randomChoice(devices),
          browser: randomChoice(browsers),
          os: randomChoice(operatingSystems),
          country: locationData.country,
          city,
          region: city, // simplified
          latitude: Math.random() * 180 - 90,
          longitude: Math.random() * 360 - 180,
          firstSeen: getRandomDate(90),
          lastSeen: getRandomDate(7),
          pageViews: randomBetween(1, 15),
          totalTime: randomBetween(30, 1800) // 30 seconds to 30 minutes
        }
      })
    }
    
    console.log(`✅ Created ${visitorIds.length} visitor sessions`)
    
    // Generate views for each recipe
    for (const recipe of recipes) {
      const viewCount = randomBetween(100, 1500) // Each recipe gets 100-1500 views
      console.log(`📈 Adding ${viewCount} views for "${recipe.title}"`)
      
      for (let i = 0; i < viewCount; i++) {
        const visitorId = randomChoice(visitorIds)
        const viewDate = getRandomDate(60) // Views in last 60 days
        const locationData = randomChoice(countries)
        const city = randomChoice(locationData.cities)
        const timeSpent = randomBetween(10, 600) // 10 seconds to 10 minutes
        const scrollDepth = Math.random() * 100
        const bounced = timeSpent < 30 && scrollDepth < 25 // Bounced if less than 30s and <25% scroll
        
        await prisma.recipeView.create({
          data: {
            recipeId: recipe.id,
            visitorId,
            ipAddress: `${randomBetween(1,255)}.${randomBetween(1,255)}.${randomBetween(1,255)}.${randomBetween(1,255)}`,
            userAgent: `Mozilla/5.0 (${randomChoice(['Windows NT 10.0', 'Macintosh', 'X11; Linux x86_64'])}) ${randomChoice(['Chrome', 'Firefox', 'Safari'])}/120.0`,
            country: locationData.country,
            city,
            region: city,
            timezone: 'UTC',
            timeSpent,
            scrollDepth,
            bounced,
            referrer: Math.random() > 0.3 ? `https://${randomChoice(['google.com', 'facebook.com', 'twitter.com', 'direct'])}/` : null,
            source: randomChoice(referrerSources),
            medium: randomChoice(['search', 'social', 'referral', 'direct']),
            viewedAt: viewDate
          }
        })
      }
      
      // Add interactions for this recipe
      const interactionCount = randomBetween(20, 200)
      for (let i = 0; i < interactionCount; i++) {
        const visitorId = randomChoice(visitorIds)
        const interactionType = randomChoice(interactionTypes)
        
        await prisma.recipeInteraction.create({
          data: {
            recipeId: recipe.id,
            visitorId,
            type: interactionType,
            value: interactionType === 'share' ? randomChoice(['facebook', 'twitter', 'pinterest', 'whatsapp']) : null,
            createdAt: getRandomDate(60)
          }
        })
      }
      
      // Add revenue data (affiliate/ads)
      const revenueEntries = randomBetween(5, 50)
      for (let i = 0; i < revenueEntries; i++) {
        const source = randomChoice(['affiliate', 'ads', 'premium', 'cookbook'])
        let amount = 0
        
        switch (source) {
          case 'affiliate':
            amount = randomBetween(50, 2000) // $0.50 - $20.00
            break
          case 'ads':
            amount = randomBetween(5, 100) // $0.05 - $1.00
            break
          case 'premium':
            amount = randomBetween(299, 999) // $2.99 - $9.99
            break
          case 'cookbook':
            amount = randomBetween(1999, 4999) // $19.99 - $49.99
            break
        }
        
        const locationData = randomChoice(countries)
        
        await prisma.recipeRevenue.create({
          data: {
            recipeId: recipe.id,
            source,
            amount,
            currency: 'USD',
            visitorId: Math.random() > 0.3 ? randomChoice(visitorIds) : null,
            country: locationData.country,
            transactionId: `tx_${randomBytes(8).toString('hex')}`,
            platform: randomChoice(['amazon', 'google_ads', 'facebook_ads', 'direct', 'stripe']),
            createdAt: getRandomDate(90)
          }
        })
      }
    }
    
    console.log('✨ Analytics seeding completed!')
    
    // Show summary
    const [totalViews, totalInteractions, totalRevenue] = await Promise.all([
      prisma.recipeView.count(),
      prisma.recipeInteraction.count(),
      prisma.recipeRevenue.aggregate({ _sum: { amount: true } })
    ])
    
    console.log('📊 Summary:')
    console.log(`   👁️  Total Views: ${totalViews.toLocaleString()}`)
    console.log(`   🎯 Total Interactions: ${totalInteractions.toLocaleString()}`)
    console.log(`   💰 Total Revenue: $${((totalRevenue._sum.amount || 0) / 100).toLocaleString()}`)
    
  } catch (error) {
    console.error('❌ Error seeding analytics:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedAnalytics()