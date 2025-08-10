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
      return getAppointment(req, res, id)
    case 'PUT':
      return updateAppointment(req, res, session, id)
    case 'DELETE':
      return deleteAppointment(req, res, session, id)
    default:
      return res.status(405).json({ message: 'Method not allowed' })
  }
}

async function getAppointment(req, res, id) {
  try {
    const appointments = await query(`
      SELECT a.*, 
             p.name as patient_name, p.email as patient_email, p.phone as patient_phone,
             d.name as doctor_name, d.specialty as doctor_specialty, d.phone as doctor_phone
      FROM appointments a
      LEFT JOIN patients p ON a.patient_id = p.id
      LEFT JOIN doctors d ON a.doctor_id = d.id
      WHERE a.id = $1
    `, [parseInt(id)])
    
    if (appointments.length === 0) {
      return res.status(404).json({ message: 'Appointment not found' })
    }
    
    const appointment = appointments[0]
    const transformedAppointment = {
      id: appointment.id,
      date: appointment.date,
      time: appointment.time,
      status: appointment.status,
      reason: appointment.reason,
      notes: appointment.notes,
      created_at: appointment.created_at,
      updated_at: appointment.updated_at,
      patient: {
        id: appointment.patient_id,
        name: appointment.patient_name,
        email: appointment.patient_email,
        phone: appointment.patient_phone
      },
      doctor: {
        id: appointment.doctor_id,
        name: appointment.doctor_name,
        specialty: appointment.doctor_specialty,
        phone: appointment.doctor_phone
      }
    }
    
    res.status(200).json(transformedAppointment)
  } catch (error) {
    console.error('Error fetching appointment:', error)
    res.status(500).json({ message: 'Error fetching appointment' })
  }
}

async function updateAppointment(req, res, session, id) {
  try {
    const { status, date, time, reason, notes } = req.body
    
    // Doctors can update status, admins/receptionists can update everything
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
    
    if (reason !== undefined && ['admin', 'receptionist'].includes(session.user.role)) {
      updateQuery += `, reason = $${paramIndex}`
      params.push(reason)
      paramIndex++
    }
    
    if (notes !== undefined) {
      updateQuery += `, notes = $${paramIndex}`
      params.push(notes)
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

async function deleteAppointment(req, res, session, id) {
  // Only admins can delete appointments
  if (session.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' })
  }

  try {
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
