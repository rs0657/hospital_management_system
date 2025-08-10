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
    let whereClause = {}
    
    // Doctors can only see prescriptions for their appointments
    if (session.user.role === 'doctor') {
      const doctor = await prisma.doctor.findFirst({
        where: { name: session.user.name }
      })
      
      if (doctor) {
        whereClause = {
          appointment: {
            doctorId: doctor.id
          }
        }
      }
    }

    const prescriptions = await prisma.prescription.findMany({
      where: whereClause,
      include: {
        appointment: {
          include: {
            patient: true,
            doctor: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    res.status(200).json(prescriptions)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching prescriptions' })
  }
}

async function createPrescription(req, res, session) {
  // Only doctors and admins can create prescriptions
  if (!['admin', 'doctor'].includes(session.user.role)) {
    return res.status(403).json({ message: 'Forbidden' })
  }

  try {
    const { appointmentId, medicineName, dosage, duration } = req.body
    
    // If doctor, verify they own the appointment
    if (session.user.role === 'doctor') {
      const doctor = await prisma.doctor.findFirst({
        where: { name: session.user.name }
      })
      
      if (doctor) {
        const appointment = await prisma.appointment.findFirst({
          where: { id: parseInt(appointmentId), doctorId: doctor.id }
        })
        
        if (!appointment) {
          return res.status(403).json({ message: 'Forbidden: Not your appointment' })
        }
      }
    }
    
    const prescription = await prisma.prescription.create({
      data: {
        appointmentId: parseInt(appointmentId),
        medicineName,
        dosage,
        duration
      },
      include: {
        appointment: {
          include: {
            patient: true,
            doctor: true
          }
        }
      }
    })
    
    res.status(201).json(prescription)
  } catch (error) {
    res.status(500).json({ message: 'Error creating prescription' })
  }
}

async function updatePrescription(req, res, session) {
  // Only doctors and admins can update prescriptions
  if (!['admin', 'doctor'].includes(session.user.role)) {
    return res.status(403).json({ message: 'Forbidden' })
  }

  try {
    const { id } = req.query
    const { medicineName, dosage, duration } = req.body
    
    // If doctor, verify they own the prescription's appointment
    if (session.user.role === 'doctor') {
      const doctor = await prisma.doctor.findFirst({
        where: { name: session.user.name }
      })
      
      if (doctor) {
        const prescription = await prisma.prescription.findFirst({
          where: { 
            id: parseInt(id)
          },
          include: {
            appointment: true
          }
        })
        
        if (!prescription || prescription.appointment.doctorId !== doctor.id) {
          return res.status(403).json({ message: 'Forbidden' })
        }
      }
    }
    
    const prescription = await prisma.prescription.update({
      where: { id: parseInt(id) },
      data: {
        medicineName,
        dosage,
        duration
      },
      include: {
        appointment: {
          include: {
            patient: true,
            doctor: true
          }
        }
      }
    })
    
    res.status(200).json(prescription)
  } catch (error) {
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
    
    await prisma.prescription.delete({
      where: { id: parseInt(id) }
    })
    
    res.status(200).json({ message: 'Prescription deleted successfully' })
  } catch (error) {
    res.status(500).json({ message: 'Error deleting prescription' })
  }
}
