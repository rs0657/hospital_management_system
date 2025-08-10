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
      return getDoctor(req, res, id)
    case 'PUT':
      return updateDoctor(req, res, session, id)
    case 'DELETE':
      return deleteDoctor(req, res, session, id)
    default:
      return res.status(405).json({ message: 'Method not allowed' })
  }
}

async function getDoctor(req, res, id) {
  try {
    const doctor = await prisma.doctor.findUnique({
      where: { id: parseInt(id) },
      include: {
        appointments: {
          include: {
            patient: true
          },
          orderBy: {
            appointmentDate: 'desc'
          }
        }
      }
    })
    
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' })
    }
    
    res.status(200).json(doctor)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching doctor' })
  }
}

async function updateDoctor(req, res, session, id) {
  // Only admins can update doctors
  if (session.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' })
  }

  try {
    const { name, email, phone, specialization, experience, qualification } = req.body
    
    const updateData = {}
    if (name) updateData.name = name
    if (email) updateData.email = email
    if (phone) updateData.phone = phone
    if (specialization) updateData.specialization = specialization
    if (experience !== undefined) updateData.experience = parseInt(experience)
    if (qualification) updateData.qualification = qualification
    
    const doctor = await prisma.doctor.update({
      where: { id: parseInt(id) },
      data: updateData
    })
    
    res.status(200).json(doctor)
  } catch (error) {
    console.error('Error updating doctor:', error)
    res.status(500).json({ message: 'Error updating doctor' })
  }
}

async function deleteDoctor(req, res, session, id) {
  // Only admins can delete doctors
  if (session.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' })
  }

  try {
    await prisma.doctor.delete({
      where: { id: parseInt(id) }
    })
    
    res.status(200).json({ message: 'Doctor deleted successfully' })
  } catch (error) {
    console.error('Error deleting doctor:', error)
    res.status(500).json({ message: 'Error deleting doctor' })
  }
}
