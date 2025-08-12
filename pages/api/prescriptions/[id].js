import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { SupabaseService } from '../../../lib/supabase-service'

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions)

  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  const { id } = req.query

  switch (req.method) {
    case 'GET':
      return getPrescription(req, res, id)
    case 'PUT':
      return updatePrescription(req, res, session, id)
    case 'DELETE':
      return deletePrescription(req, res, session, id)
    default:
      return res.status(405).json({ message: 'Method not allowed' })
  }
}

async function getPrescription(req, res, id) {
  try {
    const result = await SupabaseService.getPrescriptionById(id)
    
    if (!result.success || !result.data) {
      return res.status(404).json({ message: 'Prescription not found' })
    }
    
    res.status(200).json(result.data)
  } catch (error) {
    console.error('Error fetching prescription:', error)
    res.status(500).json({ message: 'Error fetching prescription' })
  }
}

async function updatePrescription(req, res, session, id) {
  // Only doctors and admins can update prescriptions
  if (!['admin', 'doctor'].includes(session.user.role)) {
    return res.status(403).json({ message: 'Forbidden' })
  }

  try {
    const { diagnosis, medications, frequency, notes } = req.body
    
    // If doctor, verify they own the prescription
    if (session.user.role === 'doctor') {
      const doctors = await query(
        'SELECT id FROM doctors WHERE name = ?',
        [session.user.name]
      )
      
      if (doctors.length > 0) {
        const prescriptions = await query(
          'SELECT id FROM prescriptions WHERE id = ? AND doctor_id = ?',
          [parseInt(id), doctors[0].id]
        )
        
        if (prescriptions.length === 0) {
          return res.status(403).json({ message: 'Forbidden' })
        }
      }
    }
    
    const updateFields = []
    const updateValues = []
    
    if (diagnosis) {
      updateFields.push('diagnosis = ?')
      updateValues.push(diagnosis)
    }
    if (medications) {
      updateFields.push('medications = ?')
      updateValues.push(JSON.stringify(medications))
    }
    if (frequency) {
      updateFields.push('frequency = ?')
      updateValues.push(frequency)
    }
    if (notes !== undefined) {
      updateFields.push('notes = ?')
      updateValues.push(notes)
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' })
    }
    
    updateFields.push('updated_at = CURRENT_TIMESTAMP')
    updateValues.push(parseInt(id))
    
    await query(
      `UPDATE prescriptions SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    )
    
    // Fetch and return updated prescription
    const updatedPrescriptions = await query(
      `SELECT p.*, 
              pt.name as patient_name, pt.email as patient_email, pt.phone as patient_phone,
              d.name as doctor_name, d.specialty as doctor_specialty, d.phone as doctor_phone
       FROM prescriptions p
       LEFT JOIN patients pt ON p.patient_id = pt.id
       LEFT JOIN doctors d ON p.doctor_id = d.id
       WHERE p.id = ?`,
      [parseInt(id)]
    )
    
    if (updatedPrescriptions.length > 0) {
      const prescription = updatedPrescriptions[0]
      const formattedPrescription = {
        id: prescription.id,
        diagnosis: prescription.diagnosis,
        medications: prescription.medications,
        frequency: prescription.frequency,
        notes: prescription.notes,
        created_at: prescription.created_at,
        updated_at: prescription.updated_at,
        patient: {
          id: prescription.patient_id,
          name: prescription.patient_name,
          email: prescription.patient_email,
          phone: prescription.patient_phone
        },
        doctor: {
          id: prescription.doctor_id,
          name: prescription.doctor_name,
          specialty: prescription.doctor_specialty,
          phone: prescription.doctor_phone
        }
      }
      res.status(200).json(formattedPrescription)
    } else {
      res.status(404).json({ message: 'Prescription not found' })
    }
  } catch (error) {
    console.error('Error updating prescription:', error)
    res.status(500).json({ message: 'Error updating prescription' })
  }
}

async function deletePrescription(req, res, session, id) {
  // Only admins can delete prescriptions
  if (session.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' })
  }

  try {
    await query(
      'DELETE FROM prescriptions WHERE id = ?',
      [parseInt(id)]
    )
    
    res.status(200).json({ message: 'Prescription deleted successfully' })
  } catch (error) {
    console.error('Error deleting prescription:', error)
    res.status(500).json({ message: 'Error deleting prescription' })
  }
}
