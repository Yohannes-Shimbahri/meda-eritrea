import { supabase } from './supabase'

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
  return data
}

export async function signUpBusiness({
  email, password, fullName, businessName, category, city, size, hasBooking, acceptsWalkIns
}: {
  email: string; password: string; fullName: string
  businessName: string; category: string; city: string
  size: string; hasBooking: boolean; acceptsWalkIns: boolean
}) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role: 'BUSINESS_OWNER',
        business_name: businessName,
        category,
        city,
        size,
        has_booking: hasBooking,
        accepts_walk_ins: acceptsWalkIns,
      }
    }
  })
  if (error) throw error
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