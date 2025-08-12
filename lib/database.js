import { Pool } from 'pg';
import { initSQLiteDB, sqliteQuery } from './sqlite-db.js';

// Check if we're using SQLite for local development
function isUsingSQLite() {
  return process.env.DATABASE_URL?.startsWith('sqlite:');
}

let pool;
function getPool() {
  if (!isUsingSQLite()) {
    if (!pool) {
      // Create PostgreSQL connection pool
      pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
      });
    }
    return pool;
  }
  return null;
}

// Universal query function that works with both PostgreSQL and SQLite
export async function query(text, params = []) {
  if (isUsingSQLite()) {
    // Initialize SQLite DB if not already done
    try {
      await initSQLiteDB();
    } catch (error) {
      console.error('SQLite initialization error:', error);
    }
    
    // Convert PostgreSQL-style queries to SQLite-compatible ones
    let sqliteText = text
      .replace(/\$(\d+)/g, '?')  // Replace $1, $2, etc. with ?
      .replace(/SERIAL PRIMARY KEY/gi, 'INTEGER PRIMARY KEY AUTOINCREMENT')
      .replace(/RETURNING \*/gi, '')  // Remove RETURNING clauses
      .replace(/NOW\(\)/gi, 'CURRENT_TIMESTAMP')
      .replace(/::date/gi, '');  // Remove PostgreSQL date casting
    
    // Handle complex JSON aggregation queries specially
    if (sqliteText.includes('json_agg') && sqliteText.includes('json_build_object')) {
      return await handleComplexJsonQuery(sqliteText, params);
    }
    
    // Simple replacements for basic JSON functions
    sqliteText = sqliteText
      .replace(/json_agg\([^)]+\)/gi, 'NULL')  // Simplify JSON aggregation
      .replace(/json_build_object\([^)]+\)/gi, 'NULL'); // Simplify JSON objects
    
    console.log('SQLite Query:', sqliteText, 'Params:', params);
    return await sqliteQuery(sqliteText, params);
  } else {
    // Use PostgreSQL
    const pgPool = getPool();
    const client = await pgPool.connect();
    try {
      const result = await client.query(text, params);
      return result.rows;
    } finally {
      client.release();
    }
  }
}

// Handle complex JSON queries for SQLite
async function handleComplexJsonQuery(sqliteText, params) {
  // Special handling for doctors with appointments query
  if (sqliteText.includes('FROM doctors d') && sqliteText.includes('appointments')) {
    // Get all doctors
    const doctors = await sqliteQuery('SELECT * FROM doctors ORDER BY name', []);
    
    // For each doctor, get their appointments with patient details
    const doctorsWithAppointments = await Promise.all(
      doctors.map(async (doctor) => {
        const appointments = await sqliteQuery(`
          SELECT a.*, p.name as patient_name, p.email as patient_email, p.phone as patient_phone
          FROM appointments a
          LEFT JOIN patients p ON a.patient_id = p.id
          WHERE a.doctor_id = ?
          ORDER BY a.date DESC
        `, [doctor.id]);
        
        return {
          ...doctor,
          appointments: appointments.length > 0 ? appointments.map(apt => ({
            id: apt.id,
            date: apt.date,
            time: apt.time,
            status: apt.status,
            patient: {
              id: apt.patient_id,
              name: apt.patient_name,
              email: apt.patient_email,
              phone: apt.patient_phone
            }
          })) : []
        };
      })
    );
    
    return doctorsWithAppointments;
  }
  
  // Special handling for patients with appointments query
  if (sqliteText.includes('FROM patients p') && sqliteText.includes('appointments')) {
    // Get all patients
    const patients = await sqliteQuery('SELECT * FROM patients ORDER BY name', []);
    
    // For each patient, get their appointments with doctor details
    const patientsWithAppointments = await Promise.all(
      patients.map(async (patient) => {
        const appointments = await sqliteQuery(`
          SELECT a.*, d.name as doctor_name, d.specialty as doctor_specialty, d.phone as doctor_phone
          FROM appointments a
          LEFT JOIN doctors d ON a.doctor_id = d.id
          WHERE a.patient_id = ?
          ORDER BY a.date DESC
        `, [patient.id]);
        
        return {
          ...patient,
          appointments: appointments.length > 0 ? appointments.map(apt => ({
            id: apt.id,
            date: apt.date,
            time: apt.time,
            status: apt.status,
            doctor: {
              id: apt.doctor_id,
              name: apt.doctor_name,
              specialty: apt.doctor_specialty,
              phone: apt.doctor_phone
            }
          })) : []
        };
      })
    );
    
    return patientsWithAppointments;
  }
  
  // Default fallback - just return empty result
  return [];
}

const schema = `
  -- Users table
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- Doctors table
  CREATE TABLE IF NOT EXISTS doctors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    specialization VARCHAR(100) NOT NULL,
    experience INTEGER NOT NULL,
    qualification TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- Patients table
  CREATE TABLE IF NOT EXISTS patients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20) NOT NULL,
    address TEXT NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(10) NOT NULL,
    blood_group VARCHAR(5),
    emergency_contact VARCHAR(20) NOT NULL,
    medical_history TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- Appointments table
  CREATE TABLE IF NOT EXISTS appointments (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(id),
    doctor_id INTEGER REFERENCES doctors(id),
    appointment_date TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'scheduled',
    reason TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- Prescriptions table
  CREATE TABLE IF NOT EXISTS prescriptions (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(id),
    doctor_id INTEGER REFERENCES doctors(id),
    diagnosis VARCHAR(255) NOT NULL,
    medications TEXT NOT NULL,
    frequency VARCHAR(100) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- Billing table
  CREATE TABLE IF NOT EXISTS billing (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(id),
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    payment_status VARCHAR(20) DEFAULT 'pending',
    bill_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`;

// Initialize database
export async function initializeDatabase() {
  try {
    if (isUsingSQLite()) {
      // For SQLite, use the initSQLiteDB function
      await initSQLiteDB();
      console.log('SQLite database initialized successfully');
      return true;
    } else {
      const pgPool = getPool();
      await pgPool.query(schema);
      console.log('Database schema initialized successfully');
      return true;
    }
  } catch (error) {
    console.error('Database initialization error:', error);
    return false;
  }
}

// Seed data with existing records
export async function seedDatabase() {
  try {
    if (isUsingSQLite()) {
      // For SQLite, the data is already seeded in initSQLiteDB
      console.log('SQLite database already contains demo data');
      return;
    }
    
    // Check if data already exists
    const userCount = await query('SELECT COUNT(*) FROM users');
    if (parseInt(userCount[0].count) > 0) {
      console.log('Database already seeded');
      return;
    }

    // Insert Users (preserving the exact data)
    await query(`
      INSERT INTO users (name, email, password, role) VALUES 
      ('Ravi Kumar', 'admin@hospital.com', '$2b$10$5MrAILD765bZJQSOkYIOPONF06h270iiJEQAO1XOkFcNWg9BhxxDG', 'admin'),
      ('Dr. Rajesh Reddy', 'doctor1@hospital.com', '$2b$10$5MrAILD765bZJQSOkYIOPONF06h270iiJEQAO1XOkFcNWg9BhxxDG', 'doctor'),
      ('Dr. Priya Nair', 'doctor2@hospital.com', '$2b$10$5MrAILD765bZJQSOkYIOPONF06h270iiJEQAO1XOkFcNWg9BhxxDG', 'doctor'),
      ('Dr. Arjun Menon', 'doctor3@hospital.com', '$2b$10$5MrAILD765bZJQSOkYIOPONF06h270iiJEQAO1XOkFcNWg9BhxxDG', 'doctor'),
      ('Dr. Kavya Iyer', 'doctor4@hospital.com', '$2b$10$5MrAILD765bZJQSOkYIOPONF06h270iiJEQAO1XOkFcNWg9BhxxDG', 'doctor'),
      ('Lakshmi Pillai', 'receptionist@hospital.com', '$2b$10$5MrAILD765bZJQSOkYIOPONF06h270iiJEQAO1XOkFcNWg9BhxxDG', 'receptionist')
    `);

    // Insert Doctors
    await query(`
      INSERT INTO doctors (name, email, phone, specialization, experience, qualification) VALUES 
      ('Dr. Rajesh Reddy', 'dr.rajesh.reddy@hospital.com', '+91-9876543210', 'Cardiology', 15, 'MBBS, MD (Cardiology)'),
      ('Dr. Priya Nair', 'dr.priya.nair@hospital.com', '+91-9876543211', 'Pediatrics', 10, 'MBBS, MD (Pediatrics)'),
      ('Dr. Arjun Menon', 'dr.arjun.menon@hospital.com', '+91-9876543212', 'Orthopedics', 12, 'MBBS, MS (Orthopedics)'),
      ('Dr. Kavya Iyer', 'dr.kavya.iyer@hospital.com', '+91-9876543213', 'Dermatology', 8, 'MBBS, MD (Dermatology)')
    `);

    // Insert Patients
    await query(`
      INSERT INTO patients (name, email, phone, address, date_of_birth, gender, blood_group, emergency_contact, medical_history) VALUES 
      ('Meera Krishnan', 'meera.krishnan@email.com', '+91-9123456789', '123 MG Road, Bangalore - 560001', '1985-03-15', 'Female', 'A+', '+91-9123456790', 'No known allergies, previous surgery in 2020'),
      ('Suresh Babu', 'suresh.babu@email.com', '+91-9123456791', '456 Anna Nagar, Chennai - 600040', '1978-07-22', 'Male', 'B+', '+91-9123456792', 'Diabetic, takes regular medication'),
      ('Deepika Rao', 'deepika.rao@email.com', '+91-9123456793', '789 Koramangala, Bangalore - 560034', '1992-11-08', 'Female', 'O-', '+91-9123456794', 'Healthy, no known medical conditions')
    `);

    // Insert Appointments
    await query(`
      INSERT INTO appointments (patient_id, doctor_id, appointment_date, status) VALUES 
      (1, 1, '2025-08-15 10:00:00', 'scheduled'),
      (2, 2, '2025-08-16 14:30:00', 'completed')
    `);

    // Insert Prescriptions  
    await query(`
      INSERT INTO prescriptions (patient_id, doctor_id, diagnosis, medications, frequency, notes) VALUES 
      (1, 1, 'Common Cold', '[{"name":"Amoxicillin","dosage":"500mg","frequency":"Three times daily","duration":"7 days","instructions":"Take after meals"}]', 'Three times daily', 'Rest and plenty of fluids')
    `);

    // Insert Billing
    await query(`
      INSERT INTO billing (patient_id, amount, payment_status) VALUES 
      (1, 1500.00, 'paid'),
      (2, 2000.00, 'paid')
    `);

    console.log('Database seeded successfully with existing data');
  } catch (error) {
    console.error('Database seeding error:', error);
  }
}

export default pool;
