import { supabase, supabaseAdmin, isSupabaseConfigured } from './supabase.js'

// Helper function to handle Supabase responses
function handleSupabaseResponse(result) {
  if (result.error) {
    console.error('Supabase error:', result.error)
    return { error: result.error.message }
  }
  return { data: result.data }
}

// Check if Supabase is configured before making calls
function ensureSupabaseConfigured() {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not properly configured. Check your environment variables.')
  }
}

// Check if Supabase is configured and return boolean
function checkSupabaseConfig() {
  return isSupabaseConfigured()
}

// Universal query function for Supabase
export class SupabaseService {
  
  // Users
  static async getUsers() {
    if (!checkSupabaseConfig()) return { error: 'Database configuration not available' }
    
    const result = await supabaseAdmin.from('users').select('*')
    return handleSupabaseResponse(result)
  }

  static async getUserByEmail(email) {
    if (!checkSupabaseConfig()) return { error: 'Database configuration not available' }
    
    const result = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .single()
    return handleSupabaseResponse(result)
  }

  static async createUser(userData) {
    const result = await supabaseAdmin.from('users').insert(userData).select().single()
    return handleSupabaseResponse(result)
  }

  static async updateUser(id, userData) {
    const result = await supabaseAdmin
      .from('users')
      .update(userData)
      .eq('id', id)
      .select()
      .single()
    return handleSupabaseResponse(result)
  }

  static async deleteUser(id) {
    const result = await supabaseAdmin.from('users').delete().eq('id', id)
    return handleSupabaseResponse(result)
  }

  // Doctors
  static async getDoctors() {
    if (!checkSupabaseConfig()) return { error: 'Database configuration not available' }
    
    const result = await supabaseAdmin.from('doctors').select('*').order('name')
    return handleSupabaseResponse(result)
  }

  static async getDoctorById(id) {
    if (!checkSupabaseConfig()) return { error: 'Database configuration not available' }
    
    const result = await supabaseAdmin
      .from('doctors')
      .select('*')
      .eq('id', id)
      .single()
    return handleSupabaseResponse(result)
  }

  static async getDoctorByEmail(email) {
    if (!checkSupabaseConfig()) return { error: 'Database configuration not available' }
    
    const result = await supabaseAdmin
      .from('doctors')
      .select('*')
      .eq('email', email)
      .single()
    return handleSupabaseResponse(result)
  }

  static async createDoctor(doctorData) {
    const result = await supabaseAdmin.from('doctors').insert(doctorData).select().single()
    return handleSupabaseResponse(result)
  }

  static async updateDoctor(id, doctorData) {
    const result = await supabaseAdmin
      .from('doctors')
      .update(doctorData)
      .eq('id', id)
      .select()
      .single()
    return handleSupabaseResponse(result)
  }

  static async deleteDoctor(id) {
    const result = await supabaseAdmin.from('doctors').delete().eq('id', id)
    return handleSupabaseResponse(result)
  }

  // Patients
  static async getPatients() {
    if (!checkSupabaseConfig()) return { error: 'Database configuration not available' }
    
    const result = await supabaseAdmin
      .from('patients')
      .select('*')
      .order('created_at', { ascending: false })
    return handleSupabaseResponse(result)
  }

  static async getPatientById(id) {
    if (!checkSupabaseConfig()) return { error: 'Database configuration not available' }
    
    const result = await supabaseAdmin
      .from('patients')
      .select('*')
      .eq('id', id)
      .single()
    return handleSupabaseResponse(result)
  }

  static async createPatient(patientData) {
    if (!checkSupabaseConfig()) return { error: 'Database configuration not available' }
    
    const result = await supabaseAdmin.from('patients').insert(patientData).select().single()
    return handleSupabaseResponse(result)
  }

  static async updatePatient(id, patientData) {
    const result = await supabaseAdmin
      .from('patients')
      .update(patientData)
      .eq('id', id)
      .select()
      .single()
    return handleSupabaseResponse(result)
  }

  static async deletePatient(id) {
    const result = await supabaseAdmin.from('patients').delete().eq('id', id)
    return handleSupabaseResponse(result)
  }

  // Appointments
  static async getAppointments() {
    if (!checkSupabaseConfig()) return { error: 'Database configuration not available' }
    
    const result = await supabaseAdmin
      .from('appointments')
      .select(`
        *,
        patients (id, name, email, phone, date_of_birth, address),
        doctors (id, name, specialty, phone)
      `)
      .order('date', { ascending: true })
      .order('time', { ascending: true })
    return handleSupabaseResponse(result)
  }

  static async getAppointmentsByDoctor(doctorId) {
    if (!checkSupabaseConfig()) return { error: 'Database configuration not available' }
    
    const result = await supabaseAdmin
      .from('appointments')
      .select(`
        *,
        patients (id, name, email, phone, date_of_birth, address),
        doctors (id, name, specialty, phone)
      `)
      .eq('doctor_id', doctorId)
      .order('date', { ascending: true })
      .order('time', { ascending: true })
    return handleSupabaseResponse(result)
  }

  static async getAppointmentById(id) {
    if (!checkSupabaseConfig()) return { error: 'Database configuration not available' }
    
    const result = await supabaseAdmin
      .from('appointments')
      .select(`
        *,
        patients (id, name, email, phone, date_of_birth, address),
        doctors (id, name, specialty, phone)
      `)
      .eq('id', id)
      .single()
    return handleSupabaseResponse(result)
  }

  static async createAppointment(appointmentData) {
    if (!checkSupabaseConfig()) return { error: 'Database configuration not available' }
    
    const result = await supabaseAdmin.from('appointments').insert(appointmentData).select().single()
    return handleSupabaseResponse(result)
  }

  static async updateAppointment(id, appointmentData) {
    if (!checkSupabaseConfig()) return { error: 'Database configuration not available' }
    
    const result = await supabaseAdmin
      .from('appointments')
      .update(appointmentData)
      .eq('id', id)
      .select()
      .single()
    return handleSupabaseResponse(result)
  }

  static async deleteAppointment(id) {
    if (!checkSupabaseConfig()) return { error: 'Database configuration not available' }
    
    const result = await supabaseAdmin.from('appointments').delete().eq('id', id)
    return handleSupabaseResponse(result)
  }

  // Helper method to get doctor by name (for role-based filtering)
  static async getDoctorByName(name) {
    if (!checkSupabaseConfig()) return { error: 'Database configuration not available' }
    
    const result = await supabaseAdmin
      .from('doctors')
      .select('id')
      .eq('name', name)
      .single()
    return handleSupabaseResponse(result)
  }

  // Prescriptions
  static async getPrescriptions() {
    if (!checkSupabaseConfig()) return { error: 'Database configuration not available' }
    
    const result = await supabaseAdmin
      .from('prescriptions')
      .select(`
        *,
        patients (id, name, email, phone),
        doctors (id, name, specialty, phone)
      `)
      .order('created_at', { ascending: false })
    return handleSupabaseResponse(result)
  }

  static async getPrescriptionById(id) {
    if (!checkSupabaseConfig()) return { error: 'Database configuration not available' }
    
    const result = await supabaseAdmin
      .from('prescriptions')
      .select(`
        *,
        patients (id, name, email, phone),
        doctors (id, name, specialty, phone)
      `)
      .eq('id', id)
      .single()
    return handleSupabaseResponse(result)
  }

  static async createPrescription(prescriptionData) {
    if (!checkSupabaseConfig()) return { error: 'Database configuration not available' }
    
    const result = await supabaseAdmin.from('prescriptions').insert(prescriptionData).select().single()
    return handleSupabaseResponse(result)
  }

  static async updatePrescription(id, prescriptionData) {
    if (!checkSupabaseConfig()) return { error: 'Database configuration not available' }
    
    const result = await supabaseAdmin
      .from('prescriptions')
      .update(prescriptionData)
      .eq('id', id)
      .select()
      .single()
    return handleSupabaseResponse(result)
  }

  static async deletePrescription(id) {
    if (!checkSupabaseConfig()) return { error: 'Database configuration not available' }
    
    const result = await supabaseAdmin.from('prescriptions').delete().eq('id', id)
    return handleSupabaseResponse(result)
  }

  // Billing
  static async getBilling() {
    if (!checkSupabaseConfig()) return { error: 'Database configuration not available' }
    
    const result = await supabaseAdmin
      .from('billing')
      .select(`
        *,
        patients (id, name, email, phone)
      `)
      .order('date', { ascending: false })
    return handleSupabaseResponse(result)
  }

  static async getBillingById(id) {
    if (!checkSupabaseConfig()) return { error: 'Database configuration not available' }
    
    const result = await supabaseAdmin
      .from('billing')
      .select(`
        *,
        patients (id, name, email, phone)
      `)
      .eq('id', id)
      .single()
    return handleSupabaseResponse(result)
  }

  static async createBilling(billingData) {
    if (!checkSupabaseConfig()) return { error: 'Database configuration not available' }
    
    const result = await supabaseAdmin.from('billing').insert(billingData).select().single()
    return handleSupabaseResponse(result)
  }

  static async updateBilling(id, billingData) {
    if (!checkSupabaseConfig()) return { error: 'Database configuration not available' }
    
    const result = await supabaseAdmin
      .from('billing')
      .update(billingData)
      .eq('id', id)
      .select()
      .single()
    return handleSupabaseResponse(result)
  }

  static async deleteBilling(id) {
    if (!checkSupabaseConfig()) return { error: 'Database configuration not available' }
    
    const result = await supabaseAdmin.from('billing').delete().eq('id', id)
    return handleSupabaseResponse(result)
  }

  // Complex queries
  static async getDoctorsWithAppointments() {
    if (!checkSupabaseConfig()) return { error: 'Database configuration not available' }
    
    // Get all doctors
    const doctorsResult = await this.getDoctors()
    if (doctorsResult.error) return doctorsResult
    
    const doctors = doctorsResult.data
    
    // Get appointments for each doctor
    for (let doctor of doctors) {
      const appointmentsResult = await supabaseAdmin
        .from('appointments')
        .select(`
          *,
          patients (id, name, email, phone)
        `)
        .eq('doctor_id', doctor.id)
        .order('date', { ascending: true })
        .order('time', { ascending: true })
      
      const appointments = handleSupabaseResponse(appointmentsResult)
      doctor.appointments = appointments.error ? [] : appointments.data
    }
    
    return { data: doctors }
  }
}

// Backward compatibility - maintain the old query function interface
export async function query(text, params = []) {
  throw new Error('Raw SQL queries are not supported with Supabase. Please use SupabaseService methods instead.')
}
