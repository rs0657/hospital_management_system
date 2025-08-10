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
      return getAppointments(req, res, session)
    case 'POST':
      return createAppointment(req, res, session)
    case 'PUT':
      return updateAppointment(req, res, session)
    case 'DELETE':
      return deleteAppointment(req, res, session)
    default:
      return res.status(405).json({ message: 'Method not allowed' })
  }
}

async function getAppointments(req, res, session) {
  try {
    let sqlQuery = `
      SELECT a.*, 
             p.name as patient_name, p.email as patient_email, p.phone as patient_phone,
             p.date_of_birth as patient_dob, p.address as patient_address,
             d.name as doctor_name, d.specialty as doctor_specialty, d.phone as doctor_phone
      FROM appointments a
      LEFT JOIN patients p ON a.patient_id = p.id
      LEFT JOIN doctors d ON a.doctor_id = d.id
    `
    let params = []
    
    // Doctors can only see their own appointments
    if (session.user.role === 'doctor') {
      // Find doctor by user name
      const doctors = await query('SELECT id FROM doctors WHERE name = $1', [session.user.name])
      if (doctors.length > 0) {
        sqlQuery += ' WHERE a.doctor_id = $1'
        params = [doctors[0].id]
      }
    }

    sqlQuery += ' ORDER BY a.date ASC, a.time ASC'

    const appointments = await query(sqlQuery, params)
    
    // Transform the data to match frontend expectations
    const transformedAppointments = appointments.map(apt => ({
      id: apt.id,
      date: apt.date,
      time: apt.time,
      status: apt.status,
      reason: apt.reason,
      notes: apt.notes,
      created_at: apt.created_at,
      updated_at: apt.updated_at,
      patient: {
        id: apt.patient_id,
        name: apt.patient_name,
        email: apt.patient_email,
        phone: apt.patient_phone,
        date_of_birth: apt.patient_dob,
        address: apt.patient_address
      },
      doctor: {
        id: apt.doctor_id,
        name: apt.doctor_name,
        specialty: apt.doctor_specialty,
        phone: apt.doctor_phone
      }
    }))
    
    res.status(200).json({ appointments: transformedAppointments })
  } catch (error) {
    console.error('Error fetching appointments:', error)
    res.status(500).json({ message: 'Error fetching appointments' })
  }
}

async function createAppointment(req, res, session) {
  // Only admins and receptionists can create appointments
  if (!['admin', 'receptionist'].includes(session.user.role)) {
    return res.status(403).json({ message: 'Forbidden' })
  }

  try {
    const { patientId, doctorId, date, time, reason, notes } = req.body
    
    const appointments = await query(
      'INSERT INTO appointments (patient_id, doctor_id, date, time, status, reason, notes) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [parseInt(patientId), parseInt(doctorId), date, time, 'scheduled', reason || '', notes || '']
    )
    
    // Get complete appointment data with patient and doctor info
    const fullAppointment = await query(`
      SELECT a.*, 
             p.name as patient_name, p.email as patient_email, p.phone as patient_phone,
             d.name as doctor_name, d.specialty as doctor_specialty, d.phone as doctor_phone
      FROM appointments a
      LEFT JOIN patients p ON a.patient_id = p.id
      LEFT JOIN doctors d ON a.doctor_id = d.id
      WHERE a.id = $1
    `, [appointments[0].id])
    
    const transformedAppointment = {
      ...appointments[0],
      patient: {
        id: appointments[0].patient_id,
        name: fullAppointment[0].patient_name,
        email: fullAppointment[0].patient_email,
        phone: fullAppointment[0].patient_phone
      },
      doctor: {
        id: appointments[0].doctor_id,
        name: fullAppointment[0].doctor_name,
        specialty: fullAppointment[0].doctor_specialty,
        phone: fullAppointment[0].doctor_phone
      }
    }
    
    res.status(201).json(transformedAppointment)
  } catch (error) {
    console.error('Error creating appointment:', error)
    res.status(500).json({ message: 'Error creating appointment' })
  }
}

async function updateAppointment(req, res, session) {
  try {
    const { id, status, date, time } = req.body
    
    // Doctors can update status, admins can update everything
    if (session.user.role === 'doctor') {
      // Verify the appointment belongs to this doctor
      const doctors = await query('SELECT id FROM doctors WHERE name = $1', [session.user.name])
      
      if (doctors.length > 0) {
        const appointments = await query(
          'SELECT id FROM appointments WHERE id = $1 AND doctor_id = $2',
          [parseInt(id), doctors[0].id]
        )
        
        if (appointments.length === 0) {
          return res.status(403).json({ message: 'Forbidden' })
        }
      }
    } else if (!['admin', 'receptionist'].includes(session.user.role)) {
      return res.status(403).json({ message: 'Forbidden' })
    }
    
    let updateQuery = 'UPDATE appointments SET updated_at = NOW()'
    let params = []
    let paramIndex = 1
    
    if (status) {
      updateQuery += `, status = $${paramIndex}`
      params.push(status)
      paramIndex++
    }
    
    if (date && ['admin', 'receptionist'].includes(session.user.role)) {
      updateQuery += `, date = $${paramIndex}`
      params.push(date)
      paramIndex++
    }
    
    if (time && ['admin', 'receptionist'].includes(session.user.role)) {
      updateQuery += `, time = $${paramIndex}`
      params.push(time)
      paramIndex++
    }
    
    updateQuery += ` WHERE id = $${paramIndex} RETURNING *`
    params.push(parseInt(id))
    
    const appointments = await query(updateQuery, params)
    
    if (appointments.length === 0) {
      return res.status(404).json({ message: 'Appointment not found' })
    }
    
    // Get complete appointment data
    const fullAppointment = await query(`
      SELECT a.*, 
             p.name as patient_name, p.email as patient_email, p.phone as patient_phone,
             d.name as doctor_name, d.specialty as doctor_specialty, d.phone as doctor_phone
      FROM appointments a
      LEFT JOIN patients p ON a.patient_id = p.id
      LEFT JOIN doctors d ON a.doctor_id = d.id
      WHERE a.id = $1
    `, [appointments[0].id])
    
    const transformedAppointment = {
      ...appointments[0],
      patient: {
        id: appointments[0].patient_id,
        name: fullAppointment[0].patient_name,
        email: fullAppointment[0].patient_email,
        phone: fullAppointment[0].patient_phone
      },
      doctor: {
        id: appointments[0].doctor_id,
        name: fullAppointment[0].doctor_name,
        specialty: fullAppointment[0].doctor_specialty,
        phone: fullAppointment[0].doctor_phone
      }
    }
    
    res.status(200).json(transformedAppointment)
  } catch (error) {
    console.error('Error updating appointment:', error)
    res.status(500).json({ message: 'Error updating appointment' })
  }
}

async function deleteAppointment(req, res, session) {
  // Only admins can delete appointments
  if (session.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' })
  }

  try {
    const { id } = req.query
    
    const result = await query(
      'DELETE FROM appointments WHERE id = $1 RETURNING id',
      [parseInt(id)]
    )
    
    if (result.length === 0) {
      return res.status(404).json({ message: 'Appointment not found' })
    }
    
    res.status(200).json({ message: 'Appointment deleted successfully' })
  } catch (error) {
    console.error('Error deleting appointment:', error)
    res.status(500).json({ message: 'Error deleting appointment' })
  }
}
