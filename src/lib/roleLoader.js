import { supabase } from './supabase'

export async function resolveRole(token, type) {
  if (type === 'vendor') {
    const { data } = await supabase
      .from('vendors')
      .select('*, categories(name,color)')
      .eq('access_token', token)
      .single()
    if (!data) return null
    return { ...data, roleType: 'vendor' }
  }
  if (type === 'team') {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('access_token', token)
      .single()
    if (!data) return null
    return { ...data, roleType: 'team' }
  }
  return null
}

export function generateVendorLink(vendorToken) {
  return `${import.meta.env.VITE_APP_URL}/v/${vendorToken}`
}

export function generateTeamLink(userToken) {
  return `${import.meta.env.VITE_APP_URL}/team/${userToken}`
}