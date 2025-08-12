import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/router'
import Link from 'next/link'

// Enhanced Navigation Component
const Navigation = () => {
  const { data: session } = useSession()
  const router = useRouter()

  const handleSignOut = () => {
    signOut({ callbackUrl: '/auth/login' })
  }

  if (!session) return null

  const navItems = {
    admin: [
      { href: '/', label: 'Dashboard', icon: '🏠' },
      { href: '/patients', label: 'Patients', icon: '👥' },
      { href: '/doctors', label: 'Doctors', icon: '👨‍⚕️' },
      { href: '/appointments', label: 'Appointments', icon: '📅' },
      { href: '/prescriptions', label: 'Prescriptions', icon: '💊' },
      { href: '/billing', label: 'Billing', icon: '💰' },
    ],
    doctor: [
      { href: '/', label: 'Dashboard', icon: '🏠' },
      { href: '/appointments', label: 'My Appointments', icon: '📅' },
      { href: '/prescriptions', label: 'Prescriptions', icon: '💊' },
    ],
    receptionist: [
      { href: '/', label: 'Dashboard', icon: '🏠' },
      { href: '/patients', label: 'Patients', icon: '👥' },
      { href: '/appointments', label: 'Appointments', icon: '📅' },
      { href: '/billing', label: 'Billing', icon: '💰' },
    ],
  }

  const roleColors = {
    admin: 'from-red-500 to-pink-500',
    doctor: 'from-green-500 to-emerald-500',
    receptionist: 'from-purple-500 to-violet-500'
  }

  return (
    <nav className="bg-white shadow-lg border-b border-gray-100">
      <div className="container mx-auto px-6">
        <div className="flex justify-between items-center py-4">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">M+</span>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                MediCare Plus
              </h1>
              <p className="text-xs text-gray-500">Hospital Management</p>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems[session.user.role]?.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition duration-200 ${
                  router.pathname === item.href
                    ? 'bg-blue-50 text-blue-600 font-semibold'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="text-sm">{item.label}</span>
              </Link>
            ))}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-3">
              <div className={`w-8 h-8 bg-gradient-to-r ${roleColors[session.user.role]} rounded-full flex items-center justify-center`}>
                <span className="text-white text-xs font-bold">
                  {(session.user.name || session.user.email || 'U').charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">{session.user.name || session.user.email}</p>
                <p className="text-xs text-gray-500 capitalize">{session.user.role}</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:shadow-lg transform hover:-translate-y-0.5 transition duration-200"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

// Enhanced Layout Component
const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-cyan-50/30">
      <Navigation />
      <main className="container mx-auto px-6 py-8">{children}</main>
    </div>
  )
}

// Enhanced Loading Component
const Loading = () => (
  <div className="flex justify-center items-center min-h-screen">
    <div className="relative">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
          <span className="text-white font-bold">M+</span>
        </div>
      </div>
    </div>
  </div>
)

export default function Dashboard() {
  const { data: session } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState({
    patients: 0,
    doctors: 0,
    appointments: 0,
    pendingBills: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session) {
      router.push('/auth/login')
      return
    }
    fetchStats()
  }, [session, router])

  const fetchStats = async () => {
    try {
      const [patientsRes, doctorsRes, appointmentsRes, billingRes] = await Promise.all([
        fetch('/api/patients'),
        fetch('/api/doctors'),
        fetch('/api/appointments'),
        fetch('/api/billing'),
      ])

      const patientsData = await patientsRes.json()
      const doctorsData = await doctorsRes.json()
      const appointmentsData = await appointmentsRes.json()
      const billingData = await billingRes.json()

      setStats({
        patients: patientsData.patients?.length || 0,
        doctors: doctorsData.doctors?.length || 0,
        appointments: appointmentsData.appointments?.length || 0,
        pendingBills: billingData.billing?.filter(bill => bill.paymentStatus === 'pending').length || 0,
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!session) return <Loading />
  if (loading) return <Loading />

  const StatCard = ({ title, value, color, icon, gradient }) => (
    <div className={`bg-white rounded-2xl shadow-lg hover:shadow-xl transition duration-300 transform hover:-translate-y-1 border border-gray-100 overflow-hidden`}>
      <div className={`h-2 bg-gradient-to-r ${gradient}`}></div>
      <div className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">{title}</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
            <div className="flex items-center mt-2">
              <span className="text-xs text-green-600 font-medium">↗ +12%</span>
              <span className="text-xs text-gray-500 ml-1">from last month</span>
            </div>
          </div>
          <div className={`w-12 h-12 bg-gradient-to-r ${gradient} rounded-xl flex items-center justify-center shadow-lg`}>
            <span className="text-2xl">{icon}</span>
          </div>
        </div>
      </div>
    </div>
  )

  const QuickActionCard = ({ title, description, href, icon, color }) => (
    <Link href={href}>
      <div className={`bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition duration-300 transform hover:-translate-y-1 border border-gray-100 cursor-pointer group`}>
        <div className="flex items-center space-x-4">
          <div className={`w-12 h-12 bg-gradient-to-r ${color} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition duration-200`}>
            <span className="text-2xl">{icon}</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600">{description}</p>
          </div>
        </div>
      </div>
    </Link>
  )

  return (
    <Layout>
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent">
            Welcome back, {session?.user?.name}! 👋
          </h1>
          <p className="text-gray-600 mt-2">Here&apos;s what&apos;s happening at your hospital today</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Patients"
            value={stats.patients}
            gradient="from-blue-500 to-cyan-500"
            icon="👥"
          />
          <StatCard
            title="Total Doctors"
            value={stats.doctors}
            gradient="from-green-500 to-emerald-500"
            icon="👨‍⚕️"
          />
          <StatCard
            title="Appointments"
            value={stats.appointments}
            gradient="from-yellow-500 to-orange-500"
            icon="📅"
          />
          <StatCard
            title="Pending Bills"
            value={stats.pendingBills}
            gradient="from-red-500 to-pink-500"
            icon="💰"
          />
        </div>

        {/* Quick Actions */}
        {session?.user?.role === 'admin' && (
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <span className="text-white">⚡</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Quick Actions</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <QuickActionCard
                title="Add New Patient"
                description="Register a new patient"
                href="/patients/add"
                icon="👤"
                color="from-blue-500 to-cyan-500"
              />
              <QuickActionCard
                title="Schedule Appointment"
                description="Book new appointment"
                href="/appointments"
                icon="📅"
                color="from-green-500 to-emerald-500"
              />
              <QuickActionCard
                title="View Reports"
                description="Check system reports"
                href="/billing"
                icon="📊"
                color="from-purple-500 to-pink-500"
              />
            </div>
          </div>
        )}

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
              <span className="text-white">📈</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Recent Activity</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-4 bg-blue-50 rounded-xl">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600">👤</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900">New patient registered</p>
                <p className="text-sm text-gray-600">Suresh Babu was added to the system</p>
              </div>
              <span className="text-xs text-gray-500 ml-auto">5 min ago</span>
            </div>
            <div className="flex items-center space-x-4 p-4 bg-green-50 rounded-xl">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600">📅</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Appointment scheduled</p>
                <p className="text-sm text-gray-600">Dr. Rajesh Reddy with Meera Krishnan</p>
              </div>
              <span className="text-xs text-gray-500 ml-auto">12 min ago</span>
            </div>
            <div className="flex items-center space-x-4 p-4 bg-purple-50 rounded-xl">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600">💊</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Prescription added</p>
                <p className="text-sm text-gray-600">Medicine prescribed to patient</p>
              </div>
              <span className="text-xs text-gray-500 ml-auto">1 hour ago</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
