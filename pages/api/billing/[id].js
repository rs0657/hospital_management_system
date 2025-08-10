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
      return getBill(req, res, id)
    case 'PUT':
      return updateBill(req, res, session, id)
    case 'DELETE':
      return deleteBill(req, res, session, id)
    default:
      return res.status(405).json({ message: 'Method not allowed' })
  }
}

async function getBill(req, res, id) {
  try {
    const bill = await prisma.billing.findUnique({
      where: { id: parseInt(id) },
      include: {
        patient: true
      }
    })
    
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' })
    }
    
    res.status(200).json(bill)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching bill' })
  }
}

async function updateBill(req, res, session, id) {
  // Only admins and receptionists can update bills
  if (!['admin', 'receptionist'].includes(session.user.role)) {
    return res.status(403).json({ message: 'Forbidden' })
  }

  try {
    const { amount, paymentStatus, description } = req.body
    
    const updateData = {}
    if (amount !== undefined) updateData.amount = parseFloat(amount)
    if (paymentStatus) updateData.paymentStatus = paymentStatus
    if (description !== undefined) updateData.description = description
    
    const bill = await prisma.billing.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        patient: true
      }
    })
    
    res.status(200).json(bill)
  } catch (error) {
    console.error('Error updating bill:', error)
    res.status(500).json({ message: 'Error updating bill' })
  }
}

async function deleteBill(req, res, session, id) {
  // Only admins can delete bills
  if (session.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' })
  }

  try {
    await prisma.billing.delete({
      where: { id: parseInt(id) }
    })
    
    res.status(200).json({ message: 'Bill deleted successfully' })
  } catch (error) {
    console.error('Error deleting bill:', error)
    res.status(500).json({ message: 'Error deleting bill' })
  }
}
