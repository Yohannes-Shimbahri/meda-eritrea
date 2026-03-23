export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

async function getDbUser(token: string) {
  const supabase = createServerClient(token)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  return prisma.user.findUnique({ where: { email: user.email! } })
}

// GET — fetch notifications for logged in user
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const dbUser = await getDbUser(token)
    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const notifications = await prisma.notification.findMany({
      where: { userId: dbUser.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    const unreadCount = notifications.filter(n => !n.isRead).length

    return NextResponse.json({ notifications, unreadCount })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
}

// PATCH — mark notifications as read
export async function PATCH(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const dbUser = await getDbUser(token)
    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const { notificationId } = await req.json()

    if (notificationId) {
      // Mark single notification as read
      await prisma.notification.updateMany({
        where: { id: notificationId, userId: dbUser.id },
        data: { isRead: true },
      })
    } else {
      // Mark all as read
      await prisma.notification.updateMany({
        where: { userId: dbUser.id, isRead: false },
        data: { isRead: true },
      })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 })
  }
}