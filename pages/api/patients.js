import { SupabaseService } from '../../lib/supabase-service'
import { getAuthenticatedUser } from '../../lib/auth-middleware'

export default async function handler(req, res) {
  const user = await getAuthenticatedUser(req)

  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  switch (req.method) {
    case 'GET':
      return getPatients(req, res, user)
    case 'POST':
      return createPatient(req, res, user)
    case 'PUT':
      return updatePatient(req, res, user)
    case 'DELETE':
      return deletePatient(req, res, user)
    default:
      return res.status(405).json({ message: 'Method not allowed' })
  }
}

async function getPatients(req, res, user) {
  try {
    const result = await SupabaseService.getPatients()
    
    if (result.error) {
      console.error('Error fetching patients:', result.error)
      return res.status(500).json({ message: 'Error fetching patients' })
    }
    
    const patients = result.data || []
    const formattedPatients = patients.map(patient => ({
      id: patient.id,
      name: patient.name,
      email: patient.email,
      phone: patient.phone,
      address: patient.address,
      dateOfBirth: patient.date_of_birth,
      gender: patient.gender,
      bloodGroup: patient.blood_group,
      emergencyContact: patient.emergency_contact,
      medicalHistory: patient.medical_history,
      createdAt: patient.created_at,
      updatedAt: patient.updated_at
    }))

    return res.status(200).json({ patients: formattedPatients })
  } catch (error) {
    console.error('Error fetching patients:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

async function createPatient(req, res, user) {
  // Check permissions - only admin and receptionist can create patients
  if (!['admin', 'receptionist'].includes(user.role)) {
    return res.status(403).json({ message: 'Forbidden - insufficient permissions' })
  }

  try {
    const {
      name,
      email,
      phone,
      address,
      dateOfBirth,
      gender,
      bloodGroup,
      emergencyContact,
      medicalHistory
    } = req.body

    // Validate required fields
    if (!name || !phone || !address || !dateOfBirth || !gender || !emergencyContact) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        required: ['name', 'phone', 'address', 'dateOfBirth', 'gender', 'emergencyContact']
      })
    }

    const result = await SupabaseService.createPatient({
      name,
      email,
      phone,
      address,
      date_of_birth: dateOfBirth,
      gender,
      blood_group: bloodGroup,
      emergency_contact: emergencyContact,
      medical_history: medicalHistory
    })

    const formattedPatient = {
      id: result.id,
      name: result.name,
      email: result.email,
      phone: result.phone,
      address: result.address,
      dateOfBirth: result.date_of_birth,
      gender: result.gender,
      bloodGroup: result.blood_group,
      emergencyContact: result.emergency_contact,
      medicalHistory: result.medical_history,
      createdAt: result.created_at,
      updatedAt: result.updated_at
    }

    return res.status(201).json({ patient: formattedPatient })
  } catch (error) {
    console.error('Error creating patient:', error)
    return res.status(500).json({ 
      message: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

async function updatePatient(req, res, user) {
  // Check permissions
  if (!['admin', 'receptionist'].includes(user.role)) {
    return res.status(403).json({ message: 'Forbidden - insufficient permissions' })
  }

  try {
    const { id } = req.query
    const {
      name,
      email,
      phone,
      address,
      dateOfBirth,
      gender,
      bloodGroup,
      emergencyContact,
      medicalHistory
    } = req.body

    const result = await SupabaseService.updatePatient(parseInt(id), {
      name,
      email,
      phone,
      address,
      date_of_birth: dateOfBirth,
      gender,
      blood_group: bloodGroup,
      emergency_contact: emergencyContact,
      medical_history: medicalHistory
    })

    const formattedPatient = {
      id: result.id,
      name: result.name,
      email: result.email,
      phone: result.phone,
      address: result.address,
      dateOfBirth: result.date_of_birth,
      gender: result.gender,
      bloodGroup: result.blood_group,
      emergencyContact: result.emergency_contact,
      medicalHistory: result.medical_history,
      createdAt: result.created_at,
      updatedAt: result.updated_at
    }

    return res.status(200).json({ patient: formattedPatient })
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ message: 'Patient not found' })
    }
    console.error('Error updating patient:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

async function deletePatient(req, res, user) {
  // Only admin can delete patients
  if (user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden - admin access required' })
  }

  try {
    const { id } = req.query

    await SupabaseService.deletePatient(parseInt(id))

    return res.status(200).json({ message: 'Patient deleted successfully' })
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ message: 'Patient not found' })
    }
    if (error.message.includes('foreign key')) {
      return res.status(400).json({ 
        message: 'Cannot delete patient with existing appointments or records'
      })
    }
    console.error('Error deleting patient:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}