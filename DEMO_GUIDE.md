# Hospital Management System - Demo Guide

## 🏥 Application Overview
A comprehensive hospital management system built with Next.js, featuring patient management, doctor profiles, appointment scheduling, prescription tracking, and billing.

## 🔑 Demo Credentials

### Admin Access
- **Username:** admin@hospital.com
- **Password:** password123
- **Access:** Full system access

### Doctor Accounts
- **डॉ. अमित शर्मा (Dr. Amit Sharma):** doctor1@hospital.com / password123
- **डॉ. प्रिया पटेल (Dr. Priya Patel):** doctor2@hospital.com / password123  
- **डॉ. राहुल गुप्ता (Dr. Rahul Gupta):** doctor3@hospital.com / password123
- **डॉ. आदित्या सिंह (Dr. Aditya Singh):** doctor4@hospital.com / password123

### Receptionist
- **Username:** receptionist@hospital.com
- **Password:** password123
- **Access:** Patients, Appointments, Billing

## 🚀 Getting Started

1. **Start the application:**
   ```bash
   npm run dev
   ```

2. **Access the application:**
   - Open http://localhost:3000 (or 3001 if port 3000 is busy)
   - You'll be redirected to the login page

3. **Login with any demo account above**

## ✨ Features Overview

### 📊 Dashboard
- Role-based dashboard with statistics
- Quick access to all modules
- Recent activity overview

### 👥 Patient Management
- **View All Patients**: Browse complete patient list
- **Add New Patient**: Create patient profiles with contact info
- **Patient Details**: View complete patient information
- **Edit Patient**: Update patient details

### 👨‍⚕️ Doctor Management  
- **Doctor Profiles**: View all registered doctors
- **Doctor Details**: Complete doctor information
- **Specialization Tracking**: Track doctor specialties
- **Contact Information**: Email and phone details

### 📅 Appointment System
- **Schedule Appointments**: Book new appointments
- **View Appointments**: List all appointments with filters
- **Status Management**: Update appointment status (Scheduled/Completed/Cancelled)
- **Appointment Details**: View complete appointment information
- **Role-based Access**: Doctors see only their appointments

### 💊 Prescription Management
- **Create Prescriptions**: Add medications and dosage
- **View Prescriptions**: List all prescriptions with patient info
- **Prescription Details**: Complete prescription information
- **Medication Tracking**: JSON-based medication storage
- **Doctor Assignment**: Link prescriptions to doctors

### 💰 Billing System
- **Generate Bills**: Create bills for patients
- **Payment Tracking**: Track payment status (Paid/Pending/Overdue)
- **Bill Details**: Complete billing information
- **Status Updates**: Mark bills as paid or overdue
- **Patient Linking**: Connect bills to patient records

## 🔐 Role-Based Access Control

### Admin (admin@hospital.com)
- Full access to all modules
- Can manage patients, doctors, appointments, prescriptions, and billing
- Complete CRUD operations on all entities

### Doctor (doctor1@hospital.com, etc.)
- View their own appointments
- Create and manage prescriptions
- View patient information for their appointments

### Receptionist (receptionist@hospital.com)
- Manage patients and appointments
- Handle billing and payment processing
- Cannot access prescription management

## 🧪 Testing Workflows

### 1. Patient Management Flow
1. Login as Admin/Receptionist
2. Navigate to Patients → Add new patient
3. Fill in patient details and save
4. View patient in the list
5. Click "View" to see patient details
6. Edit patient information if needed

### 2. Appointment Scheduling Flow
1. Login as Admin/Receptionist
2. Navigate to Appointments → Add Appointment
3. Select patient and doctor
4. Set appointment date and time
5. View appointment in the list
6. Update appointment status as needed

### 3. Prescription Management Flow
1. Login as Doctor
2. Navigate to Prescriptions → Add Prescription
3. Select patient and add medications
4. Save prescription
5. View prescription details

### 4. Billing Process Flow
1. Login as Admin/Receptionist
2. Navigate to Billing → Add Bill
3. Select patient and enter amount
4. Save bill with pending status
5. Update payment status when paid

## 📱 Navigation Features

### Universal Navigation
- **Dashboard Icon**: Return to main dashboard
- **Module Icons**: Quick access to each section
- **User Profile**: Shows current user and role
- **Sign Out**: Secure logout functionality

### "View" Buttons
All list pages now have functional "View" buttons that navigate to detailed pages:
- Patient details with full contact information
- Doctor profiles with specialization details
- Appointment details with patient/doctor info
- Prescription details with medication breakdown
- Bill details with payment status and patient info

## 🛠️ Technical Features

### Database
- SQLite database with Prisma ORM
- Pre-seeded with demo data
- Relational data with proper foreign keys

### Authentication
- NextAuth.js with credential-based login
- Role-based access control
- Session management

### UI/UX
- Tailwind CSS for responsive design
- Modern gradient-based design
- Mobile-friendly interface
- Intuitive navigation

### API Routes
- RESTful API endpoints for all modules
- Dynamic routes for individual entity operations
- Proper error handling and validation

## 🎯 Demo Scenarios

### Scenario 1: New Patient Appointment
1. Login as Receptionist
2. Add new patient
3. Schedule appointment with available doctor
4. Generate bill for the consultation
5. Mark appointment as completed

### Scenario 2: Doctor Workflow
1. Login as Doctor (doctor1@hospital.com)
2. View assigned appointments
3. Complete consultation (mark as completed)
4. Create prescription for patient
5. Review patient history

### Scenario 3: Administrative Overview
1. Login as Admin
2. Review all patients and doctors
3. Monitor appointment schedules
4. Check billing status and payments
5. Generate reports and statistics

## 📋 Data Validation

### Pre-loaded Demo Data
- 4 patients with complete profiles
- 4 doctors with different specializations
- Sample appointments across different dates
- Prescriptions with various medications
- Bills in different payment states

### Data Relationships
- Appointments link patients and doctors
- Prescriptions connect patients and doctors
- Bills are associated with specific patients
- All relationships properly maintained

## 🔧 Troubleshooting

### Common Issues
1. **Port in use**: Server automatically selects next available port
2. **Login issues**: Use exact credentials from the demo list
3. **Permission errors**: Check user role for module access
4. **Data not loading**: Ensure database is seeded properly

### Reset Database
```bash
npm run db:reset
npm run db:seed
```

## 🎉 Success Indicators

✅ All CRUD operations working  
✅ Role-based access functioning  
✅ Navigation between modules seamless  
✅ "View" buttons lead to detail pages  
✅ Demo accounts accessible  
✅ Data relationships maintained  
✅ Payment status updates working  
✅ Appointment status changes functional  
✅ Prescription creation and viewing operational  

The system is now fully functional and ready for demonstration!
