import { getAuthenticatedUser } from '../../../lib/auth-middleware'
import { SupabaseService } from '../../../lib/supabase-service'

export default async function handler(req, res) {
  const user = await getAuthenticatedUser(req)

  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  const { id } = req.query

  switch (req.method) {
    case 'GET':
      return getBill(req, res, id)
    case 'PUT':
      return updateBill(req, res, user, id)
    case 'DELETE':
      return deleteBill(req, res, user, id)
    default:
      return res.status(405).json({ message: 'Method not allowed' })
  }
}

async function getBill(req, res, id) {
  try {
    const result = await SupabaseService.getBillingById(id)
    
    if (!result.success || !result.data) {
      return res.status(404).json({ message: 'Bill not found' })
    }
    
    res.status(200).json(result.data)
  } catch (error) {
    console.error('Error fetching bill:', error)
    res.status(500).json({ message: 'Error fetching bill' })
  }
}

async function updateBill(req, res, user, id) {
  // Only admins and receptionists can update bills
  if (!['admin', 'receptionist'].includes(user.role)) {
    return res.status(403).json({ message: 'Forbidden' })
  }

  try {
    const { amount, payment_status, paymentStatus, description } = req.body
    
    const updateData = {}
    
    if (amount !== undefined) {
      updateData.amount = parseFloat(amount)
    }
    
    // Handle both payment_status and paymentStatus for compatibility
    const statusToUpdate = payment_status || paymentStatus
    if (statusToUpdate) {
      updateData.status = statusToUpdate
    }
    
    if (description !== undefined) {
      updateData.description = description
    }
    
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'No fields to update' })
    }
    
    const result = await SupabaseService.updateBilling(parseInt(id), updateData)
    
    if (!result.success) {
      return res.status(404).json({ message: 'Bill not found' })
    }
    
    // Fetch and return updated bill
    const updatedBillResult = await SupabaseService.getBillingById(parseInt(id))
    
    if (updatedBillResult.success && updatedBillResult.data) {
      res.status(200).json(updatedBillResult.data)
    } else {
      res.status(404).json({ message: 'Bill not found' })
    }
  } catch (error) {
    console.error('Error updating bill:', error)
    res.status(500).json({ message: 'Error updating bill' })
  }
}

async function deleteBill(req, res, user, id) {
  // Only admins can delete bills
  if (user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' })
  }

  try {
    const result = await SupabaseService.deleteBilling(parseInt(id))
    
    if (!result.success) {
      return res.status(404).json({ message: 'Bill not found' })
    }
    
    res.status(200).json({ message: 'Bill deleted successfully' })
  } catch (error) {
    console.error('Error deleting bill:', error)
    res.status(500).json({ message: 'Error deleting bill' })
  }
}