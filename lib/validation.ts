import { z } from 'zod'

// ── Auth ─────────────────────────────────────────────────────
export const ClientSignupSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(2, 'Name too short').max(100, 'Name too long'),
})

export const BusinessSignupSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(2).max(100),
  businessName: z.string().min(2, 'Business name too short').max(100),
  categoryId: z.string().uuid('Invalid category'),
  city: z.string().min(2).max(100),
  hasBooking: z.boolean(),
  acceptsWalkIns: z.boolean(),
})

// ── Booking ───────────────────────────────────────────────────
export const CreateBookingSchema = z.object({
  businessId: z.string().uuid(),
  serviceId: z.string().uuid(),
  employeeId: z.string().uuid().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)').optional(),
  notes: z.string().max(500, 'Notes too long').optional(),
})

// ── Review ────────────────────────────────────────────────────
export const CreateReviewSchema = z.object({
  businessId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000, 'Review too long').optional(),
})

// ── Business profile update ───────────────────────────────────
export const UpdateBusinessSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(2000).optional(),
  phone: z.string().max(20).optional(),
  city: z.string().max(100).optional(),
  province: z.string().max(100).optional(),
  address: z.string().max(200).optional(),
  website: z.string().url().optional().or(z.literal('')),
  instagram: z.string().max(100).optional(),
})

// ── Admin business patch ──────────────────────────────────────
// Only allow specific fields — prevents role escalation attacks
export const AdminBusinessPatchSchema = z.object({
  businessId: z.string().uuid(),
  isVerified: z.boolean().optional(),
  isApproved: z.boolean().optional(),
  isActive: z.boolean().optional(),
  subscription: z.enum(['FREE', 'STANDARD', 'PRO']).optional(),
  // ❌ DO NOT allow: ownerId, categoryId, slug — those can't be patched by admin panel
})

// ── Helper: parse and return 400 on failure ───────────────────
export function validateBody<T>(schema: z.ZodSchema<T>, body: unknown):
  | { success: true; data: T }
  | { success: false; error: string } {
  const result = schema.safeParse(body)
  if (!result.success) {
    const message = result.error.issues.map((i) => i.message).join(', ')
    return { success: false, error: message }
  }
  return { success: true, data: result.data }
}