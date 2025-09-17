import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || !['ADMIN', 'EDITOR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const timeframe = searchParams.get('timeframe') || '30d'

    // Calculate date range
    const daysAgo = timeframe === '7d' ? 7 : timeframe === '90d' ? 90 : 30
    const startDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
    const endDate = new Date()

    const [
      revenueMetrics,
      userMetrics,
      affiliateMetrics,
      topAffiliateLinks,
      topRecipes,
      previousPeriodRevenue
    ] = await Promise.all([
      // Revenue metrics
      getRevenueMetrics(startDate, endDate),

      // User metrics
      getUserMetrics(startDate, endDate),

      // Affiliate performance
      getAffiliateMetrics(startDate, endDate),

      // Top performing affiliate links
      getTopAffiliateLinks(startDate, endDate, 5),

      // Top revenue-generating recipes
      getTopRecipes(startDate, endDate, 5),

      // Previous period for growth calculation
      getPreviousPeriodRevenue(startDate, daysAgo)
    ])

    // Calculate growth rate
    const monthlyGrowth = previousPeriodRevenue > 0
      ? ((revenueMetrics.totalRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 100
      : 0

    const response = {
      totalRevenue: revenueMetrics.totalRevenue,
      subscriptionRevenue: revenueMetrics.subscriptionRevenue,
      affiliateRevenue: revenueMetrics.affiliateRevenue,
      adRevenue: revenueMetrics.adRevenue,
      monthlyGrowth,
      userMetrics,
      affiliateMetrics,
      topPerformers: {
        affiliateLinks: topAffiliateLinks,
        recipes: topRecipes
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Revenue analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch revenue analytics' },
      { status: 500 }
    )
  }
}

async function getRevenueMetrics(startDate: Date, endDate: Date) {
  try {
    // Subscription revenue from active subscriptions
    const subscriptionRevenue = await prisma.$queryRaw`
      SELECT COALESCE(SUM(
        CASE
          WHEN subscription_tier = 'PREMIUM' THEN 9.99
          WHEN subscription_tier = 'PRO' THEN 19.99
          ELSE 0
        END
      ), 0) as revenue
      FROM users
      WHERE subscription_status = 'ACTIVE'
        AND subscription_expires_at > ${endDate}
        AND created_at <= ${endDate}
    ` as any[]

    // Affiliate revenue from conversions
    const affiliateRevenue = await prisma.$queryRaw`
      SELECT COALESCE(SUM(commission_earned), 0) as revenue
      FROM affiliate_conversions
      WHERE created_at BETWEEN ${startDate} AND ${endDate}
    ` as any[]

    // Ad revenue from clicks and impressions
    const adRevenue = await prisma.$queryRaw`
      SELECT COALESCE(SUM(revenue), 0) as revenue
      FROM ads
      WHERE last_click_at BETWEEN ${startDate} AND ${endDate}
    ` as any[]

    const subscriptionTotal = Number(subscriptionRevenue[0]?.revenue || 0)
    const affiliateTotal = Number(affiliateRevenue[0]?.revenue || 0)
    const adTotal = Number(adRevenue[0]?.revenue || 0)

    return {
      totalRevenue: subscriptionTotal + affiliateTotal + adTotal,
      subscriptionRevenue: subscriptionTotal,
      affiliateRevenue: affiliateTotal,
      adRevenue: adTotal
    }
  } catch (error) {
    console.error('Revenue metrics error:', error)
    return {
      totalRevenue: 0,
      subscriptionRevenue: 0,
      affiliateRevenue: 0,
      adRevenue: 0
    }
  }
}

async function getUserMetrics(startDate: Date, endDate: Date) {
  try {
    const [totalUsers, freeUsers, premiumUsers] = await Promise.all([
      prisma.user.count({
        where: { createdAt: { lte: endDate } }
      }),

      prisma.user.count({
        where: {
          createdAt: { lte: endDate },
          OR: [
            { subscriptionTier: null },
            { subscriptionTier: 'FREE' },
            { subscriptionStatus: 'INACTIVE' }
          ]
        }
      }),

      prisma.user.count({
        where: {
          subscriptionStatus: 'ACTIVE',
          subscriptionExpiresAt: { gt: endDate },
          subscriptionTier: { in: ['PREMIUM', 'PRO'] }
        }
      })
    ])

    const conversionRate = totalUsers > 0 ? (premiumUsers / totalUsers) * 100 : 0

    return {
      totalUsers,
      freeUsers,
      premiumUsers,
      conversionRate
    }
  } catch (error) {
    console.error('User metrics error:', error)
    return {
      totalUsers: 0,
      freeUsers: 0,
      premiumUsers: 0,
      conversionRate: 0
    }
  }
}

async function getAffiliateMetrics(startDate: Date, endDate: Date) {
  try {
    const [clickStats, conversionStats] = await Promise.all([
      prisma.$queryRaw`
        SELECT COUNT(*) as total_clicks
        FROM affiliate_link_clicks
        WHERE clicked_at BETWEEN ${startDate} AND ${endDate}
      ` as any[],

      prisma.$queryRaw`
        SELECT
          COUNT(*) as total_conversions,
          AVG(commission_earned) as avg_commission
        FROM affiliate_conversions
        WHERE created_at BETWEEN ${startDate} AND ${endDate}
      ` as any[]
    ])

    const totalClicks = Number(clickStats[0]?.total_clicks || 0)
    const totalConversions = Number(conversionStats[0]?.total_conversions || 0)
    const averageCommission = Number(conversionStats[0]?.avg_commission || 0)

    const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0

    return {
      totalClicks,
      totalConversions,
      conversionRate,
      averageCommission
    }
  } catch (error) {
    console.error('Affiliate metrics error:', error)
    return {
      totalClicks: 0,
      totalConversions: 0,
      conversionRate: 0,
      averageCommission: 0
    }
  }
}

async function getTopAffiliateLinks(startDate: Date, endDate: Date, limit: number) {
  try {
    const topLinks = await prisma.$queryRaw`
      SELECT
        al.id,
        al.product_name,
        COALESCE(SUM(ac.commission_earned), 0) as revenue,
        COUNT(DISTINCT alc.id) as clicks,
        CASE
          WHEN COUNT(DISTINCT alc.id) > 0
          THEN (COUNT(DISTINCT ac.id) * 100.0) / COUNT(DISTINCT alc.id)
          ELSE 0
        END as conversion_rate
      FROM affiliate_links al
      LEFT JOIN affiliate_link_clicks alc ON al.id = alc.affiliate_link_id
        AND alc.clicked_at BETWEEN ${startDate} AND ${endDate}
      LEFT JOIN affiliate_conversions ac ON al.id = ac.affiliate_link_id
        AND ac.created_at BETWEEN ${startDate} AND ${endDate}
      WHERE al.is_active = true
      GROUP BY al.id, al.product_name
      HAVING COUNT(DISTINCT alc.id) > 0
      ORDER BY revenue DESC
      LIMIT ${limit}
    ` as any[]

    return topLinks.map(link => ({
      id: link.id,
      productName: link.product_name,
      revenue: Number(link.revenue),
      clicks: Number(link.clicks),
      conversionRate: Number(link.conversion_rate)
    }))
  } catch (error) {
    console.error('Top affiliate links error:', error)
    return []
  }
}

async function getTopRecipes(startDate: Date, endDate: Date, limit: number) {
  try {
    const topRecipes = await prisma.$queryRaw`
      SELECT
        r.id,
        r.title,
        COALESCE(SUM(ac.commission_earned), 0) as affiliate_revenue,
        COALESCE(r.views, 0) as views
      FROM recipes r
      LEFT JOIN affiliate_links al ON r.id = al.recipe_id
      LEFT JOIN affiliate_conversions ac ON al.id = ac.affiliate_link_id
        AND ac.created_at BETWEEN ${startDate} AND ${endDate}
      WHERE r.status = 'PUBLISHED'
      GROUP BY r.id, r.title, r.views
      HAVING affiliate_revenue > 0
      ORDER BY affiliate_revenue DESC
      LIMIT ${limit}
    ` as any[]

    return topRecipes.map(recipe => ({
      id: recipe.id,
      title: recipe.title,
      affiliateRevenue: Number(recipe.affiliate_revenue),
      views: Number(recipe.views)
    }))
  } catch (error) {
    console.error('Top recipes error:', error)
    return []
  }
}

async function getPreviousPeriodRevenue(startDate: Date, daysAgo: number) {
  try {
    const previousStartDate = new Date(startDate.getTime() - daysAgo * 24 * 60 * 60 * 1000)
    const previousEndDate = startDate

    const previousRevenue = await getRevenueMetrics(previousStartDate, previousEndDate)
    return previousRevenue.totalRevenue
  } catch (error) {
    console.error('Previous period revenue error:', error)
    return 0
  }
}