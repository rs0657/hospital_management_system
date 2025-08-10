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
      return getPatient(req, res, id)
    case 'PUT':
      return updatePatient(req, res, session, id)
    case 'DELETE':
      return deletePatient(req, res, session, id)
    default:
      return res.status(405).json({ message: 'Method not allowed' })
  }
}

async function getPatient(req, res, id) {
  try {
    const patient = await prisma.patient.findUnique({
      where: { id: parseInt(id) },
      include: {
        appointments: {
          include: {
            doctor: true
          },
          orderBy: {
            appointmentDate: 'desc'
          }
        }
      }
    })
    
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' })
    }
    
    res.status(200).json(patient)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching patient' })
  }
}

async function updatePatient(req, res, session, id) {
  // Only admins and receptionists can update patients
  if (!['admin', 'receptionist'].includes(session.user.role)) {
    return res.status(403).json({ message: 'Forbidden' })
  }

  try {
    const { name, email, phone, address, dateOfBirth, gender, bloodGroup, emergencyContact, medicalHistory } = req.body
    
    const updateData = {}
    if (name) updateData.name = name
    if (email !== undefined) updateData.email = email
    if (phone) updateData.phone = phone
    if (address) updateData.address = address
    if (dateOfBirth) updateData.dateOfBirth = new Date(dateOfBirth)
    if (gender) updateData.gender = gender
    if (bloodGroup !== undefined) updateData.bloodGroup = bloodGroup
    if (emergencyContact) updateData.emergencyContact = emergencyContact
    if (medicalHistory !== undefined) updateData.medicalHistory = medicalHistory
    
    const patient = await prisma.patient.update({
      where: { id: parseInt(id) },
      data: updateData
    })
    
    res.status(200).json(patient)
  } catch (error) {
    console.error('Error updating patient:', error)
    res.status(500).json({ message: 'Error updating patient' })
  }
}

async function deletePatient(req, res, session, id) {
  // Only admins can delete patients
  if (session.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' })
  }

  try {
    await prisma.patient.delete({
      where: { id: parseInt(id) }
    })
    
    res.status(200).json({ message: 'Patient deleted successfully' })
  } catch (error) {
    console.error('Error deleting patient:', error)
    res.status(500).json({ message: 'Error deleting patient' })
  }
}
