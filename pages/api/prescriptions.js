import { getServerSession } from 'next-auth/next'
import { authOptions } from './auth/[...nextauth]'
import { query } from '../../lib/database'

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions)

  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  switch (req.method) {
    case 'GET':
      return getPrescriptions(req, res, session)
    case 'POST':
      return createPrescription(req, res, session)
    case 'PUT':
      return updatePrescription(req, res, session)
    case 'DELETE':
      return deletePrescription(req, res, session)
    default:
      return res.status(405).json({ message: 'Method not allowed' })
  }
}

async function getPrescriptions(req, res, session) {
  try {
    let sqlQuery = `
      SELECT p.*, 
             pt.name as patient_name, pt.email as patient_email, pt.phone as patient_phone,
             d.name as doctor_name, d.specialty as doctor_specialty, d.phone as doctor_phone
      FROM prescriptions p
      LEFT JOIN patients pt ON p.patient_id = pt.id
      LEFT JOIN doctors d ON p.doctor_id = d.id
    `
    let params = []
    
    // Doctors can only see their own prescriptions
    if (session.user.role === 'doctor') {
      const doctors = await query('SELECT id FROM doctors WHERE name = $1', [session.user.name])
      if (doctors.length > 0) {
        sqlQuery += ' WHERE p.doctor_id = $1'
        params = [doctors[0].id]
      }
    }

    sqlQuery += ' ORDER BY p.created_at DESC'

    const prescriptions = await query(sqlQuery, params)
    
    // Transform the data to match frontend expectations
    const transformedPrescriptions = prescriptions.map(presc => ({
      id: presc.id,
      diagnosis: presc.diagnosis,
      medications: presc.medications,
      frequency: presc.frequency,
      notes: presc.notes,
      created_at: presc.created_at,
      updated_at: presc.updated_at,
      patient: {
        id: presc.patient_id,
        name: presc.patient_name,
        email: presc.patient_email,
        phone: presc.patient_phone
      },
      doctor: {
        id: presc.doctor_id,
        name: presc.doctor_name,
        specialty: presc.doctor_specialty,
        phone: presc.doctor_phone
      }
    }))
    
    res.status(200).json({ prescriptions: transformedPrescriptions })
  } catch (error) {
    console.error('Error fetching prescriptions:', error)
    res.status(500).json({ message: 'Error fetching prescriptions' })
  }
}

async function createPrescription(req, res, session) {
  // Only doctors and admins can create prescriptions
  if (!['admin', 'doctor'].includes(session.user.role)) {
    return res.status(403).json({ message: 'Forbidden' })
  }

  try {
    const { patientId, doctorId, diagnosis, medications, frequency, notes } = req.body
    
    let finalDoctorId = doctorId
    
    // If no doctorId provided and user is a doctor, use their ID
    if (!finalDoctorId && session.user.role === 'doctor') {
      const doctors = await query('SELECT id FROM doctors WHERE name = $1', [session.user.name])
      
      if (doctors.length > 0) {
        finalDoctorId = doctors[0].id
      } else {
        return res.status(400).json({ 
          message: 'Doctor profile not found. Please contact administrator.',
          debug: {
            userName: session.user.name,
            userEmail: session.user.email
          }
        })
      }
    }
    
    // If doctor, verify they are creating their own prescription
    if (session.user.role === 'doctor') {
      const doctors = await query('SELECT id FROM doctors WHERE name = $1', [session.user.name])
      
      if (doctors.length > 0 && doctors[0].id !== parseInt(finalDoctorId)) {
        return res.status(403).json({ message: 'Forbidden: Can only create your own prescriptions' })
      }
    }
    
    const prescriptions = await query(
      'INSERT INTO prescriptions (patient_id, doctor_id, diagnosis, medications, frequency, notes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [parseInt(patientId), parseInt(finalDoctorId), diagnosis, JSON.stringify(medications), frequency || 'As prescribed', notes || '']
    )
    
    // Get complete prescription data
    const fullPrescription = await query(`
      SELECT p.*, 
             pt.name as patient_name, pt.email as patient_email, pt.phone as patient_phone,
             d.name as doctor_name, d.specialty as doctor_specialty, d.phone as doctor_phone
      FROM prescriptions p
      LEFT JOIN patients pt ON p.patient_id = pt.id
      LEFT JOIN doctors d ON p.doctor_id = d.id
      WHERE p.id = $1
    `, [prescriptions[0].id])
    
    const transformedPrescription = {
      ...prescriptions[0],
      patient: {
        id: prescriptions[0].patient_id,
        name: fullPrescription[0].patient_name,
        email: fullPrescription[0].patient_email,
        phone: fullPrescription[0].patient_phone
      },
      doctor: {
        id: prescriptions[0].doctor_id,
        name: fullPrescription[0].doctor_name,
        specialty: fullPrescription[0].doctor_specialty,
        phone: fullPrescription[0].doctor_phone
      }
    }
    
    res.status(201).json(transformedPrescription)
  } catch (error) {
    console.error('Error creating prescription:', error)
    console.error('Request body:', req.body)
    console.error('Session user:', session.user)
    res.status(500).json({ 
      message: 'Error creating prescription',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}

async function updatePrescription(req, res, session) {
  // Only doctors and admins can update prescriptions
  if (!['admin', 'doctor'].includes(session.user.role)) {
    return res.status(403).json({ message: 'Forbidden' })
  }

  try {
    const { id } = req.query
    const { diagnosis, medications, frequency, notes } = req.body
    
    // If doctor, verify they own the prescription
    if (session.user.role === 'doctor') {
      const doctors = await query('SELECT id FROM doctors WHERE name = $1', [session.user.name])
      
      if (doctors.length > 0) {
        const prescriptions = await query(
          'SELECT id FROM prescriptions WHERE id = $1 AND doctor_id = $2',
          [parseInt(id), doctors[0].id]
        )
        
        if (prescriptions.length === 0) {
          return res.status(403).json({ message: 'Forbidden' })
        }
      }
    }
    
    let updateQuery = 'UPDATE prescriptions SET updated_at = NOW()'
    let params = []
    let paramIndex = 1
    
    if (diagnosis) {
      updateQuery += `, diagnosis = $${paramIndex}`
      params.push(diagnosis)
      paramIndex++
    }
    
    if (medications) {
      updateQuery += `, medications = $${paramIndex}`
      params.push(JSON.stringify(medications))
      paramIndex++
    }
    
    if (frequency) {
      updateQuery += `, frequency = $${paramIndex}`
      params.push(frequency)
      paramIndex++
    }
    
    if (notes !== undefined) {
      updateQuery += `, notes = $${paramIndex}`
      params.push(notes)
      paramIndex++
    }
    
    updateQuery += ` WHERE id = $${paramIndex} RETURNING *`
    params.push(parseInt(id))
    
    const prescriptions = await query(updateQuery, params)
    
    if (prescriptions.length === 0) {
      return res.status(404).json({ message: 'Prescription not found' })
    }
    
    // Get complete prescription data
    const fullPrescription = await query(`
      SELECT p.*, 
             pt.name as patient_name, pt.email as patient_email, pt.phone as patient_phone,
             d.name as doctor_name, d.specialty as doctor_specialty, d.phone as doctor_phone
      FROM prescriptions p
      LEFT JOIN patients pt ON p.patient_id = pt.id
      LEFT JOIN doctors d ON p.doctor_id = d.id
      WHERE p.id = $1
    `, [prescriptions[0].id])
    
    const transformedPrescription = {
      ...prescriptions[0],
      patient: {
        id: prescriptions[0].patient_id,
        name: fullPrescription[0].patient_name,
        email: fullPrescription[0].patient_email,
        phone: fullPrescription[0].patient_phone
      },
      doctor: {
        id: prescriptions[0].doctor_id,
        name: fullPrescription[0].doctor_name,
        specialty: fullPrescription[0].doctor_specialty,
        phone: fullPrescription[0].doctor_phone
      }
    }
    
    res.status(200).json(transformedPrescription)
  } catch (error) {
    console.error('Error updating prescription:', error)
    res.status(500).json({ message: 'Error updating prescription' })
  }
}

async function deletePrescription(req, res, session) {
  // Only admins can delete prescriptions
  if (session.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' })
  }

  try {
    const { id } = req.query
    
    const result = await query(
      'DELETE FROM prescriptions WHERE id = $1 RETURNING id',
      [parseInt(id)]
    )
    
    if (result.length === 0) {
      return res.status(404).json({ message: 'Prescription not found' })
    }
    
    res.status(200).json({ message: 'Prescription deleted successfully' })
  } catch (error) {
    console.error('Error deleting prescription:', error)
    res.status(500).json({ message: 'Error deleting prescription' })
  }
}
