import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from './server'

/**
 * Create Supabase admin client with service role key
 * WARNING: Only use in API routes, never expose to client
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      'Missing Supabase environment variables. ' +
      'Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.'
    )
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

/**
 * Base function to verify user authentication and role
 * @param allowedRoles - Array of roles that are allowed access
 * @returns User ID and role if authorized
 * @throws Error if not authenticated or not authorized
 */
async function requireRole(allowedRoles: string[]): Promise<{ userId: string; role: string }> {
  const supabase = await createServerClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('Unauthorized: Not logged in')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    throw new Error('Unauthorized: Profile not found')
  }

  if (!allowedRoles.includes(profile.role)) {
    const rolesText = allowedRoles.join(' or ')
    throw new Error(`Forbidden: ${rolesText} access required`)
  }

  return { userId: user.id, role: profile.role }
}

/**
 * Check if the current user is an admin
 * Returns the user ID if admin, throws error otherwise
 */
export async function requireAdmin(): Promise<string> {
  const { userId } = await requireRole(['admin'])
  return userId
}

/**
 * Check if the current user is an admin or parent
 * Returns the user ID and role if authorized, throws error otherwise
 */
export async function requireAdminOrParent(): Promise<{ userId: string; role: string }> {
  return requireRole(['admin', 'parent'])
}
