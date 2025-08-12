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
      return getPatient(req, res, id)
    case 'PUT':
      return updatePatient(req, res, session, id)
    case 'DELETE':
      return deletePatient(req, res, session, id)
    default:
      return res.status(405).json({ message: 'Method not allowed' })
  }
}

async function getPatient(req, res, id) {
  try {
    const result = await SupabaseService.getPatientById(id)

    if (!result.success || !result.data) {
      return res.status(404).json({ message: 'Patient not found' })
    }

    res.status(200).json(result.data)
  } catch (error) {
    console.error('Error fetching patient:', error)
    res.status(500).json({ message: 'Error fetching patient' })
  }
}
async function updatePatient(req, res, session, id) {
  // Only admins and receptionists can update patients
  if (!['admin', 'receptionist'].includes(session.user.role)) {
    return res.status(403).json({ message: 'Forbidden' })
  }

  try {
    const { name, email, phone, address, date_of_birth, gender, blood_group, emergency_contact, medical_history } = req.body
    
    const updateData = {}
    
    if (name) updateData.name = name
    if (email !== undefined) updateData.email = email
    if (phone) updateData.phone = phone
    if (address) updateData.address = address
    if (date_of_birth) updateData.date_of_birth = date_of_birth
    if (gender) updateData.gender = gender
    if (blood_group !== undefined) updateData.blood_group = blood_group
    if (emergency_contact) updateData.emergency_contact = emergency_contact
    if (medical_history !== undefined) updateData.medical_history = medical_history
    
    const result = await SupabaseService.updatePatient(id, updateData)
    
    if (!result.success) {
      return res.status(404).json({ message: 'Patient not found' })
    }
    
    const updatedPatient = await SupabaseService.getPatientById(id)
    
    res.status(200).json(updatedPatient)
  } catch (error) {
    console.error('Error updating patient:', error)
    res.status(500).json({ message: 'Error updating patient' })
  }
}

async function deletePatient(req, res, session, id) {
  // Only admins can delete patients
  if (session.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' })
  }

  try {
    const result = await SupabaseService.deletePatient(id)
    
    if (!result.success) {
      return res.status(404).json({ message: 'Patient not found' })
    }
    
    res.status(200).json({ message: 'Patient deleted successfully' })
  } catch (error) {
    console.error('Error deleting patient:', error)
    res.status(500).json({ message: 'Error deleting patient' })
  }
}


