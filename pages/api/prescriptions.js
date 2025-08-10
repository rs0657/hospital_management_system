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
    
    // Doctors can only see their own prescriptions
    if (session.user.role === 'doctor') {
      const doctor = await prisma.doctor.findFirst({
        where: { name: session.user.name }
      })
      
      if (doctor) {
        whereClause = { doctorId: doctor.id }
      }
    }

    const prescriptions = await prisma.prescription.findMany({
      where: whereClause,
      include: {
        patient: true,
        doctor: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    res.status(200).json({ prescriptions })
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
      const doctor = await prisma.doctor.findFirst({
        where: { name: session.user.name }
      })
      
      if (doctor) {
        finalDoctorId = doctor.id
      } else {
        return res.status(400).json({ message: 'Doctor not found' })
      }
    }
    
    // If doctor, verify they are creating their own prescription
    if (session.user.role === 'doctor') {
      const doctor = await prisma.doctor.findFirst({
        where: { name: session.user.name }
      })
      
      if (doctor && doctor.id !== parseInt(finalDoctorId)) {
        return res.status(403).json({ message: 'Forbidden: Can only create your own prescriptions' })
      }
    }
    
    const prescription = await prisma.prescription.create({
      data: {
        patientId: parseInt(patientId),
        doctorId: parseInt(finalDoctorId),
        diagnosis,
        medications: JSON.stringify(medications),
        frequency,
        notes: notes || ''
      },
      include: {
        patient: true,
        doctor: true
      }
    })
    
    res.status(201).json(prescription)
  } catch (error) {
    console.error('Error creating prescription:', error)
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
    const { diagnosis, medications, frequency, notes } = req.body
    
    // If doctor, verify they own the prescription
    if (session.user.role === 'doctor') {
      const doctor = await prisma.doctor.findFirst({
        where: { name: session.user.name }
      })
      
      if (doctor) {
        const prescription = await prisma.prescription.findFirst({
          where: { 
            id: parseInt(id),
            doctorId: doctor.id
          }
        })
        
        if (!prescription) {
          return res.status(403).json({ message: 'Forbidden' })
        }
      }
    }
    
    const updateData = {}
    if (diagnosis) updateData.diagnosis = diagnosis
    if (medications) updateData.medications = JSON.stringify(medications)
    if (frequency) updateData.frequency = frequency
    if (notes !== undefined) updateData.notes = notes
    
    const prescription = await prisma.prescription.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        patient: true,
        doctor: true
      }
    })
    
    res.status(200).json(prescription)
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
    
    await prisma.prescription.delete({
      where: { id: parseInt(id) }
    })
    
    res.status(200).json({ message: 'Prescription deleted successfully' })
  } catch (error) {
    console.error('Error deleting prescription:', error)
    res.status(500).json({ message: 'Error deleting prescription' })
  }
}
