import { getAuthenticatedUser } from '../../../lib/auth-middleware'
import { supabaseAdmin } from '../../../lib/supabase'
import { SupabaseService } from '../../../lib/supabase-service'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const user = await getAuthenticatedUser(req)

  // Only admins can register new users
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' })
  }

  try {
    const { name, email, password, role } = req.body

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'All fields are required' })
    }

    if (!['admin', 'doctor', 'receptionist'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' })
    }

    // Check if user already exists in Supabase Auth
    const { data: existingUser } = await supabaseAdmin.auth.admin.getUserByEmail(email)

    if (existingUser.user) {
      return res.status(400).json({ message: 'User already exists' })
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true // Skip email confirmation for admin-created users
    })

    if (authError) {
      console.error('Supabase Auth error:', authError)
      return res.status(400).json({ message: authError.message })
    }

    // Create user record in custom users table
    const userResult = await SupabaseService.createUser({
      id: authData.user.id,
      name,
      email,
      role
    })

    if (userResult.error) {
      // Rollback: delete the auth user if custom user creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return res.status(500).json({ message: 'Error creating user record' })
    }

    res.status(201).json({
      message: 'User created successfully',
      user: userResult.data
    })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ message: 'Error creating user' })
  }
}
