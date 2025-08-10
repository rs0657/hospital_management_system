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
    const doctors = await query(`
      SELECT d.*, 
             json_agg(
               json_build_object(
                 'id', a.id,
                 'date', a.date,
                 'time', a.time,
                 'status', a.status,
                 'patient', json_build_object(
                   'id', p.id,
                   'name', p.name,
                   'email', p.email,
                   'phone', p.phone
                 )
               )
             ) FILTER (WHERE a.id IS NOT NULL) as appointments
      FROM doctors d
      LEFT JOIN appointments a ON d.id = a.doctor_id
      LEFT JOIN patients p ON a.patient_id = p.id
      GROUP BY d.id, d.name, d.specialty, d.phone, d.created_at, d.updated_at
      ORDER BY d.name
    `)
    res.status(200).json({ doctors })
  } catch (error) {
    console.error('Error fetching doctors:', error)
    res.status(500).json({ message: 'Error fetching doctors' })
  }
}

async function createDoctor(req, res, session) {
  // Only admins can create doctors
  if (session.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' })
  }

  try {
    const { name, specialty, phone } = req.body
    
    const doctors = await query(
      'INSERT INTO doctors (name, specialty, phone) VALUES ($1, $2, $3) RETURNING *',
      [name, specialty, phone]
    )
    
    res.status(201).json(doctors[0])
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
    
    const doctors = await query(
      'UPDATE doctors SET name = $1, specialty = $2, phone = $3, updated_at = NOW() WHERE id = $4 RETURNING *',
      [name, specialty, phone, parseInt(id)]
    )
    
    if (doctors.length === 0) {
      return res.status(404).json({ message: 'Doctor not found' })
    }
    
    res.status(200).json(doctors[0])
  } catch (error) {
    console.error('Error updating doctor:', error)
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
    
    const result = await query(
      'DELETE FROM doctors WHERE id = $1 RETURNING id',
      [parseInt(id)]
    )
    
    if (result.length === 0) {
      return res.status(404).json({ message: 'Doctor not found' })
    }
    
    res.status(200).json({ message: 'Doctor deleted successfully' })
  } catch (error) {
    console.error('Error deleting doctor:', error)
    res.status(500).json({ message: 'Error deleting doctor' })
  }
}
