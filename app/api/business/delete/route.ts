import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

function getEmailFromToken(request: Request): string | null {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) return null
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
    return payload.email || null
  } catch { return null }
}

export async function DELETE(request: Request) {
  try {
    const email = getEmailFromToken(request)
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const business = await prisma.business.findFirst({
      where: { owner: { email } }
    })
    if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

    const id = business.id

    // Delete in dependency order (children first, then parent)
    await prisma.profileView.deleteMany({ where: { businessId: id } })
    await prisma.businessCategory.deleteMany({ where: { businessId: id } })
    await prisma.notification.deleteMany({ where: { businessId: id } })
    await prisma.savedBusiness.deleteMany({ where: { businessId: id } })
    await prisma.message.deleteMany({ where: { businessId: id } })
    await prisma.carListing.deleteMany({ where: { businessId: id } })
    await prisma.review.deleteMany({ where: { businessId: id } })

    // Bookings reference employees and services — clear FKs first
    await prisma.booking.updateMany({ where: { businessId: id }, data: { employeeId: null, serviceId: null } })
    await prisma.booking.deleteMany({ where: { businessId: id } })

    // Employee schedules and media before employees
    const employees = await prisma.employee.findMany({ where: { businessId: id }, select: { id: true } })
    const employeeIds = employees.map(e => e.id)
    if (employeeIds.length > 0) {
      await prisma.employeeSchedule.deleteMany({ where: { employeeId: { in: employeeIds } } })
    }

    // Service media and business media
    await prisma.businessMedia.deleteMany({ where: { businessId: id } })

    // Services
    await prisma.service.deleteMany({ where: { businessId: id } })

    // Employees (after their schedules and media are gone)
    await prisma.employee.deleteMany({ where: { businessId: id } })

    // Business hours
    await prisma.businessHours.deleteMany({ where: { businessId: id } })

    // Finally delete the business itself
    await prisma.business.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete business error:', error)
    return NextResponse.json({ error: 'Failed to delete business' }, { status: 500 })
  }
}