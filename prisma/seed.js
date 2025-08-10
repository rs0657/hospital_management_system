const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.billing.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@hospital.com',
      password: hashedPassword,
      role: 'admin',
    },
  });

  const doctor1 = await prisma.user.create({
    data: {
      name: 'Dr. John Smith',
      email: 'doctor1@hospital.com',
      password: hashedPassword,
      role: 'doctor',
    },
  });

  const doctor2 = await prisma.user.create({
    data: {
      name: 'Dr. Sarah Johnson',
      email: 'doctor2@hospital.com',
      password: hashedPassword,
      role: 'doctor',
    },
  });

  const receptionist = await prisma.user.create({
    data: {
      name: 'Jane Doe',
      email: 'receptionist@hospital.com',
      password: hashedPassword,
      role: 'receptionist',
    },
  });

  // Create doctors
  const doctorRecord1 = await prisma.doctor.create({
    data: {
      name: 'Dr. John Smith',
      email: 'dr.john.smith@hospital.com',
      phone: '+1-555-0101',
      specialization: 'Cardiology',
      experience: 15,
      qualification: 'MBBS, MD (Cardiology)',
    },
  });

  const doctorRecord2 = await prisma.doctor.create({
    data: {
      name: 'Dr. Sarah Johnson',
      email: 'dr.sarah.johnson@hospital.com',
      phone: '+1-555-0102',
      specialization: 'Pediatrics',
      experience: 10,
      qualification: 'MBBS, MD (Pediatrics)',
    },
  });

  const doctorRecord3 = await prisma.doctor.create({
    data: {
      name: 'Dr. Michael Brown',
      email: 'dr.michael.brown@hospital.com',
      phone: '+1-555-0103',
      specialization: 'Orthopedics',
      experience: 12,
      qualification: 'MBBS, MS (Orthopedics)',
    },
  });

  // Create patients
  const patient1 = await prisma.patient.create({
    data: {
      name: 'Alice Williams',
      email: 'alice.williams@email.com',
      phone: '+1-555-0201',
      address: '123 Main St, City, State 12345',
      dateOfBirth: new Date('1985-03-15'),
      gender: 'Female',
      bloodGroup: 'A+',
      emergencyContact: '+1-555-0301',
      medicalHistory: 'No known allergies, previous surgery in 2020',
    },
  });

  const patient2 = await prisma.patient.create({
    data: {
      name: 'Bob Johnson',
      email: 'bob.johnson@email.com',
      phone: '+1-555-0202',
      address: '456 Oak Ave, City, State 12345',
      dateOfBirth: new Date('1978-07-22'),
      gender: 'Male',
      bloodGroup: 'B+',
      emergencyContact: '+1-555-0302',
      medicalHistory: 'Diabetic, takes regular medication',
    },
  });

  const patient3 = await prisma.patient.create({
    data: {
      name: 'Carol Davis',
      email: 'carol.davis@email.com',
      phone: '+1-555-0203',
      address: '789 Pine Rd, City, State 12345',
      dateOfBirth: new Date('1992-11-08'),
      gender: 'Female',
      bloodGroup: 'O-',
      emergencyContact: '+1-555-0303',
      medicalHistory: 'Healthy, no known medical conditions',
    },
  });

  // Create appointments
  const appointment1 = await prisma.appointment.create({
    data: {
      patientId: patient1.id,
      doctorId: doctorRecord1.id,
      appointmentDate: new Date('2025-08-15T10:00:00Z'),
      status: 'scheduled',
    },
  });

  const appointment2 = await prisma.appointment.create({
    data: {
      patientId: patient2.id,
      doctorId: doctorRecord2.id,
      appointmentDate: new Date('2025-08-16T14:30:00Z'),
      status: 'completed',
    },
  });

  // Create prescriptions
  await prisma.prescription.create({
    data: {
      patientId: patient1.id,
      doctorId: doctorRecord1.id,
      diagnosis: 'Common Cold',
      medications: JSON.stringify([
        {
          name: 'Amoxicillin',
          dosage: '500mg',
          frequency: 'Three times daily',
          duration: '7 days',
          instructions: 'Take after meals'
        }
      ]),
      frequency: 'Three times daily',
      notes: 'Rest and plenty of fluids',
    },
  });

  // Create billing records
  await prisma.billing.create({
    data: {
      patientId: patient1.id,
      amount: 150.00,
      paymentStatus: 'pending',
      billDate: new Date(),
    },
  });

  await prisma.billing.create({
    data: {
      patientId: patient2.id,
      amount: 200.00,
      paymentStatus: 'paid',
      billDate: new Date(),
    },
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
