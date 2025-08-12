import { promisify } from 'util';

let sqlite3;
let db;
let dbRun, dbGet, dbAll;

// Initialize SQLite only on server side
async function initSQLiteConnection() {
  if (typeof window !== 'undefined') return; // Skip on client side
  
  if (!sqlite3) {
    const sqlite3Module = await import('sqlite3');
    sqlite3 = sqlite3Module.default;
    
    // Create SQLite database for local development
    db = new sqlite3.Database('./temp_dev.db');
    
    // Promisify database methods
    dbRun = promisify(db.run.bind(db));
    dbGet = promisify(db.get.bind(db));
    dbAll = promisify(db.all.bind(db));
  }
}

// Initialize database with tables and demo data
export async function initSQLiteDB() {
  if (typeof window !== 'undefined') return; // Skip on client side
  
  try {
    await initSQLiteConnection();
    
    const bcrypt = await import('bcryptjs');
    // Create tables
    await dbRun(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await dbRun(`
      CREATE TABLE IF NOT EXISTS doctors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        specialty TEXT NOT NULL,
        phone TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await dbRun(`
      CREATE TABLE IF NOT EXISTS patients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT NOT NULL,
        date_of_birth DATE,
        address TEXT,
        gender TEXT,
        blood_group TEXT,
        emergency_contact TEXT,
        medical_history TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await dbRun(`
      CREATE TABLE IF NOT EXISTS appointments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER NOT NULL,
        doctor_id INTEGER NOT NULL,
        date DATE NOT NULL,
        time TEXT NOT NULL,
        status TEXT DEFAULT 'scheduled',
        reason TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients(id),
        FOREIGN KEY (doctor_id) REFERENCES doctors(id)
      )
    `);

    await dbRun(`
      CREATE TABLE IF NOT EXISTS prescriptions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER NOT NULL,
        doctor_id INTEGER NOT NULL,
        diagnosis TEXT NOT NULL,
        medications TEXT NOT NULL,
        frequency TEXT NOT NULL,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients(id),
        FOREIGN KEY (doctor_id) REFERENCES doctors(id)
      )
    `);

    await dbRun(`
      CREATE TABLE IF NOT EXISTS billing (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        payment_status TEXT DEFAULT 'pending',
        description TEXT,
        date DATE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients(id)
      )
    `);

    // Check if users already exist
    const existingUsers = await dbAll('SELECT COUNT(*) as count FROM users');
    
    if (existingUsers[0].count === 0) {
      // Insert demo users with hashed passwords
      const adminPassword = await bcrypt.default.hash('admin123', 10);
      const doctorPassword = await bcrypt.default.hash('doctor123', 10);
      const receptionistPassword = await bcrypt.default.hash('receptionist123', 10);

      await dbRun('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', 
        ['Admin User', 'admin@hospital.com', adminPassword, 'admin']);
      
      await dbRun('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', 
        ['Dr. Rajesh Reddy', 'doctor1@hospital.com', doctorPassword, 'doctor']);
      
      await dbRun('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', 
        ['Reception Staff', 'receptionist@hospital.com', receptionistPassword, 'receptionist']);

      // Insert demo doctors
      await dbRun('INSERT INTO doctors (name, specialty, phone) VALUES (?, ?, ?)', 
        ['Dr. Rajesh Reddy', 'Cardiologist', '+91-9876543210']);
      
      await dbRun('INSERT INTO doctors (name, specialty, phone) VALUES (?, ?, ?)', 
        ['Dr. Priya Nair', 'Pediatrician', '+91-9876543211']);

      // Insert demo patients
      await dbRun('INSERT INTO patients (name, email, phone, date_of_birth, address, gender) VALUES (?, ?, ?, ?, ?, ?)', 
        ['Ravi Kumar', 'ravi.kumar@email.com', '+91-9876543212', '1990-05-15', 'Chennai, Tamil Nadu', 'Male']);
      
      await dbRun('INSERT INTO patients (name, email, phone, date_of_birth, address, gender) VALUES (?, ?, ?, ?, ?, ?)', 
        ['Lakshmi Devi', 'lakshmi.devi@email.com', '+91-9876543213', '1985-08-22', 'Bangalore, Karnataka', 'Female']);

      console.log('✅ SQLite database initialized with demo data');
    }

  } catch (error) {
    console.error('❌ Error initializing SQLite database:', error);
    throw error;
  }
}

// SQLite query function
export async function sqliteQuery(sql, params = []) {
  if (typeof window !== 'undefined') return []; // Skip on client side
  
  try {
    await initSQLiteConnection();
    
    if (sql.trim().toLowerCase().startsWith('select')) {
      return await dbAll(sql, params);
    } else {
      const result = await dbRun(sql, params);
      // For INSERT statements, return the inserted row
      if (sql.trim().toLowerCase().startsWith('insert')) {
        const lastId = result.lastID;
        if (sql.includes('RETURNING')) {
          // Simulate RETURNING clause for SQLite
          return [{ id: lastId }];
        }
        return [{ id: lastId }];
      }
      return result;
    }
  } catch (error) {
    console.error('SQLite Query Error:', error);
    throw error;
  }
}

export { db };
