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
      return getBilling(req, res, session)
    case 'POST':
      return createBill(req, res, session)
    case 'PUT':
      return updateBill(req, res, session)
    case 'DELETE':
      return deleteBill(req, res, session)
    default:
      return res.status(405).json({ message: 'Method not allowed' })
  }
}

async function getBilling(req, res, session) {
  try {
    const billing = await prisma.billing.findMany({
      include: {
        patient: true
      },
      orderBy: {
        billDate: 'desc'
      }
    })
    
    res.status(200).json(billing)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching billing records' })
  }
}

async function createBill(req, res, session) {
  // Only admins and receptionists can create bills
  if (!['admin', 'receptionist'].includes(session.user.role)) {
    return res.status(403).json({ message: 'Forbidden' })
  }

  try {
    const { patientId, amount, paymentStatus } = req.body
    
    const bill = await prisma.billing.create({
      data: {
        patientId: parseInt(patientId),
        amount: parseFloat(amount),
        paymentStatus: paymentStatus || 'pending',
        billDate: new Date()
      },
      include: {
        patient: true
      }
    })
    
    res.status(201).json(bill)
  } catch (error) {
    res.status(500).json({ message: 'Error creating bill' })
  }
}

async function updateBill(req, res, session) {
  // Only admins and receptionists can update bills
  if (!['admin', 'receptionist'].includes(session.user.role)) {
    return res.status(403).json({ message: 'Forbidden' })
  }

  try {
    const { id } = req.query
    const { amount, paymentStatus } = req.body
    
    const updateData = {}
    if (amount !== undefined) updateData.amount = parseFloat(amount)
    if (paymentStatus) updateData.paymentStatus = paymentStatus
    
    const bill = await prisma.billing.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        patient: true
      }
    })
    
    res.status(200).json(bill)
  } catch (error) {
    res.status(500).json({ message: 'Error updating bill' })
  }
}

async function deleteBill(req, res, session) {
  // Only admins can delete bills
  if (session.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' })
  }

  try {
    const { id } = req.query
    
    await prisma.billing.delete({
      where: { id: parseInt(id) }
    })
    
    res.status(200).json({ message: 'Bill deleted successfully' })
  } catch (error) {
    res.status(500).json({ message: 'Error deleting bill' })
  }
}
