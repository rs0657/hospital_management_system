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
    const result = await SupabaseService.getAppointmentById(id)
    
    if (!result.success || !result.data) {
      return res.status(404).json({ message: 'Appointment not found' })
    }
    
    res.status(200).json(result.data)
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
      const doctor = await SupabaseService.getDoctorByEmail(session.user.email)
      
      if (doctor) {
        const appointment = await SupabaseService.getAppointmentById(id)
        
        if (!appointment || appointment.doctor_id !== doctor.id) {
          return res.status(403).json({ message: 'Forbidden' })
        }
      }
    } else if (!['admin', 'receptionist'].includes(session.user.role)) {
      return res.status(403).json({ message: 'Forbidden' })
    }
    
    const updateData = {}
    
    if (status) {
      updateData.status = status
    }
    
    if (date && ['admin', 'receptionist'].includes(session.user.role)) {
      updateData.date = date
    }
    
    if (time && ['admin', 'receptionist'].includes(session.user.role)) {
      updateData.time = time
    }
    
    if (reason !== undefined && ['admin', 'receptionist'].includes(session.user.role)) {
      updateData.reason = reason
    }
    
    if (notes !== undefined) {
      updateData.notes = notes
    }
    
    const result = await SupabaseService.updateAppointment(id, updateData)
    
    if (!result.success) {
      return res.status(404).json({ message: 'Appointment not found' })
    }
    
    // Get complete appointment data
    const fullAppointment = await SupabaseService.getAppointmentById(id)
    
    res.status(200).json(fullAppointment)
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
    const result = await SupabaseService.deleteAppointment(id)
    
    if (!result.success) {
      return res.status(404).json({ message: 'Appointment not found' })
    }
    
    res.status(200).json({ message: 'Appointment deleted successfully' })
  } catch (error) {
    console.error('Error deleting appointment:', error)
    res.status(500).json({ message: 'Error deleting appointment' })
  }
}
