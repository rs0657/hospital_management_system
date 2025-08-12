import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { SupabaseService } from '../../../lib/supabase-service'

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions)

  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  const { id } = req.query

  switch (req.method) {
    case 'GET':
      return getDoctor(req, res, id)
    case 'PUT':
      return updateDoctor(req, res, session, id)
    case 'DELETE':
      return deleteDoctor(req, res, session, id)
    default:
      return res.status(405).json({ message: 'Method not allowed' })
  }
}

async function getDoctor(req, res, id) {
  try {
    const doctorResult = await SupabaseService.getDoctorById(id)
    
    if (!doctorResult.success || !doctorResult.data) {
      return res.status(404).json({ message: 'Doctor not found' })
    }
    
    const doctor = doctorResult.data
    
    // Get appointments for this doctor
    const appointmentsResult = await SupabaseService.getAppointmentsByDoctor(id)
    
    doctor.appointments = appointmentsResult.success ? appointmentsResult.data || [] : []
    
    res.status(200).json(doctor)
  } catch (error) {
    console.error('Error fetching doctor:', error)
    res.status(500).json({ message: 'Error fetching doctor' })
  }
}

async function updateDoctor(req, res, session, id) {
  // Only admins can update doctors
  if (session.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' })
  }

  try {
    const { name, phone, specialty } = req.body
    
    const updateData = {}
    
    if (name) updateData.name = name
    if (phone) updateData.phone = phone
    if (specialty) updateData.specialty = specialty
    
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'No fields to update' })
    }
    
    const result = await SupabaseService.updateDoctor(id, updateData)
    
    if (!result.success) {
      return res.status(404).json({ message: 'Doctor not found' })
    }
    
    // Fetch and return updated doctor
    const updatedDoctor = await SupabaseService.getDoctorById(id)
    
    res.status(200).json(updatedDoctor)
  } catch (error) {
    console.error('Error updating doctor:', error)
    res.status(500).json({ message: 'Error updating doctor' })
  }
}

async function deleteDoctor(req, res, session, id) {
  // Only admins can delete doctors
  if (session.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' })
  }

  try {
    const result = await SupabaseService.deleteDoctor(id)
    
    if (!result.success) {
      return res.status(404).json({ message: 'Doctor not found' })
    }
    
    res.status(200).json({ message: 'Doctor deleted successfully' })
  } catch (error) {
    console.error('Error deleting doctor:', error)
    res.status(500).json({ message: 'Error deleting doctor' })
  }
}
