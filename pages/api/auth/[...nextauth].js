import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { SupabaseService } from '../../../lib/supabase-service'

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          const userResult = await SupabaseService.getUserByEmail(credentials.email)

          if (userResult.error || !userResult.data) {
            console.log('User not found:', credentials.email)
            return null
          }

          const user = userResult.data

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          )

          if (!isPasswordValid) {
            console.log('Invalid password for:', credentials.email)
            return null
          }

          // Get the actual name based on role
          let displayName = user.email // default fallback
          
          if (user.role === 'doctor') {
            // For doctors, get the name from the doctors table
            const doctorResult = await SupabaseService.getDoctorByEmail(user.email)
            if (doctorResult.data) {
              displayName = doctorResult.data.name
            }
          } else if (user.role === 'admin') {
            displayName = 'System Administrator'
          } else if (user.role === 'receptionist') {
            displayName = 'Hospital Receptionist'
          }

          return {
            id: user.id.toString(),
            email: user.email,
            name: displayName,
            role: user.role,
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub
        session.user.role = token.role
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/login',
  },
}

export default NextAuth(authOptions)
