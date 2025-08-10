import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { query } from '../../../lib/database'

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
    const patients = await query(
      'SELECT * FROM patients WHERE id = $1',
      [parseInt(id)]
    )

    if (patients.length === 0) {
      return res.status(404).json({ message: 'Patient not found' })
    }

    res.status(200).json(patients[0])
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
    
    let updateQuery = 'UPDATE patients SET updated_at = NOW()'
    let params = []
    let paramIndex = 1
    
    if (name) {
      updateQuery += `, name = $${paramIndex}`
      params.push(name)
      paramIndex++
    }
    
    if (email !== undefined) {
      updateQuery += `, email = $${paramIndex}`
      params.push(email)
      paramIndex++
    }
    
    if (phone) {
      updateQuery += `, phone = $${paramIndex}`
      params.push(phone)
      paramIndex++
    }
    
    if (address) {
      updateQuery += `, address = $${paramIndex}`
      params.push(address)
      paramIndex++
    }
    
    if (date_of_birth) {
      updateQuery += `, date_of_birth = $${paramIndex}`
      params.push(date_of_birth)
      paramIndex++
    }
    
    if (gender) {
      updateQuery += `, gender = $${paramIndex}`
      params.push(gender)
      paramIndex++
    }
    
    if (blood_group !== undefined) {
      updateQuery += `, blood_group = $${paramIndex}`
      params.push(blood_group)
      paramIndex++
    }
    
    if (emergency_contact) {
      updateQuery += `, emergency_contact = $${paramIndex}`
      params.push(emergency_contact)
      paramIndex++
    }
    
    if (medical_history !== undefined) {
      updateQuery += `, medical_history = $${paramIndex}`
      params.push(medical_history)
      paramIndex++
    }
    
    updateQuery += ` WHERE id = $${paramIndex} RETURNING *`
    params.push(parseInt(id))
    
    const patients = await query(updateQuery, params)
    
    if (patients.length === 0) {
      return res.status(404).json({ message: 'Patient not found' })
    }
    
    res.status(200).json(patients[0])
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
    const result = await query(
      'DELETE FROM patients WHERE id = $1 RETURNING id',
      [parseInt(id)]
    )
    
    if (result.length === 0) {
      return res.status(404).json({ message: 'Patient not found' })
    }
    
    res.status(200).json({ message: 'Patient deleted successfully' })
  } catch (error) {
    console.error('Error deleting patient:', error)
    res.status(500).json({ message: 'Error deleting patient' })
  }
}


