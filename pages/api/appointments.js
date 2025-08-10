import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth/next'
import { authOptions } from './auth/[...nextauth]'

const prisma = new PrismaClient()

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
    let whereClause = {}
    
    // Doctors can only see their own appointments
    if (session.user.role === 'doctor') {
      // Note: This assumes doctor name matches user name
      // In a real app, you'd have a proper relationship between users and doctors
      const doctor = await prisma.doctor.findFirst({
        where: { name: session.user.name }
      })
      if (doctor) {
        whereClause = { doctorId: doctor.id }
      }
    }

    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      include: {
        patient: true,
        doctor: true,
        prescriptions: true
      },
      orderBy: {
        appointmentDate: 'asc'
      }
    })
    
    res.status(200).json(appointments)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching appointments' })
  }
}

async function createAppointment(req, res, session) {
  // Only admins and receptionists can create appointments
  if (!['admin', 'receptionist'].includes(session.user.role)) {
    return res.status(403).json({ message: 'Forbidden' })
  }

  try {
    const { patientId, doctorId, appointmentDate } = req.body
    
    const appointment = await prisma.appointment.create({
      data: {
        patientId: parseInt(patientId),
        doctorId: parseInt(doctorId),
        appointmentDate: new Date(appointmentDate),
        status: 'scheduled'
      },
      include: {
        patient: true,
        doctor: true
      }
    })
    
    res.status(201).json(appointment)
  } catch (error) {
    res.status(500).json({ message: 'Error creating appointment' })
  }
}

async function updateAppointment(req, res, session) {
  try {
    const { id } = req.query
    const { status, appointmentDate } = req.body
    
    // Doctors can update status, admins can update everything
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
    } else if (session.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' })
    }
    
    const updateData = {}
    if (status) updateData.status = status
    if (appointmentDate && session.user.role === 'admin') {
      updateData.appointmentDate = new Date(appointmentDate)
    }
    
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
    
    await prisma.appointment.delete({
      where: { id: parseInt(id) }
    })
    
    res.status(200).json({ message: 'Appointment deleted successfully' })
  } catch (error) {
    res.status(500).json({ message: 'Error deleting appointment' })
  }
}
