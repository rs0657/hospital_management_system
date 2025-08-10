# Hospital Management System - Login Credentials

## Demo Accounts

All accounts use the password: **password123**

### Admin Account
- **Email:** admin@hospital.com
- **Password:** password123
- **Role:** Administrator
- **Access:** Full system access

### Doctor Accounts
1. **Dr. John Smith**
   - **Email:** doctor1@hospital.com
   - **Password:** password123
   - **Specialization:** Cardiology

2. **Dr. Sarah Johnson**
   - **Email:** doctor2@hospital.com
   - **Password:** password123
   - **Specialization:** Pediatrics

3. **Dr. Michael Brown**
   - **Email:** doctor3@hospital.com
   - **Password:** password123
   - **Specialization:** Orthopedics

4. **Dr. Emily Davis**
   - **Email:** doctor4@hospital.com
   - **Password:** password123
   - **Specialization:** Dermatology

### Receptionist Account
- **Email:** receptionist@hospital.com
- **Password:** password123
- **Role:** Receptionist
- **Access:** Patients, Appointments, Billing

## System Features

### ✅ Working Features
- **Authentication:** Role-based login system
- **Patients:** Add, view, and manage patient records
- **Doctors:** Add, view, and manage doctor profiles
- **Appointments:** Create, schedule, and update appointment status
- **Prescriptions:** Create and manage prescriptions with multiple medications
- **Billing:** Generate invoices and track payment status
- **Role-based Access Control:** Different permissions for different user roles

### 🔧 Recently Fixed Issues
- **Appointment Status Updates:** Complete/Cancel buttons now work
- **Field Name Mismatches:** Fixed database field references
- **API Routes:** Added missing dynamic routes for individual records
- **Detail Pages:** Added view pages for appointments, patients, and doctors
- **Prescriptions:** Fixed to work with current database schema
- **Additional Doctor Accounts:** Added 3 more doctor login accounts

### 📋 Available Actions by Role

#### Admin
- Full access to all modules
- Can add/edit/delete all records
- View all appointments and prescriptions
- Manage billing and payments

#### Doctor
- View and manage own appointments
- Create and manage prescriptions
- Update appointment status (complete/cancel)
- Limited access to patient information

#### Receptionist
- Manage patients and appointments
- Handle billing and invoices
- No access to prescriptions or doctor management

## Quick Start
1. Start the development server: `npm run dev`
2. Open http://localhost:3001 in your browser
3. Login with any of the accounts above
4. Test different roles and their permissions

## Database
The system includes sample data:
- 3 patients with complete medical records
- 4 doctors with different specializations
- Sample appointments and prescriptions
- Billing records with different payment statuses
