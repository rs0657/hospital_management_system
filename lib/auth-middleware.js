import { supabaseAdmin } from './supabase'
import { SupabaseService } from './supabase-service'

export async function getAuthenticatedUser(req) {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Verify the JWT token with Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
    
    if (error || !user) {
      return null
    }

    // Get user role from custom users table
    const userResult = await SupabaseService.getUserByEmail(user.email)
    if (userResult.error || !userResult.data) {
      return null
    }

    return {
      id: user.id,
      email: user.email,
      role: userResult.data.role,
      name: userResult.data.name
    }
  } catch (error) {
    console.error('Auth middleware error:', error)
    return null
  }
}

export function requireAuth(roles = []) {
  return async (req, res, next) => {
    const user = await getAuthenticatedUser(req)
    
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    if (roles.length > 0 && !roles.includes(user.role)) {
      return res.status(403).json({ message: 'Forbidden' })
    }

    req.user = user
    if (next) next()
    return user
  }
}
