import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const PRICE_TO_PLAN: Record<string, string> = {
  [process.env.STRIPE_STANDARD_PRICE_ID!]: 'STANDARD',
  [process.env.STRIPE_PRO_PRICE_ID!]: 'PRO',
}

const HANDLED_EVENTS = new Set([
  'checkout.session.completed',
  'customer.subscription.updated',
  'customer.subscription.deleted',
])

export async function POST(req: NextRequest) {
  // 1. Read raw body (required for signature verification)
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  // 2. Reject if no signature header
  if (!sig) {
    console.error('[webhook] missing stripe-signature header')
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  // 3. Reject if webhook secret not configured
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('[webhook] STRIPE_WEBHOOK_SECRET not set')
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
  }

  // 4. Verify signature — rejects all forged requests
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('[webhook] signature verification failed', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // 5. Ignore events we don't handle
  if (!HANDLED_EVENTS.has(event.type)) {
    return NextResponse.json({ received: true, handled: false })
  }

  // 6. Handle events
  try {
    switch (event.type) {

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const businessId = session.metadata?.businessId
        const plan = session.metadata?.plan

        if (!businessId || !plan) {
          console.error('[webhook] missing metadata', session.id)
          break
        }
        if (!['STANDARD', 'PRO'].includes(plan)) {
          console.error('[webhook] unknown plan:', plan)
          break
        }

        const business = await prisma.business.findUnique({ where: { id: businessId } })
        if (!business) {
          console.error('[webhook] business not found:', businessId)
          break
        }

        await prisma.business.update({
          where: { id: businessId },
          data: {
            subscription: plan as any,
            subscriptionStart: new Date(),
            subscriptionEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            billingCycle: 'monthly',
            autoRenew: true,
            stripeCustomerId: (session.customer as string) ?? business.stripeCustomerId,
          },
        })
        console.log(`[webhook] ✓ Business ${businessId} upgraded to ${plan}`)
        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        const priceId = sub.items.data[0]?.price.id
        const plan = PRICE_TO_PLAN[priceId] || 'FREE'

        const business = await prisma.business.findFirst({
          where: { stripeCustomerId: sub.customer as string }
        })
        if (!business) {
          console.error('[webhook] no business for customer:', sub.customer)
          break
        }

        await prisma.business.update({
          where: { id: business.id },
          data: {
            subscription: plan as any,
            subscriptionEnd: new Date((sub as any).current_period_end * 1000),
            autoRenew: !sub.cancel_at_period_end,
          },
        })
        console.log(`[webhook] ✓ Business ${business.id} updated to ${plan}`)
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const business = await prisma.business.findFirst({
          where: { stripeCustomerId: sub.customer as string }
        })
        if (!business) {
          console.error('[webhook] no business for customer:', sub.customer)
          break
        }

        await prisma.business.update({
          where: { id: business.id },
          data: {
            subscription: 'FREE',
            autoRenew: false,
            subscriptionEnd: new Date(),
          },
        })
        console.log(`[webhook] ✓ Business ${business.id} downgraded to FREE`)
        break
      }
    }
  } catch (err) {
    console.error('[webhook] handler error', err)
    // Return 500 so Stripe automatically retries
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}