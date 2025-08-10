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
      return getDoctors(req, res, session)
    case 'POST':
      return createDoctor(req, res, session)
    case 'PUT':
      return updateDoctor(req, res, session)
    case 'DELETE':
      return deleteDoctor(req, res, session)
    default:
      return res.status(405).json({ message: 'Method not allowed' })
  }
}

async function getDoctors(req, res, session) {
  try {
    const doctors = await prisma.doctor.findMany({
      include: {
        appointments: {
          include: {
            patient: true
          }
        }
      }
    })
    res.status(200).json(doctors)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching doctors' })
  }
}

async function createDoctor(req, res, session) {
  // Only admins can create doctors
  if (session.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' })
  }

  try {
    const { name, email, specialization, phone, experience, qualification } = req.body
    
    // Check if doctor with email already exists
    const existingDoctor = await prisma.doctor.findUnique({
      where: { email }
    })
    
    if (existingDoctor) {
      return res.status(400).json({ message: 'Doctor with this email already exists' })
    }
    
    const doctor = await prisma.doctor.create({
      data: {
        name,
        email,
        specialization,
        phone,
        experience: parseInt(experience),
        qualification
      }
    })
    
    res.status(201).json({ message: 'Doctor created successfully', doctor })
  } catch (error) {
    console.error('Error creating doctor:', error)
    res.status(500).json({ message: 'Error creating doctor' })
  }
}

async function updateDoctor(req, res, session) {
  // Only admins can update doctors
  if (session.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' })
  }

  try {
    const { id } = req.query
    const { name, specialty, phone } = req.body
    
    const doctor = await prisma.doctor.update({
      where: { id: parseInt(id) },
      data: {
        name,
        specialty,
        phone
      }
    })
    
    res.status(200).json(doctor)
  } catch (error) {
    res.status(500).json({ message: 'Error updating doctor' })
  }
}

async function deleteDoctor(req, res, session) {
  // Only admins can delete doctors
  if (session.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' })
  }

  try {
    const { id } = req.query
    
    await prisma.doctor.delete({
      where: { id: parseInt(id) }
    })
    
    res.status(200).json({ message: 'Doctor deleted successfully' })
  } catch (error) {
    res.status(500).json({ message: 'Error deleting doctor' })
  }
}
