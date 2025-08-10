import { query } from '../../lib/database'
import { getServerSession } from 'next-auth/next'
import { authOptions } from './auth/[...nextauth]'

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions)

  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  switch (req.method) {
    case 'GET':
      return getPatients(req, res, session)
    case 'POST':
      return createPatient(req, res, session)
    case 'PUT':
      return updatePatient(req, res, session)
    case 'DELETE':
      return deletePatient(req, res, session)
    default:
      return res.status(405).json({ message: 'Method not allowed' })
  }
}

async function getPatients(req, res, session) {
  try {
    const result = await query('SELECT * FROM patients ORDER BY created_at DESC')
    const patients = result.rows.map(patient => ({
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

    return res.status(200).json({ patients })
  } catch (error) {
    console.error('Error fetching patients:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

async function createPatient(req, res, session) {
  // Check permissions - only admin and receptionist can create patients
  if (!['admin', 'receptionist'].includes(session.user.role)) {
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

    const result = await query(`
      INSERT INTO patients (name, email, phone, address, date_of_birth, gender, blood_group, emergency_contact, medical_history)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [name, email, phone, address, dateOfBirth, gender, bloodGroup, emergencyContact, medicalHistory])

    const patient = result.rows[0]
    const formattedPatient = {
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

async function updatePatient(req, res, session) {
  // Check permissions
  if (!['admin', 'receptionist'].includes(session.user.role)) {
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

    const result = await query(`
      UPDATE patients 
      SET name = $1, email = $2, phone = $3, address = $4, date_of_birth = $5, 
          gender = $6, blood_group = $7, emergency_contact = $8, medical_history = $9, 
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $10
      RETURNING *
    `, [name, email, phone, address, dateOfBirth, gender, bloodGroup, emergencyContact, medicalHistory, id])

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Patient not found' })
    }

    const patient = result.rows[0]
    const formattedPatient = {
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
    }

    return res.status(200).json({ patient: formattedPatient })
  } catch (error) {
    console.error('Error updating patient:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

async function deletePatient(req, res, session) {
  // Only admin can delete patients
  if (session.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden - admin access required' })
  }

  try {
    const { id } = req.query

    // Check if patient has related records
    const appointmentsResult = await query('SELECT COUNT(*) FROM appointments WHERE patient_id = $1', [id])
    const appointmentCount = parseInt(appointmentsResult.rows[0].count)

    if (appointmentCount > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete patient with existing appointments',
        appointmentCount 
      })
    }

    const result = await query('DELETE FROM patients WHERE id = $1 RETURNING *', [id])

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Patient not found' })
    }

    return res.status(200).json({ message: 'Patient deleted successfully' })
  } catch (error) {
    console.error('Error deleting patient:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}
