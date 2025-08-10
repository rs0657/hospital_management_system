# 🏥 Hospital Management System

A comprehensive, modern hospital management system built with **Next.js**, **Prisma**, **SQLite**, and **Tailwind CSS**. Features a beautiful, responsive UI with role-based access control for managing patients, doctors, appointments, prescriptions, and billing.

![Hospital Management System](https://img.shields.io/badge/Next.js-15.4.6-black?style=for-the-badge&logo=next.js)
![Prisma](https://img.shields.io/badge/Prisma-6.13.0-2D3748?style=for-the-badge&logo=prisma)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.1-06B6D4?style=for-the-badge&logo=tailwind-css)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite)

## ✨ Features

### 🔐 **Authentication & Authorization**
- **NextAuth.js** integration with credentials provider
- **Role-based access control** (Admin, Doctor, Receptionist)
- Secure session management with JWT

### 👥 **Patient Management**
- Complete patient profiles with personal information
- Search and filter functionality
- Medical history tracking
- Responsive card-based UI

### 👨‍⚕️ **Doctor Management**
- Doctor profiles with specialties
- Experience and consultation fee tracking
- Specialty-based color coding
- License number management

### 📅 **Appointment System**
- Appointment scheduling and management
- Status tracking (Scheduled, Completed, Cancelled, No-show)
- Real-time status updates
- Date and time filtering

### 💊 **Prescription Management**
- Digital prescription creation
- Medication tracking with dosages
- Doctor and patient association
- Prescription history

### 💰 **Billing System**
- Invoice generation and management
- Payment status tracking
- Service breakdown
- Financial reporting dashboard

### 🎨 **Modern UI/UX**
- **Responsive design** for all screen sizes
- **Gradient backgrounds** and modern styling
- **Hover animations** and smooth transitions
- **Color-coded sections** for easy navigation
- **Mobile-first approach**

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+ 
- **npm** or **yarn**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/rs0657/hospital_management_system.git
   cd hospital_management_system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Update the `.env` file with your configuration:
   ```env
   DATABASE_URL="file:./dev.db"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key-here"
   ```

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   npm run db:seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Project Structure

```
hospital_management_system/
├── 📁 pages/              # Next.js pages and API routes
│   ├── 📁 api/            # REST API endpoints
│   ├── 📁 auth/           # Authentication pages
│   ├── 📁 patients/       # Patient management
│   ├── 📁 doctors/        # Doctor management
│   ├── 📁 appointments/   # Appointment system
│   ├── 📁 prescriptions/  # Prescription management
│   └── 📁 billing/        # Billing system
├── 📁 prisma/             # Database schema and seed
├── 📁 styles/             # Tailwind CSS styles
├── 📁 public/             # Static assets
└── 📁 .vscode/            # VS Code configuration
```

## 🛠️ Built With

- **[Next.js 15.4.6](https://nextjs.org/)** - React framework with App Router
- **[Prisma 6.13.0](https://prisma.io/)** - Database ORM
- **[SQLite](https://sqlite.org/)** - Lightweight database
- **[NextAuth.js 4.24.11](https://next-auth.js.org/)** - Authentication
- **[Tailwind CSS 3.4.1](https://tailwindcss.com/)** - Utility-first CSS
- **[React 19.1.0](https://react.dev/)** - UI library

## 📊 Database Schema

The system uses a relational database with the following entities:
- **Users** (Authentication & roles)
- **Patients** (Patient information)
- **Doctors** (Doctor profiles)
- **Appointments** (Scheduling)
- **Prescriptions** (Medical prescriptions)
- **Billing** (Financial records)

## 🎭 User Roles

### 👑 **Admin**
- Full system access
- User management
- System configuration
- All CRUD operations

### 👨‍⚕️ **Doctor**
- View appointments
- Manage prescriptions
- Update appointment status
- Patient records access

### 👩‍💼 **Receptionist**
- Patient management
- Appointment scheduling
- Billing operations
- Basic system access

## 🔧 Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Database
npx prisma generate  # Generate Prisma client
npx prisma db push   # Push schema to database
npm run db:seed      # Seed database with sample data
npx prisma studio    # Open Prisma Studio
```

## 🎨 UI Components

- **Navigation Bar** with role-based menu items
- **Dashboard Cards** with statistics and quick actions
- **Data Tables** with search and filtering
- **Form Components** with validation
- **Status Badges** with color coding
- **Modal Dialogs** for actions
- **Loading States** and animations

## 🔒 Security Features

- **JWT-based authentication**
- **Role-based route protection**
- **Input validation and sanitization**
- **SQL injection prevention** (Prisma ORM)
- **Environment variable protection**

## 📱 Responsive Design

- **Mobile-first approach**
- **Responsive navigation**
- **Adaptive layouts**
- **Touch-friendly interfaces**
- **Cross-browser compatibility**

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Configure environment variables
3. Deploy automatically on push

### Manual Deployment
```bash
npm run build
npm run start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**rs0657**
- GitHub: [@rs0657](https://github.com/rs0657)

## 🆘 Support

If you have any questions or need help with setup, please open an issue in the GitHub repository.

---

**⭐ If you find this project helpful, please give it a star on GitHub!**
