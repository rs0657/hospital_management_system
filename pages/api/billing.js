import { getServerSession } from 'next-auth/next'
import { authOptions } from './auth/[...nextauth]'
import { query } from '../../lib/database'

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
    const billing = await query(`
      SELECT b.*, 
             p.name as patient_name, p.email as patient_email, p.phone as patient_phone
      FROM billing b
      LEFT JOIN patients p ON b.patient_id = p.id
      ORDER BY b.date DESC
    `)
    
    // Transform the data to match frontend expectations
    const transformedBilling = billing.map(bill => ({
      id: bill.id,
      amount: bill.amount,
      payment_status: bill.payment_status,
      description: bill.description,
      date: bill.date,
      created_at: bill.created_at,
      updated_at: bill.updated_at,
      patient: {
        id: bill.patient_id,
        name: bill.patient_name,
        email: bill.patient_email,
        phone: bill.patient_phone
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
    
    const bills = await query(
      'INSERT INTO billing (patient_id, amount, payment_status, description, date) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [parseInt(patientId), parseFloat(amount), paymentStatus || 'pending', description || '', date || new Date().toISOString().split('T')[0]]
    )
    
    // Get complete bill data with patient info
    const fullBill = await query(`
      SELECT b.*, 
             p.name as patient_name, p.email as patient_email, p.phone as patient_phone
      FROM billing b
      LEFT JOIN patients p ON b.patient_id = p.id
      WHERE b.id = $1
    `, [bills[0].id])
    
    const transformedBill = {
      ...bills[0],
      patient: {
        id: bills[0].patient_id,
        name: fullBill[0].patient_name,
        email: fullBill[0].patient_email,
        phone: fullBill[0].patient_phone
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
    
    let updateQuery = 'UPDATE billing SET updated_at = NOW()'
    let params = []
    let paramIndex = 1
    
    if (amount !== undefined) {
      updateQuery += `, amount = $${paramIndex}`
      params.push(parseFloat(amount))
      paramIndex++
    }
    
    if (paymentStatus) {
      updateQuery += `, payment_status = $${paramIndex}`
      params.push(paymentStatus)
      paramIndex++
    }
    
    updateQuery += ` WHERE id = $${paramIndex} RETURNING *`
    params.push(parseInt(id))
    
    const bills = await query(updateQuery, params)
    
    if (bills.length === 0) {
      return res.status(404).json({ message: 'Bill not found' })
    }
    
    // Get complete bill data
    const fullBill = await query(`
      SELECT b.*, 
             p.name as patient_name, p.email as patient_email, p.phone as patient_phone
      FROM billing b
      LEFT JOIN patients p ON b.patient_id = p.id
      WHERE b.id = $1
    `, [bills[0].id])
    
    const transformedBill = {
      ...bills[0],
      patient: {
        id: bills[0].patient_id,
        name: fullBill[0].patient_name,
        email: fullBill[0].patient_email,
        phone: fullBill[0].patient_phone
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
    
    const result = await query(
      'DELETE FROM billing WHERE id = $1 RETURNING id',
      [parseInt(id)]
    )
    
    if (result.length === 0) {
      return res.status(404).json({ message: 'Bill not found' })
    }
    
    res.status(200).json({ message: 'Bill deleted successfully' })
  } catch (error) {
    console.error('Error deleting bill:', error)
    res.status(500).json({ message: 'Error deleting bill' })
  }
}
