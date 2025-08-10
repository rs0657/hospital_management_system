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
      return getPatients(req, res, session)
    case 'POST':
      return createPatient(req, res, session)
    case 'PUT':
      return updatePatient(req, res, session)
    case 'DELETE':
      return deletePatient(req, res, session)
    default:
      return res.status(405).json({ message: 'Method not allowed' })
  }
}

async function getPatients(req, res, session) {
  try {
    const patients = await prisma.patient.findMany({
      include: {
        appointments: {
          include: {
            doctor: true
          }
        },
        billing: true
      }
    })
    res.status(200).json({ patients })
  } catch (error) {
    res.status(500).json({ message: 'Error fetching patients' })
  }
}

async function createPatient(req, res, session) {
  // Only admins and receptionists can create patients
  if (!['admin', 'receptionist'].includes(session.user.role)) {
    return res.status(403).json({ message: 'Forbidden' })
  }

  try {
    const { 
      name, 
      email, 
      phone, 
      address, 
      dateOfBirth, 
      gender, 
      bloodGroup, 
      emergencyContact, 
      medicalHistory 
    } = req.body
    
    const patient = await prisma.patient.create({
      data: {
        name,
        email: email || null,
        phone,
        address,
        dateOfBirth: new Date(dateOfBirth),
        gender,
        bloodGroup: bloodGroup || null,
        emergencyContact,
        medicalHistory: medicalHistory || null
      }
    })
    
    res.status(201).json(patient)
  } catch (error) {
    console.error('Error creating patient:', error)
    res.status(500).json({ message: 'Error creating patient', error: error.message })
  }
}

async function updatePatient(req, res, session) {
  // Only admins and receptionists can update patients
  if (!['admin', 'receptionist'].includes(session.user.role)) {
    return res.status(403).json({ message: 'Forbidden' })
  }

  try {
    const { id } = req.query
    const { 
      name, 
      email, 
      phone, 
      address, 
      dateOfBirth, 
      gender, 
      bloodGroup, 
      emergencyContact, 
      medicalHistory 
    } = req.body
    
    const patient = await prisma.patient.update({
      where: { id: parseInt(id) },
      data: {
        name,
        email: email || null,
        phone,
        address,
        dateOfBirth: new Date(dateOfBirth),
        gender,
        bloodGroup: bloodGroup || null,
        emergencyContact,
        medicalHistory: medicalHistory || null
      }
    })
    
    res.status(200).json(patient)
  } catch (error) {
    console.error('Error updating patient:', error)
    res.status(500).json({ message: 'Error updating patient', error: error.message })
  }
}

async function deletePatient(req, res, session) {
  // Only admins can delete patients
  if (session.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' })
  }

  try {
    const { id } = req.query
    
    await prisma.patient.delete({
      where: { id: parseInt(id) }
    })
    
    res.status(200).json({ message: 'Patient deleted successfully' })
  } catch (error) {
    res.status(500).json({ message: 'Error deleting patient' })
  }
}
