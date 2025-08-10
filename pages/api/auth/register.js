import { getServerSession } from 'next-auth/next'
import { authOptions } from './[...nextauth]'
import bcrypt from 'bcryptjs'
import { query } from '../../../lib/database'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const session = await getServerSession(req, res, authOptions)

  // Only admins can register new users
  if (!session || session.user.role !== 'admin') {
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

    // Check if user already exists
    const existingUsers = await query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    )

    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'User already exists' })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const users = await query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role, created_at',
      [name, email, hashedPassword, role]
    )

    const user = users[0]

    res.status(201).json({ message: 'User created successfully', user })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ message: 'Error creating user' })
  }
}
