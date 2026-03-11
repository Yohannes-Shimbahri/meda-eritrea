import { supabase } from './supabase'
import { createClient } from '@supabase/supabase-js'

export async function signUpClient({
  email, password, fullName
}: { email: string; password: string; fullName: string }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, role: 'CLIENT' }
    }
  })
  if (error) throw error
  await fetch('/api/client/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, fullName })
  })
  return data
}

export async function signUpBusiness({
  email, password, fullName, businessName, categoryId, categorySelections, city, size, hasBooking, acceptsWalkIns
}: {
  email: string
  password: string
  fullName: string
  businessName: string
  categoryId: string
  categorySelections: { categoryId: string; subcategoryId: string }[]
  city: string
  size: string
  hasBooking: boolean
  acceptsWalkIns: boolean
}) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role: 'BUSINESS_OWNER',
        business_name: businessName,
        category_id: categoryId,
        city,
        size,
        has_booking: hasBooking,
        accepts_walk_ins: acceptsWalkIns,
      }
    }
  })
  if (error) throw error

  await fetch('/api/business/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      ownerName: fullName,
      businessName,
      categoryId,
      // ✅ Pass all category selections to be saved in BusinessCategory table
      categorySelections: categorySelections.filter(s => s.categoryId),
      city,
      size,
      hasBooking,
      acceptsWalkIns,
    })
  })
  return data
}

export async function signIn({ email, password }: { email: string; password: string }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/auth/callback` }
  })
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getAdminUser(token: string) {
  const supabaseServer = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data, error } = await supabaseServer.auth.getUser(token)
  if (error || !data?.user) return null
  if (data.user.user_metadata?.role !== 'ADMIN') return null
  return data.user
}