import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

// Map Stripe price IDs to plan names
const PRICE_TO_PLAN: Record<string, string> = {
  [process.env.STRIPE_STANDARD_PRICE_ID!]: 'STANDARD',
  [process.env.STRIPE_PRO_PRICE_ID!]: 'PRO',
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('[webhook] signature verification failed', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const businessId = session.metadata?.businessId
        const plan = session.metadata?.plan
        if (!businessId || !plan) break

        await prisma.business.update({
          where: { id: businessId },
          data: {
            subscription: plan as any,
            subscriptionStart: new Date(),
            subscriptionEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            billingCycle: 'monthly',
            autoRenew: true,
          },
        })
        console.log(`[webhook] Business ${businessId} upgraded to ${plan}`)
        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        const priceId = sub.items.data[0]?.price.id
        const plan = PRICE_TO_PLAN[priceId] || 'FREE'

        // Find business by stripe customer id
        const business = await prisma.business.findFirst({
          where: { stripeCustomerId: sub.customer as string }
        })
        if (!business) break

        await prisma.business.update({
          where: { id: business.id },
          data: {
            subscription: plan as any,
            subscriptionEnd: new Date((sub as any).current_period_end * 1000),
            autoRenew: !sub.cancel_at_period_end,
          },
        })
        console.log(`[webhook] Business ${business.id} subscription updated to ${plan}`)
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const business = await prisma.business.findFirst({
          where: { stripeCustomerId: sub.customer as string }
        })
        if (!business) break

        await prisma.business.update({
          where: { id: business.id },
          data: { subscription: 'FREE', autoRenew: false },
        })
        console.log(`[webhook] Business ${business.id} downgraded to FREE`)
        break
      }
    }
  } catch (err) {
    console.error('[webhook] handler error', err)
  }

  return NextResponse.json({ received: true })
}