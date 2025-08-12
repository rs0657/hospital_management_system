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
      return getPrescriptions(req, res, session)
    case 'POST':
      return createPrescription(req, res, session)
    case 'PUT':
      return updatePrescription(req, res, session)
    case 'DELETE':
      return deletePrescription(req, res, session)
    default:
      return res.status(405).json({ message: 'Method not allowed' })
  }
}

async function getPrescriptions(req, res, session) {
  try {
    const result = await SupabaseService.getPrescriptions()
    
    if (result.error) {
      console.error('Error fetching prescriptions:', result.error)
      return res.status(500).json({ message: 'Error fetching prescriptions' })
    }
    
    let prescriptions = result.data || []
    
    // Doctors can only see their own prescriptions
    if (session.user.role === 'doctor') {
      // Get doctor by email since that's how we mapped them
      const doctorResult = await SupabaseService.getDoctorByEmail(session.user.email)
      if (doctorResult.data) {
        prescriptions = prescriptions.filter(p => p.doctor_id === doctorResult.data.id)
      } else {
        prescriptions = [] // No matching doctor found
      }
    }

    // Transform the data to match frontend expectations
    const transformedPrescriptions = prescriptions.map(presc => ({
      id: presc.id,
      medication: presc.medication,
      dosage: presc.dosage,
      instructions: presc.instructions,
      created_at: presc.created_at,
      updated_at: presc.updated_at,
      patient: {
        id: presc.patient_id,
        name: presc.patients?.name,
        email: presc.patients?.email,
        phone: presc.patients?.phone
      },
      doctor: {
        id: presc.doctor_id,
        name: presc.doctors?.name,
        specialty: presc.doctors?.specialty,
        phone: presc.doctors?.phone
      }
    }))
    
    res.status(200).json({ prescriptions: transformedPrescriptions })
  } catch (error) {
    console.error('Error fetching prescriptions:', error)
    res.status(500).json({ message: 'Error fetching prescriptions' })
  }
}

async function createPrescription(req, res, session) {
  // Only doctors and admins can create prescriptions
  if (!['admin', 'doctor'].includes(session.user.role)) {
    return res.status(403).json({ message: 'Forbidden' })
  }

  try {
    const { patientId, doctorId, medication, dosage, instructions, medications } = req.body
    
    let finalDoctorId = doctorId
    
    // If no doctorId provided and user is a doctor, use their ID
    if (!finalDoctorId && session.user.role === 'doctor') {
      const doctorResult = await SupabaseService.getDoctorByEmail(session.user.email)
      
      if (doctorResult.data) {
        finalDoctorId = doctorResult.data.id
      } else {
        return res.status(400).json({ 
          message: 'Doctor profile not found. Please contact administrator.',
          debug: {
            userName: session.user.name,
            userEmail: session.user.email
          }
        })
      }
    }
    
    // If doctor, verify they are creating their own prescription
    if (session.user.role === 'doctor') {
      const doctorResult = await SupabaseService.getDoctorByEmail(session.user.email)
      
      if (doctorResult.data && doctorResult.data.id !== parseInt(finalDoctorId)) {
        return res.status(403).json({ message: 'Forbidden: Can only create your own prescriptions' })
      }
    }
    
    // Handle multiple medications from the new form
    if (medications && Array.isArray(medications)) {
      const createdPrescriptions = []
      
      for (const med of medications) {
        const prescriptionData = {
          patient_id: parseInt(patientId),
          doctor_id: parseInt(finalDoctorId),
          medication: med.name,
          dosage: med.dosage || 'As prescribed',
          instructions: med.instructions || `${med.frequency || ''} ${med.duration || ''}`.trim() || ''
        }
        
        const result = await SupabaseService.createPrescription(prescriptionData)
        
        if (result.error) {
          console.error('Error creating prescription:', result.error)
          return res.status(500).json({ message: 'Error creating prescription' })
        }
        
        createdPrescriptions.push(result.data)
      }
      
      res.status(201).json({ 
        message: `${createdPrescriptions.length} prescriptions created successfully`,
        prescriptions: createdPrescriptions 
      })
    } else {
      // Handle single medication (backward compatibility)
      const prescriptionData = {
        patient_id: parseInt(patientId),
        doctor_id: parseInt(finalDoctorId),
        medication,
        dosage: dosage || 'As prescribed',
        instructions: instructions || ''
      }
      
      const result = await SupabaseService.createPrescription(prescriptionData)
      
      if (result.error) {
        console.error('Error creating prescription:', result.error)
        return res.status(500).json({ message: 'Error creating prescription' })
      }
      
      // Get complete prescription data
      const fullPrescriptionResult = await SupabaseService.getPrescriptionById(result.data.id)
      
      if (fullPrescriptionResult.error) {
        console.error('Error fetching full prescription:', fullPrescriptionResult.error)
        return res.status(500).json({ message: 'Error fetching prescription details' })
      }
      
      const prescription = fullPrescriptionResult.data
      const transformedPrescription = {
        id: prescription.id,
        medication: prescription.medication,
        dosage: prescription.dosage,
        instructions: prescription.instructions,
        created_at: prescription.created_at,
        updated_at: prescription.updated_at,
        patient: {
          id: prescription.patient_id,
          name: prescription.patients?.name,
          email: prescription.patients?.email,
          phone: prescription.patients?.phone
        },
        doctor: {
          id: prescription.doctor_id,
          name: prescription.doctors?.name,
          specialty: prescription.doctors?.specialty,
          phone: prescription.doctors?.phone
        }
      }
      
      res.status(201).json(transformedPrescription)
    }
  } catch (error) {
    console.error('Error creating prescription:', error)
    console.error('Request body:', req.body)
    console.error('Session user:', session.user)
    res.status(500).json({ 
      message: 'Error creating prescription',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}

async function updatePrescription(req, res, session) {
  // Only doctors and admins can update prescriptions
  if (!['admin', 'doctor'].includes(session.user.role)) {
    return res.status(403).json({ message: 'Forbidden' })
  }

  try {
    const { id } = req.query
    const { medication, dosage, instructions } = req.body
    
    // If doctor, verify they own the prescription
    if (session.user.role === 'doctor') {
      const doctorResult = await SupabaseService.getDoctorByEmail(session.user.email)
      
      if (doctorResult.data) {
        const prescriptionResult = await SupabaseService.getPrescriptionById(parseInt(id))
        
        if (prescriptionResult.data && prescriptionResult.data.doctor_id !== doctorResult.data.id) {
          return res.status(403).json({ message: 'Forbidden' })
        }
      }
    }
    
    const updateData = {}
    
    if (medication) {
      updateData.medication = medication
    }
    
    if (dosage) {
      updateData.dosage = dosage
    }
    
    if (instructions !== undefined) {
      updateData.instructions = instructions
    }
    
    const result = await SupabaseService.updatePrescription(parseInt(id), updateData)
    
    if (result.error) {
      console.error('Error updating prescription:', result.error)
      return res.status(500).json({ message: 'Error updating prescription' })
    }
    
    // Get complete prescription data
    const fullPrescriptionResult = await SupabaseService.getPrescriptionById(parseInt(id))
    
    if (fullPrescriptionResult.error) {
      console.error('Error fetching full prescription:', fullPrescriptionResult.error)
      return res.status(500).json({ message: 'Error fetching prescription details' })
    }
    
    const prescription = fullPrescriptionResult.data
    const transformedPrescription = {
      id: prescription.id,
      medication: prescription.medication,
      dosage: prescription.dosage,
      instructions: prescription.instructions,
      created_at: prescription.created_at,
      updated_at: prescription.updated_at,
      patient: {
        id: prescription.patient_id,
        name: prescription.patients?.name,
        email: prescription.patients?.email,
        phone: prescription.patients?.phone
      },
      doctor: {
        id: prescription.doctor_id,
        name: prescription.doctors?.name,
        specialty: prescription.doctors?.specialty,
        phone: prescription.doctors?.phone
      }
    }
    
    res.status(200).json(transformedPrescription)
  } catch (error) {
    console.error('Error updating prescription:', error)
    res.status(500).json({ message: 'Error updating prescription' })
  }
}

async function deletePrescription(req, res, session) {
  // Only admins can delete prescriptions
  if (session.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' })
  }

  try {
    const { id } = req.query
    
    const result = await SupabaseService.deletePrescription(parseInt(id))
    
    if (result.error) {
      console.error('Error deleting prescription:', result.error)
      return res.status(500).json({ message: 'Error deleting prescription' })
    }
    
    res.status(200).json({ message: 'Prescription deleted successfully' })
  } catch (error) {
    console.error('Error deleting prescription:', error)
    res.status(500).json({ message: 'Error deleting prescription' })
  }
}
