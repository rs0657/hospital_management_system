import { getServerSession } from 'next-auth/next'
import { authOptions } from './auth/[...nextauth]'
import { SupabaseService } from '../../lib/supabase-service'

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
    const result = await SupabaseService.getBilling()
    
    if (result.error) {
      console.error('Error fetching billing:', result.error)
      return res.status(500).json({ message: 'Error fetching billing' })
    }
    
    const billing = result.data || []
    
    // Transform the data to match frontend expectations
    const transformedBilling = billing.map(bill => ({
      id: bill.id,
      amount: bill.amount,
      payment_status: bill.status,
      paymentStatus: bill.status, // Add both formats for compatibility
      description: bill.description,
      date: bill.date,
      created_at: bill.created_at,
      updated_at: bill.updated_at,
      patient: {
        id: bill.patient_id,
        name: bill.patients?.name,
        email: bill.patients?.email,
        phone: bill.patients?.phone
      }
    }))
    
    res.status(200).json({ billing: transformedBilling })
  } catch (error) {
    console.error('Error fetching billing records:', error)
    res.status(500).json({ message: 'Error fetching billing records' })
  }
}

async function createBill(req, res, session) {
  // Only admins and receptionists can create bills
  if (!['admin', 'receptionist'].includes(session.user.role)) {
    return res.status(403).json({ message: 'Forbidden' })
  }

  try {
    const { patientId, amount, paymentStatus, description, date } = req.body
    
    const billingData = {
      patient_id: parseInt(patientId),
      amount: parseFloat(amount),
      status: paymentStatus || 'pending',
      description: description || '',
      date: date || new Date().toISOString().split('T')[0]
    }
    
    const result = await SupabaseService.createBilling(billingData)
    
    if (result.error) {
      console.error('Error creating billing:', result.error)
      return res.status(500).json({ message: 'Error creating bill' })
    }
    
    // Get complete bill data with patient info
    const fullBillResult = await SupabaseService.getBillingById(result.data.id)
    
    if (fullBillResult.error) {
      console.error('Error fetching full bill:', fullBillResult.error)
      return res.status(500).json({ message: 'Error fetching bill details' })
    }
    
    const bill = fullBillResult.data
    const transformedBill = {
      id: bill.id,
      amount: bill.amount,
      payment_status: bill.status,
      description: bill.description,
      date: bill.date,
      created_at: bill.created_at,
      updated_at: bill.updated_at,
      patient: {
        id: bill.patient_id,
        name: bill.patients?.name,
        email: bill.patients?.email,
        phone: bill.patients?.phone
      }
    }

    res.status(201).json(transformedBill)
  } catch (error) {
    console.error('Error creating bill:', error)
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
    
    if (amount !== undefined) {
      updateData.amount = parseFloat(amount)
    }
    
    if (paymentStatus) {
      updateData.status = paymentStatus
    }
    
    const result = await SupabaseService.updateBilling(parseInt(id), updateData)
    
    if (result.error) {
      console.error('Error updating billing:', result.error)
      return res.status(500).json({ message: 'Error updating bill' })
    }
    
    // Get complete bill data
    const fullBillResult = await SupabaseService.getBillingById(parseInt(id))
    
    if (fullBillResult.error) {
      console.error('Error fetching full bill:', fullBillResult.error)
      return res.status(500).json({ message: 'Error fetching bill details' })
    }
    
    const bill = fullBillResult.data
    const transformedBill = {
      id: bill.id,
      amount: bill.amount,
      payment_status: bill.status,
      description: bill.description,
      date: bill.date,
      created_at: bill.created_at,
      updated_at: bill.updated_at,
      patient: {
        id: bill.patient_id,
        name: bill.patients?.name,
        email: bill.patients?.email,
        phone: bill.patients?.phone
      }
    }
    
    res.status(200).json(transformedBill)
  } catch (error) {
    console.error('Error updating bill:', error)
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
    
    const result = await SupabaseService.deleteBilling(parseInt(id))
    
    if (result.error) {
      console.error('Error deleting billing:', result.error)
      return res.status(500).json({ message: 'Error deleting bill' })
    }
    
    res.status(200).json({ message: 'Bill deleted successfully' })
  } catch (error) {
    console.error('Error deleting bill:', error)
    res.status(500).json({ message: 'Error deleting bill' })
  }
}
