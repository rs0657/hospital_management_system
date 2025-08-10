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
      name: 'Ravi Kumar',
      email: 'admin@hospital.com',
      password: hashedPassword,
      role: 'admin',
    },
  });

  const doctor1 = await prisma.user.create({
    data: {
      name: 'Dr. Rajesh Reddy',
      email: 'doctor1@hospital.com',
      password: hashedPassword,
      role: 'doctor',
    },
  });

  const doctor2 = await prisma.user.create({
    data: {
      name: 'Dr. Priya Nair',
      email: 'doctor2@hospital.com',
      password: hashedPassword,
      role: 'doctor',
    },
  });

  const doctor3 = await prisma.user.create({
    data: {
      name: 'Dr. Arjun Menon',
      email: 'doctor3@hospital.com',
      password: hashedPassword,
      role: 'doctor',
    },
  });

  const doctor4 = await prisma.user.create({
    data: {
      name: 'Dr. Kavya Iyer',
      email: 'doctor4@hospital.com',
      password: hashedPassword,
      role: 'doctor',
    },
  });

  const receptionist = await prisma.user.create({
    data: {
      name: 'Lakshmi Pillai',
      email: 'receptionist@hospital.com',
      password: hashedPassword,
      role: 'receptionist',
    },
  });

  // Create doctors
  const doctorRecord1 = await prisma.doctor.create({
    data: {
      name: 'Dr. Rajesh Reddy',
      email: 'dr.rajesh.reddy@hospital.com',
      phone: '+91-9876543210',
      specialization: 'Cardiology',
      experience: 15,
      qualification: 'MBBS, MD (Cardiology)',
    },
  });

  const doctorRecord2 = await prisma.doctor.create({
    data: {
      name: 'Dr. Priya Nair',
      email: 'dr.priya.nair@hospital.com',
      phone: '+91-9876543211',
      specialization: 'Pediatrics',
      experience: 10,
      qualification: 'MBBS, MD (Pediatrics)',
    },
  });

  const doctorRecord3 = await prisma.doctor.create({
    data: {
      name: 'Dr. Arjun Menon',
      email: 'dr.arjun.menon@hospital.com',
      phone: '+91-9876543212',
      specialization: 'Orthopedics',
      experience: 12,
      qualification: 'MBBS, MS (Orthopedics)',
    },
  });

  const doctorRecord4 = await prisma.doctor.create({
    data: {
      name: 'Dr. Kavya Iyer',
      email: 'dr.kavya.iyer@hospital.com',
      phone: '+91-9876543213',
      specialization: 'Dermatology',
      experience: 8,
      qualification: 'MBBS, MD (Dermatology)',
    },
  });

  // Create patients
  const patient1 = await prisma.patient.create({
    data: {
      name: 'Meera Krishnan',
      email: 'meera.krishnan@email.com',
      phone: '+91-9123456789',
      address: '123 MG Road, Bangalore - 560001',
      dateOfBirth: new Date('1985-03-15'),
      gender: 'Female',
      bloodGroup: 'A+',
      emergencyContact: '+91-9123456790',
      medicalHistory: 'No known allergies, previous surgery in 2020',
    },
  });

  const patient2 = await prisma.patient.create({
    data: {
      name: 'Suresh Babu',
      email: 'suresh.babu@email.com',
      phone: '+91-9123456791',
      address: '456 Anna Nagar, Chennai - 600040',
      dateOfBirth: new Date('1978-07-22'),
      gender: 'Male',
      bloodGroup: 'B+',
      emergencyContact: '+91-9123456792',
      medicalHistory: 'Diabetic, takes regular medication',
    },
  });

  const patient3 = await prisma.patient.create({
    data: {
      name: 'Deepika Rao',
      email: 'deepika.rao@email.com',
      phone: '+91-9123456793',
      address: '789 Koramangala, Bangalore - 560034',
      dateOfBirth: new Date('1992-11-08'),
      gender: 'Female',
      bloodGroup: 'O-',
      emergencyContact: '+91-9123456794',
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
      amount: 1500.00,
      paymentStatus: 'pending',
      billDate: new Date(),
    },
  });

  await prisma.billing.create({
    data: {
      patientId: patient2.id,
      amount: 2000.00,
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
