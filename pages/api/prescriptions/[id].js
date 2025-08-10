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
      return getPrescription(req, res, id)
    case 'PUT':
      return updatePrescription(req, res, session, id)
    case 'DELETE':
      return deletePrescription(req, res, session, id)
    default:
      return res.status(405).json({ message: 'Method not allowed' })
  }
}

async function getPrescription(req, res, id) {
  try {
    const prescription = await prisma.prescription.findUnique({
      where: { id: parseInt(id) },
      include: {
        patient: true,
        doctor: true
      }
    })
    
    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' })
    }
    
    res.status(200).json(prescription)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching prescription' })
  }
}

async function updatePrescription(req, res, session, id) {
  // Only doctors and admins can update prescriptions
  if (!['admin', 'doctor'].includes(session.user.role)) {
    return res.status(403).json({ message: 'Forbidden' })
  }

  try {
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

async function deletePrescription(req, res, session, id) {
  // Only admins can delete prescriptions
  if (session.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' })
  }

  try {
    await prisma.prescription.delete({
      where: { id: parseInt(id) }
    })
    
    res.status(200).json({ message: 'Prescription deleted successfully' })
  } catch (error) {
    console.error('Error deleting prescription:', error)
    res.status(500).json({ message: 'Error deleting prescription' })
  }
}
