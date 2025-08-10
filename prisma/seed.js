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
      name: 'राम कुमार (Ram Kumar)',
      email: 'admin@hospital.com',
      password: hashedPassword,
      role: 'admin',
    },
  });

  const doctor1 = await prisma.user.create({
    data: {
      name: 'डॉ. अमित शर्मा (Dr. Amit Sharma)',
      email: 'doctor1@hospital.com',
      password: hashedPassword,
      role: 'doctor',
    },
  });

  const doctor2 = await prisma.user.create({
    data: {
      name: 'डॉ. प्रिया पटेल (Dr. Priya Patel)',
      email: 'doctor2@hospital.com',
      password: hashedPassword,
      role: 'doctor',
    },
  });

  const doctor3 = await prisma.user.create({
    data: {
      name: 'डॉ. राहुल गुप्ता (Dr. Rahul Gupta)',
      email: 'doctor3@hospital.com',
      password: hashedPassword,
      role: 'doctor',
    },
  });

  const doctor4 = await prisma.user.create({
    data: {
      name: 'डॉ. आदित्या सिंह (Dr. Aditya Singh)',
      email: 'doctor4@hospital.com',
      password: hashedPassword,
      role: 'doctor',
    },
  });

  const receptionist = await prisma.user.create({
    data: {
      name: 'अंजलि वर्मा (Anjali Verma)',
      email: 'receptionist@hospital.com',
      password: hashedPassword,
      role: 'receptionist',
    },
  });

  // Create doctors
  const doctorRecord1 = await prisma.doctor.create({
    data: {
      name: 'डॉ. अमित शर्मा (Dr. Amit Sharma)',
      email: 'dr.amit.sharma@hospital.com',
      phone: '+91-9876543210',
      specialization: 'Cardiology',
      experience: 15,
      qualification: 'MBBS, MD (Cardiology)',
    },
  });

  const doctorRecord2 = await prisma.doctor.create({
    data: {
      name: 'डॉ. प्रिया पटेल (Dr. Priya Patel)',
      email: 'dr.priya.patel@hospital.com',
      phone: '+91-9876543211',
      specialization: 'Pediatrics',
      experience: 10,
      qualification: 'MBBS, MD (Pediatrics)',
    },
  });

  const doctorRecord3 = await prisma.doctor.create({
    data: {
      name: 'डॉ. राहुल गुप्ता (Dr. Rahul Gupta)',
      email: 'dr.rahul.gupta@hospital.com',
      phone: '+91-9876543212',
      specialization: 'Orthopedics',
      experience: 12,
      qualification: 'MBBS, MS (Orthopedics)',
    },
  });

  const doctorRecord4 = await prisma.doctor.create({
    data: {
      name: 'डॉ. आदित्या सिंह (Dr. Aditya Singh)',
      email: 'dr.aditya.singh@hospital.com',
      phone: '+91-9876543213',
      specialization: 'Dermatology',
      experience: 8,
      qualification: 'MBBS, MD (Dermatology)',
    },
  });

  // Create patients
  const patient1 = await prisma.patient.create({
    data: {
      name: 'आशा शर्मा (Asha Sharma)',
      email: 'asha.sharma@email.com',
      phone: '+91-9123456789',
      address: '123 गुरु द्वारा मार्ग, दिल्ली - 110001',
      dateOfBirth: new Date('1985-03-15'),
      gender: 'Female',
      bloodGroup: 'A+',
      emergencyContact: '+91-9123456790',
      medicalHistory: 'कोई ज्ञात एलर्जी नहीं, 2020 में सर्जरी',
    },
  });

  const patient2 = await prisma.patient.create({
    data: {
      name: 'राजेश कुमार (Rajesh Kumar)',
      email: 'rajesh.kumar@email.com',
      phone: '+91-9123456791',
      address: '456 गांधी नगर, मुंबई - 400001',
      dateOfBirth: new Date('1978-07-22'),
      gender: 'Male',
      bloodGroup: 'B+',
      emergencyContact: '+91-9123456792',
      medicalHistory: 'मधुमेह, नियमित दवा लेते हैं',
    },
  });

  const patient3 = await prisma.patient.create({
    data: {
      name: 'सुनीता देवी (Sunita Devi)',
      email: 'sunita.devi@email.com',
      phone: '+91-9123456793',
      address: '789 नेहरू कॉलोनी, कोलकाता - 700001',
      dateOfBirth: new Date('1992-11-08'),
      gender: 'Female',
      bloodGroup: 'O-',
      emergencyContact: '+91-9123456794',
      medicalHistory: 'स्वस्थ, कोई ज्ञात चिकित्सा समस्या नहीं',
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
      diagnosis: 'सामान्य सर्दी (Common Cold)',
      medications: JSON.stringify([
        {
          name: 'Amoxicillin',
          dosage: '500mg',
          frequency: 'दिन में तीन बार (Three times daily)',
          duration: '7 दिन (7 days)',
          instructions: 'भोजन के बाद लें (Take after meals)'
        }
      ]),
      frequency: 'दिन में तीन बार (Three times daily)',
      notes: 'आराम करें और पर्याप्त तरल पदार्थ लें',
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
