import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createSubscriptionSchema = z.object({
  planId: z.enum(['free', 'premium', 'pro']),
  isAnnual: z.boolean().default(false),
  currentFeature: z.string().optional(),
  paymentMethodId: z.string().optional() // For Stripe integration
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createSubscriptionSchema.parse(body)

    // Free plan doesn't require payment processing
    if (validatedData.planId === 'free') {
      return NextResponse.json({
        message: 'Already on free plan',
        planId: 'free'
      })
    }

    // Get plan details
    const planDetails = getPlanDetails(validatedData.planId, validatedData.isAnnual)
    if (!planDetails) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    // Mock payment processing (integrate with Stripe in production)
    const subscriptionId = await processPayment({
      userId: session.user.id,
      planId: validatedData.planId,
      amount: planDetails.price,
      currency: 'USD',
      isAnnual: validatedData.isAnnual,
      paymentMethodId: validatedData.paymentMethodId
    })

    // Update user's subscription
    const expiresAt = new Date()
    if (validatedData.isAnnual) {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1)
    } else {
      expiresAt.setMonth(expiresAt.getMonth() + 1)
    }

    // Update user role and subscription info
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        role: validatedData.planId === 'pro' ? 'ADMIN' : 'EDITOR',
        subscriptionTier: validatedData.planId.toUpperCase(),
        subscriptionId: subscriptionId,
        subscriptionExpiresAt: expiresAt,
        subscriptionStatus: 'ACTIVE'
      }
    })

    // Log subscription event
    await logSubscriptionEvent({
      userId: session.user.id,
      action: 'SUBSCRIPTION_CREATED',
      planId: validatedData.planId,
      amount: planDetails.price,
      billingCycle: validatedData.isAnnual ? 'ANNUAL' : 'MONTHLY',
      feature: validatedData.currentFeature
    })

    // Send welcome email (mock)
    await sendWelcomeEmail(session.user.email!, validatedData.planId)

    return NextResponse.json({
      message: 'Subscription created successfully',
      subscription: {
        id: subscriptionId,
        planId: validatedData.planId,
        status: 'ACTIVE',
        expiresAt: expiresAt.toISOString(),
        features: getPlanFeatures(validatedData.planId)
      }
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid subscription data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Subscription creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's current subscription
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        subscriptionTier: true,
        subscriptionId: true,
        subscriptionStatus: true,
        subscriptionExpiresAt: true,
        role: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const currentPlan = (user.subscriptionTier || 'FREE').toLowerCase()
    const isActive = user.subscriptionStatus === 'ACTIVE'
    const isExpired = user.subscriptionExpiresAt && new Date() > user.subscriptionExpiresAt

    return NextResponse.json({
      currentPlan,
      isActive: isActive && !isExpired,
      expiresAt: user.subscriptionExpiresAt,
      features: getPlanFeatures(currentPlan),
      canUsePremiumFeatures: isActive && !isExpired && ['premium', 'pro'].includes(currentPlan),
      billing: {
        nextBillingDate: user.subscriptionExpiresAt,
        cancelAtPeriodEnd: false // Would integrate with actual billing provider
      }
    })
  } catch (error) {
    console.error('Subscription fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    )
  }
}

// Helper functions
function getPlanDetails(planId: string, isAnnual: boolean) {
  const plans = {
    premium: {
      monthly: 9.99,
      annual: 9.99 * 12 * 0.83 // 17% discount
    },
    pro: {
      monthly: 19.99,
      annual: 19.99 * 12 * 0.83 // 17% discount
    }
  }

  const plan = plans[planId as keyof typeof plans]
  if (!plan) return null

  return {
    price: isAnnual ? plan.annual : plan.monthly,
    billingCycle: isAnnual ? 'annual' : 'monthly',
    discount: isAnnual ? 0.17 : 0
  }
}

function getPlanFeatures(planId: string) {
  const features = {
    free: [
      'recipe-viewing',
      'community-comments',
      'basic-mobile-access'
    ],
    premium: [
      'unlimited-recipes',
      'meal-planning',
      'shopping-lists',
      'recipe-scaling',
      'nutrition-tracking',
      'ad-free-experience',
      'priority-support'
    ],
    pro: [
      'everything-in-premium',
      'recipe-analytics',
      'affiliate-tracking',
      'api-access',
      'custom-branding',
      'bulk-operations',
      'advanced-exports',
      'white-label-options'
    ]
  }

  return features[planId as keyof typeof features] || features.free
}

async function processPayment(paymentData: any): Promise<string> {
  // Mock payment processing - integrate with Stripe, PayPal, etc.

  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000))

  // Mock payment success (95% success rate)
  if (Math.random() > 0.95) {
    throw new Error('Payment processing failed')
  }

  // Generate mock subscription ID
  return `sub_${Date.now()}_${Math.random().toString(36).substring(2)}`
}

async function logSubscriptionEvent(eventData: any) {
  try {
    // In production, log to analytics service, database, etc.
    console.log('Subscription event:', eventData)

    // Could store in subscription_events table for analytics
    await prisma.$executeRaw`
      INSERT INTO subscription_events (
        user_id, action, plan_id, amount, billing_cycle,
        feature, created_at
      ) VALUES (
        ${eventData.userId}, ${eventData.action}, ${eventData.planId},
        ${eventData.amount}, ${eventData.billingCycle}, ${eventData.feature},
        ${new Date()}
      )
    `
  } catch (error) {
    console.error('Failed to log subscription event:', error)
    // Don't throw - this is not critical
  }
}

async function sendWelcomeEmail(email: string, planId: string) {
  try {
    // Mock email sending - integrate with SendGrid, Mailgun, etc.
    console.log(`Sending welcome email to ${email} for ${planId} plan`)

    const emailContent = {
      premium: {
        subject: 'Welcome to Premium! 🎉',
        template: 'premium-welcome'
      },
      pro: {
        subject: 'Welcome to Pro! 🚀',
        template: 'pro-welcome'
      }
    }

    const content = emailContent[planId as keyof typeof emailContent]
    if (content) {
      // Would send actual email here
      console.log(`Email sent: ${content.subject}`)
    }
  } catch (error) {
    console.error('Failed to send welcome email:', error)
    // Don't throw - this is not critical
  }
}