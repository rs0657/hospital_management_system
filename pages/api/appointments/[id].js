import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'

const prisma = new PrismaClient()

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
    const appointment = await prisma.appointment.findUnique({
      where: { id: parseInt(id) },
      include: {
        patient: true,
        doctor: true
      }
    })
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' })
    }
    
    res.status(200).json(appointment)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching appointment' })
  }
}

async function updateAppointment(req, res, session, id) {
  try {
    const { status, appointmentDate, reason, notes } = req.body
    
    // Doctors can update status, admins/receptionists can update everything
    if (session.user.role === 'doctor') {
      // Verify the appointment belongs to this doctor
      const doctor = await prisma.doctor.findFirst({
        where: { name: session.user.name }
      })
      
      if (doctor) {
        const appointment = await prisma.appointment.findFirst({
          where: { id: parseInt(id), doctorId: doctor.id }
        })
        
        if (!appointment) {
          return res.status(403).json({ message: 'Forbidden' })
        }
      }
    } else if (!['admin', 'receptionist'].includes(session.user.role)) {
      return res.status(403).json({ message: 'Forbidden' })
    }
    
    const updateData = {}
    if (status) updateData.status = status
    if (appointmentDate && ['admin', 'receptionist'].includes(session.user.role)) {
      updateData.appointmentDate = new Date(appointmentDate)
    }
    if (reason !== undefined && ['admin', 'receptionist'].includes(session.user.role)) {
      updateData.reason = reason
    }
    if (notes !== undefined) updateData.notes = notes
    
    const appointment = await prisma.appointment.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        patient: true,
        doctor: true
      }
    })
    
    res.status(200).json(appointment)
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
    await prisma.appointment.delete({
      where: { id: parseInt(id) }
    })
    
    res.status(200).json({ message: 'Appointment deleted successfully' })
  } catch (error) {
    console.error('Error deleting appointment:', error)
    res.status(500).json({ message: 'Error deleting appointment' })
  }
}
