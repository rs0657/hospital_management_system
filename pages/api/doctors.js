import { getServerSession } from 'next-auth/next'
import { authOptions } from './auth/[...nextauth]'
import { SupabaseService } from '../../lib/supabase-service'

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions)

  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  switch (req.method) {
    case 'GET':
      return getDoctors(req, res, session)
    case 'POST':
      return createDoctor(req, res, session)
    case 'PUT':
      return updateDoctor(req, res, session)
    case 'DELETE':
      return deleteDoctor(req, res, session)
    default:
      return res.status(405).json({ message: 'Method not allowed' })
  }
}

async function getDoctors(req, res, session) {
  try {
    const result = await SupabaseService.getDoctorsWithAppointments()
    
    if (result.error) {
      console.error('Error fetching doctors:', result.error)
      return res.status(500).json({ message: 'Error fetching doctors' })
    }
    
    const doctors = result.data || []
    res.status(200).json({ doctors })
  } catch (error) {
    console.error('Error fetching doctors:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

async function createDoctor(req, res, session) {
  // Only admins can create doctors
  if (session.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' })
  }

  try {
    const { name, specialty, phone, email } = req.body
    
    const doctor = await SupabaseService.createDoctor({
      name,
      specialty,
      phone,
      email
    })
    
    res.status(201).json(doctor)
  } catch (error) {
    console.error('Error creating doctor:', error)
    res.status(500).json({ message: 'Error creating doctor' })
  }
}

async function updateDoctor(req, res, session) {
  // Only admins can update doctors
  if (session.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' })
  }

  try {
    const { id } = req.query
    const { name, specialty, phone, email } = req.body
    
    const doctor = await SupabaseService.updateDoctor(parseInt(id), {
      name,
      specialty,
      phone,
      email
    })
    
    res.status(200).json(doctor)
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ message: 'Doctor not found' })
    }
    console.error('Error updating doctor:', error)
    res.status(500).json({ message: 'Error updating doctor' })
  }
}

async function deleteDoctor(req, res, session) {
  // Only admins can delete doctors
  if (session.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' })
  }

  try {
    const { id } = req.query
    
    await SupabaseService.deleteDoctor(parseInt(id))
    
    res.status(200).json({ message: 'Doctor deleted successfully' })
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ message: 'Doctor not found' })
    }
    console.error('Error deleting doctor:', error)
    res.status(500).json({ message: 'Error deleting doctor' })
  }
}
