import { Pool } from 'pg';

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Database schema - will be created if not exists
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
    await pool.query(schema);
    console.log('Database schema initialized successfully');
    return true;
  } catch (error) {
    console.error('Database initialization error:', error);
    return false;
  }
}

// Seed data with existing records
export async function seedDatabase() {
  try {
    // Check if data already exists
    const userCount = await pool.query('SELECT COUNT(*) FROM users');
    if (parseInt(userCount.rows[0].count) > 0) {
      console.log('Database already seeded');
      return;
    }

    // Insert Users (preserving the exact data)
    await pool.query(`
      INSERT INTO users (name, email, password, role) VALUES 
      ('Ravi Kumar', 'admin@hospital.com', '$2b$10$5MrAILD765bZJQSOkYIOPONF06h270iiJEQAO1XOkFcNWg9BhxxDG', 'admin'),
      ('Dr. Rajesh Reddy', 'doctor1@hospital.com', '$2b$10$5MrAILD765bZJQSOkYIOPONF06h270iiJEQAO1XOkFcNWg9BhxxDG', 'doctor'),
      ('Dr. Priya Nair', 'doctor2@hospital.com', '$2b$10$5MrAILD765bZJQSOkYIOPONF06h270iiJEQAO1XOkFcNWg9BhxxDG', 'doctor'),
      ('Dr. Arjun Menon', 'doctor3@hospital.com', '$2b$10$5MrAILD765bZJQSOkYIOPONF06h270iiJEQAO1XOkFcNWg9BhxxDG', 'doctor'),
      ('Dr. Kavya Iyer', 'doctor4@hospital.com', '$2b$10$5MrAILD765bZJQSOkYIOPONF06h270iiJEQAO1XOkFcNWg9BhxxDG', 'doctor'),
      ('Lakshmi Pillai', 'receptionist@hospital.com', '$2b$10$5MrAILD765bZJQSOkYIOPONF06h270iiJEQAO1XOkFcNWg9BhxxDG', 'receptionist')
    `);

    // Insert Doctors
    await pool.query(`
      INSERT INTO doctors (name, email, phone, specialization, experience, qualification) VALUES 
      ('Dr. Rajesh Reddy', 'dr.rajesh.reddy@hospital.com', '+91-9876543210', 'Cardiology', 15, 'MBBS, MD (Cardiology)'),
      ('Dr. Priya Nair', 'dr.priya.nair@hospital.com', '+91-9876543211', 'Pediatrics', 10, 'MBBS, MD (Pediatrics)'),
      ('Dr. Arjun Menon', 'dr.arjun.menon@hospital.com', '+91-9876543212', 'Orthopedics', 12, 'MBBS, MS (Orthopedics)'),
      ('Dr. Kavya Iyer', 'dr.kavya.iyer@hospital.com', '+91-9876543213', 'Dermatology', 8, 'MBBS, MD (Dermatology)')
    `);

    // Insert Patients
    await pool.query(`
      INSERT INTO patients (name, email, phone, address, date_of_birth, gender, blood_group, emergency_contact, medical_history) VALUES 
      ('Meera Krishnan', 'meera.krishnan@email.com', '+91-9123456789', '123 MG Road, Bangalore - 560001', '1985-03-15', 'Female', 'A+', '+91-9123456790', 'No known allergies, previous surgery in 2020'),
      ('Suresh Babu', 'suresh.babu@email.com', '+91-9123456791', '456 Anna Nagar, Chennai - 600040', '1978-07-22', 'Male', 'B+', '+91-9123456792', 'Diabetic, takes regular medication'),
      ('Deepika Rao', 'deepika.rao@email.com', '+91-9123456793', '789 Koramangala, Bangalore - 560034', '1992-11-08', 'Female', 'O-', '+91-9123456794', 'Healthy, no known medical conditions')
    `);

    // Insert Appointments
    await pool.query(`
      INSERT INTO appointments (patient_id, doctor_id, appointment_date, status) VALUES 
      (1, 1, '2025-08-15 10:00:00', 'scheduled'),
      (2, 2, '2025-08-16 14:30:00', 'completed')
    `);

    // Insert Prescriptions  
    await pool.query(`
      INSERT INTO prescriptions (patient_id, doctor_id, diagnosis, medications, frequency, notes) VALUES 
      (1, 1, 'Common Cold', '[{"name":"Amoxicillin","dosage":"500mg","frequency":"Three times daily","duration":"7 days","instructions":"Take after meals"}]', 'Three times daily', 'Rest and plenty of fluids')
    `);

    // Insert Billing
    await pool.query(`
      INSERT INTO billing (patient_id, amount, payment_status) VALUES 
      (1, 1500.00, 'paid'),
      (2, 2000.00, 'paid')
    `);

    console.log('Database seeded successfully with existing data');
  } catch (error) {
    console.error('Database seeding error:', error);
  }
}

// Query helper function
export async function query(text, params) {
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

export default pool;
