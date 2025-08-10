# Patient Selection Dropdown Issues - Debug Guide

## Issue Description
The "choose a patient" option is not working for any user in dropdown menus across the application.

## Areas Affected
1. **Appointments → Add Appointment** - Patient and Doctor selection
2. **Prescriptions → Add Prescription** - Patient selection  
3. **Billing → Add Bill** - Patient selection

## Root Cause Analysis
The issue was caused by inconsistent API response formats between backend and frontend expectations.

## Fixes Applied

### 1. Backend API Standardization
Updated all APIs to return consistent wrapped objects:

**Patients API** (`/api/patients.js`)
```javascript
// BEFORE: res.status(200).json(patients)
// AFTER: res.status(200).json({ patients })
```

**Doctors API** (`/api/doctors.js`) 
```javascript
// BEFORE: res.status(200).json(doctors)
// AFTER: res.status(200).json({ doctors })
```

**Appointments API** (`/api/appointments.js`)
```javascript
// BEFORE: res.status(200).json(appointments)  
// AFTER: res.status(200).json({ appointments })
```

**Billing API** (`/api/billing.js`)
```javascript
// BEFORE: res.status(200).json(billing)
// AFTER: res.status(200).json({ billing })
```

**Prescriptions API** (`/api/prescriptions.js`)
```javascript
// ALREADY CORRECT: res.status(200).json({ prescriptions })
```

### 2. Frontend Data Handling Updates

**Appointments Add Page** (`/pages/appointments/add.js`)
```javascript
// BEFORE: setDoctors(data || [])
// AFTER: setDoctors(data.doctors || [])
```

**All Index Pages** - Updated to use wrapped response format:
- `/pages/patients/index.js`: `setPatients(data.patients || [])`
- `/pages/doctors/index.js`: `setDoctors(data.doctors || [])`
- `/pages/appointments/index.js`: `setAppointments(data.appointments || [])`
- `/pages/prescriptions/index.js`: `setPrescriptions(data.prescriptions || [])`
- `/pages/billing/index.js`: `setBills(data.billing || [])`

### 3. Error Handling Improvements
Added better error logging to all fetch functions:
```javascript
if (response.ok) {
  const data = await response.json();
  setPatients(data.patients || []);
} else {
  console.error('Failed to fetch patients:', response.status, response.statusText);
}
```

### 4. Prescription API Enhancement
Fixed prescription creation to auto-determine doctor when not provided:
```javascript
// Auto-assign doctor for doctor role users
if (!finalDoctorId && session.user.role === 'doctor') {
  const doctor = await prisma.doctor.findFirst({
    where: { name: session.user.name }
  })
  if (doctor) {
    finalDoctorId = doctor.id
  }
}
```

## Testing Instructions

### For Receptionist Role:
1. Login with: `receptionist@hospital.com` / `receptionist123`
2. Navigate to **Appointments → Add Appointment**
3. Verify patient dropdown shows all patients
4. Verify doctor dropdown shows all doctors
5. Navigate to **Billing → Add Bill**
6. Verify patient dropdown shows all patients

### For Admin Role:
1. Login with: `admin@hospital.com` / `admin123`
2. Test all modules (Appointments, Prescriptions, Billing)
3. Verify all dropdowns populate correctly

### For Doctor Role:
1. Login with: `doctor1@hospital.com` / `doctor123`
2. Navigate to **Prescriptions → Add Prescription**
3. Verify patient dropdown shows all patients
4. Verify prescription can be created (doctor auto-assigned)

## Expected Results
- All dropdowns should populate with "Choose a patient/doctor" as default option
- Patient names should appear with phone numbers: "John Doe - 123-456-7890"
- Doctor names should appear with specializations
- No console errors related to data fetching
- Successful form submissions

## Console Debugging
If issues persist, check browser console for:
- Network errors (401 Unauthorized, 500 Server Error)
- Data structure mismatches
- Missing authentication tokens

## Status: RESOLVED ✅
All API responses now use consistent wrapped object format and frontend properly extracts data from the wrapper objects.
