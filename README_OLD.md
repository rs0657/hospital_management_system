# Hospital Patient Record System

A comprehensive hospital management system built with Next.js, featuring role-based authentication, patient management, appointment scheduling, prescription management, and billing.

## 🚀 Features

### Authentication & Authorization
- **Role-based access control** (Admin, Doctor, Receptionist)
- **NextAuth.js** with credentials provider
- **Secure password hashing** with bcryptjs

### Core Modules
- **Patient Management** - Add, view, edit patient records
- **Doctor Management** - Manage doctor profiles and specialties
- **Appointment Scheduling** - Book and manage appointments
- **Prescription Management** - Create and track prescriptions
- **Billing System** - Generate bills and track payments

### Role Permissions
- **Admin**: Full CRUD access to all modules
- **Doctor**: View appointments, add prescriptions
- **Receptionist**: Add patients, book appointments, manage billing

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 (Pages Router), Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: MySQL with Prisma ORM
- **Authentication**: NextAuth.js
- **UI**: Tailwind CSS with responsive design

## 📋 Prerequisites

- Node.js 18+ 
- MySQL Database
- npm or yarn package manager

## 🚀 Quick Start

### 1. Clone & Install
```bash
git clone <repository-url>
cd hospital_management
npm install
```

### 2. Database Setup
```bash
# Create MySQL database
mysql -u root -p
CREATE DATABASE hospital_management;
```

### 3. Environment Configuration
Copy `.env.example` to `.env` and update:
```env
DATABASE_URL="mysql://username:password@localhost:3306/hospital_management"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
```

### 4. Database Migration & Seeding
```bash
# Run migrations
npx prisma migrate dev --name init

# Seed database with demo data
npm run db:seed
```

### 5. Start Development Server
```bash
npm run dev
```

Visit `http://localhost:3000` and login with demo accounts.

## 👥 Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@hospital.com | password123 |
| Doctor | doctor1@hospital.com | password123 |
| Receptionist | receptionist@hospital.com | password123 |

## 📁 Project Structure

```
hospital_management/
├── pages/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── [...nextauth].js    # NextAuth configuration
│   │   │   └── register.js         # User registration (Admin only)
│   │   ├── patients.js             # Patient CRUD operations
│   │   ├── doctors.js              # Doctor management
│   │   ├── appointments.js         # Appointment scheduling
│   │   ├── prescriptions.js        # Prescription management
│   │   └── billing.js              # Billing operations
│   ├── auth/
│   │   └── login.js                # Login page
│   ├── patients/
│   │   ├── index.js                # Patient list
│   │   └── add.js                  # Add patient form
│   ├── doctors/
│   ├── appointments/
│   ├── prescriptions/
│   ├── billing/
│   ├── _app.js                     # App configuration
│   └── index.js                    # Dashboard
├── prisma/
│   ├── schema.prisma               # Database schema
│   └── seed.js                     # Database seeding
├── styles/
│   └── globals.css                 # Global styles
└── frontend-all-pages.js           # All frontend components (reference)
```

## 🗄️ Database Schema

### Models
- **User** - System users with role-based access
- **Patient** - Patient information and medical records
- **Doctor** - Doctor profiles and specialties
- **Appointment** - Appointment scheduling and status
- **Prescription** - Medical prescriptions linked to appointments
- **Billing** - Patient billing and payment tracking

## 🔧 API Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/api/auth/register` | Create user | Admin |
| GET | `/api/patients` | List patients | All |
| POST | `/api/patients` | Add patient | Admin, Receptionist |
| GET | `/api/doctors` | List doctors | All |
| POST | `/api/doctors` | Add doctor | Admin |
| GET | `/api/appointments` | List appointments | Role-based |
| POST | `/api/appointments` | Create appointment | Admin, Receptionist |
| POST | `/api/prescriptions` | Add prescription | Admin, Doctor |
| GET | `/api/billing` | View billing | All |
| POST | `/api/billing` | Create bill | Admin, Receptionist |

## 🎨 Frontend Pages

### Dashboard (`/`)
- Role-specific navigation
- Statistics overview
- Quick action buttons

### Authentication (`/auth/login`)
- Secure login form
- Demo account information
- Error handling

### Patient Management (`/patients`)
- Patient listing with search
- Add new patients
- Patient details view

### Appointments (`/appointments`)
- Appointment calendar view
- Schedule new appointments
- Status management

### Prescriptions (`/prescriptions`)
- Prescription history
- Add new prescriptions (Doctors)
- Patient-prescription mapping

### Billing (`/billing`)
- Payment status tracking
- Generate new bills
- Financial summary

## 🛡️ Security Features

- **JWT-based authentication**
- **Role-based route protection**
- **Password hashing with bcryptjs**
- **SQL injection prevention with Prisma**
- **CSRF protection**

## 🔄 Development Workflow

### Adding New Features
1. Define database schema in `prisma/schema.prisma`
2. Create migration: `npx prisma migrate dev`
3. Implement API endpoints in `pages/api/`
4. Create frontend pages and components
5. Test with different user roles

### Database Management
```bash
# View database in Prisma Studio
npx prisma studio

# Reset database
npx prisma migrate reset

# Generate new migration
npx prisma migrate dev --name feature_name
```

## 📱 Responsive Design

The application is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile devices

## 🚀 Deployment

### Production Build
```bash
npm run build
npm start
```

### Environment Variables for Production
```env
DATABASE_URL="your-production-database-url"
NEXTAUTH_URL="your-production-domain"
NEXTAUTH_SECRET="your-production-secret"
```

## 🧪 Testing

### Test User Flows
1. **Admin Flow**: Login → Manage all modules → Create users
2. **Doctor Flow**: Login → View appointments → Add prescriptions
3. **Receptionist Flow**: Login → Add patients → Schedule appointments → Process billing

## 📝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/new-feature`)
3. Commit changes (`git commit -am 'Add new feature'`)
4. Push to branch (`git push origin feature/new-feature`)
5. Create Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, email support@hospital-system.com or create an issue in the repository.

## 🔮 Future Enhancements

- [ ] Email notifications for appointments
- [ ] PDF report generation
- [ ] Advanced search and filtering
- [ ] Mobile app companion
- [ ] Insurance integration
- [ ] Telemedicine features
- [ ] Analytics dashboard
- [ ] Multi-language support

---

Built with ❤️ using Next.js and Prisma
