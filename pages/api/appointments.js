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
    let appointmentsResult
    
    // Doctors can only see their own appointments
    if (session.user.role === 'doctor') {
      // Find doctor by user email
      const doctorResult = await SupabaseService.getDoctorByEmail(session.user.email)
      if (doctorResult.error) {
        return res.status(500).json({ message: 'Error finding doctor' })
      }
      
      if (doctorResult.data) {
        appointmentsResult = await SupabaseService.getAppointmentsByDoctor(doctorResult.data.id)
      } else {
        return res.status(404).json({ message: 'Doctor not found' })
      }
    } else {
      appointmentsResult = await SupabaseService.getAppointments()
    }

    if (appointmentsResult.error) {
      console.error('Error fetching appointments:', appointmentsResult.error)
      return res.status(500).json({ message: 'Error fetching appointments' })
    }
    
    let appointments = appointmentsResult.data || []
    
    // Ensure appointments is always an array
    if (!Array.isArray(appointments)) {
      console.error('Expected appointments data to be an array, got:', typeof appointments)
      appointments = []
    }
    
    // Transform the data to match frontend expectations
    const transformedAppointments = appointments.map(apt => ({
      id: apt.id,
      date: apt.date,
      time: apt.time,
      status: apt.status,
      reason: apt.notes, // Map notes to reason for frontend compatibility
      notes: apt.notes,
      created_at: apt.created_at,
      updated_at: apt.updated_at,
      patient: {
        id: apt.patient_id,
        name: apt.patients?.name,
        email: apt.patients?.email,
        phone: apt.patients?.phone,
        date_of_birth: apt.patients?.date_of_birth,
        address: apt.patients?.address
      },
      doctor: {
        id: apt.doctor_id,
        name: apt.doctors?.name,
        specialty: apt.doctors?.specialty,
        phone: apt.doctors?.phone
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
    
    // Map reason to notes if provided, otherwise use notes
    const appointmentNotes = reason || notes || ''
    
    const appointmentData = {
      patient_id: parseInt(patientId),
      doctor_id: parseInt(doctorId),
      date,
      time,
      status: 'scheduled',
      notes: appointmentNotes
    }
    
    const result = await SupabaseService.createAppointment(appointmentData)
    
    if (result.error) {
      console.error('Error creating appointment:', result.error)
      return res.status(500).json({ message: 'Error creating appointment' })
    }
    
    // Get complete appointment data with patient and doctor info
    const fullAppointmentResult = await SupabaseService.getAppointmentById(result.data.id)
    
    if (fullAppointmentResult.error) {
      console.error('Error fetching full appointment:', fullAppointmentResult.error)
      return res.status(500).json({ message: 'Error fetching appointment details' })
    }
    
    const apt = fullAppointmentResult.data
    const transformedAppointment = {
      id: apt.id,
      date: apt.date,
      time: apt.time,
      status: apt.status,
      reason: apt.notes, // Map notes to reason for frontend compatibility
      notes: apt.notes,
      created_at: apt.created_at,
      updated_at: apt.updated_at,
      patient: {
        id: apt.patient_id,
        name: apt.patients?.name,
        email: apt.patients?.email,
        phone: apt.patients?.phone
      },
      doctor: {
        id: apt.doctor_id,
        name: apt.doctors?.name,
        specialty: apt.doctors?.specialty,
        phone: apt.doctors?.phone
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
      const doctorResult = await SupabaseService.getDoctorByEmail(session.user.email)
      
      if (doctorResult.error || !doctorResult.data) {
        return res.status(403).json({ message: 'Doctor not found' })
      }
      
      const appointmentResult = await SupabaseService.getAppointmentById(parseInt(id))
      
      if (appointmentResult.error || !appointmentResult.data) {
        return res.status(404).json({ message: 'Appointment not found' })
      }
      
      if (appointmentResult.data.doctor_id !== doctorResult.data.id) {
        return res.status(403).json({ message: 'Forbidden' })
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
    
    const result = await SupabaseService.updateAppointment(parseInt(id), updateData)
    
    if (result.error) {
      console.error('Error updating appointment:', result.error)
      return res.status(500).json({ message: 'Error updating appointment' })
    }
    
    // Get complete appointment data
    const fullAppointmentResult = await SupabaseService.getAppointmentById(parseInt(id))
    
    if (fullAppointmentResult.error) {
      console.error('Error fetching full appointment:', fullAppointmentResult.error)
      return res.status(500).json({ message: 'Error fetching appointment details' })
    }
    
    const apt = fullAppointmentResult.data
    const transformedAppointment = {
      id: apt.id,
      date: apt.date,
      time: apt.time,
      status: apt.status,
      reason: apt.notes, // Map notes to reason for frontend compatibility
      notes: apt.notes,
      created_at: apt.created_at,
      updated_at: apt.updated_at,
      patient: {
        id: apt.patient_id,
        name: apt.patients?.name,
        email: apt.patients?.email,
        phone: apt.patients?.phone
      },
      doctor: {
        id: apt.doctor_id,
        name: apt.doctors?.name,
        specialty: apt.doctors?.specialty,
        phone: apt.doctors?.phone
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
    
    const result = await SupabaseService.deleteAppointment(parseInt(id))
    
    if (result.error) {
      console.error('Error deleting appointment:', result.error)
      return res.status(500).json({ message: 'Error deleting appointment' })
    }
    
    res.status(200).json({ message: 'Appointment deleted successfully' })
  } catch (error) {
    console.error('Error deleting appointment:', error)
    res.status(500).json({ message: 'Error deleting appointment' })
  }
}
