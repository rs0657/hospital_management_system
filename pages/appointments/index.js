import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/router'
import Link from 'next/link'

// Reusable Components
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

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-cyan-50/30">
      <Navigation />
      <main className="container mx-auto px-6 py-8">{children}</main>
    </div>
  )
}

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

export default function Appointments() {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const { data: session } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (!session) {
      router.push('/auth/login')
      return
    }
    fetchAppointments()
  }, [session, router])

  const fetchAppointments = async () => {
    try {
      const response = await fetch('/api/appointments')
      const data = await response.json()
      setAppointments(data.appointments || [])
    } catch (error) {
      console.error('Error fetching appointments:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredAppointments = appointments.filter(appointment => {
    const matchesStatus = !statusFilter || appointment.status === statusFilter
    const matchesDate = !dateFilter || new Date(appointment.date).toDateString() === new Date(dateFilter).toDateString()
    return matchesStatus && matchesDate
  })

  const getStatusColor = (status) => {
    const colors = {
      'scheduled': 'from-blue-500 to-cyan-500',
      'completed': 'from-green-500 to-emerald-500',
      'cancelled': 'from-red-500 to-pink-500',
      'no-show': 'from-gray-500 to-slate-500',
    }
    return colors[status] || 'from-gray-500 to-slate-500'
  }

  const getStatusIcon = (status) => {
    const icons = {
      'scheduled': '📅',
      'completed': '✅',
      'cancelled': '❌',
      'no-show': '⏰',
    }
    return icons[status] || '📅'
  }

  const updateAppointmentStatus = async (id, status) => {
    try {
      const response = await fetch(`/api/appointments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      if (response.ok) {
        fetchAppointments()
      }
    } catch (error) {
      console.error('Error updating appointment:', error)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (!session) return <Loading />
  if (loading) return <Loading />

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
              Appointment Management
            </h1>
            <p className="text-gray-600 mt-2">
              {session.user.role === 'doctor' ? 'View and manage your appointments' : 'Manage all appointments'}
            </p>
          </div>
          {['admin', 'receptionist'].includes(session?.user?.role) && (
            <Link href="/appointments/add">
              <button className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition duration-200 flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Book Appointment</span>
              </button>
            </Link>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">
            <div className="flex space-x-4">
              <select
                className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-50/50"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="no-show">No Show</option>
              </select>
              <input
                type="date"
                className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-50/50"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>
            <div className="flex space-x-2 ml-auto">
              <button className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition duration-200 flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                <span>Calendar View</span>
              </button>
              <button className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition duration-200 flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>

        {/* Appointments List */}
        <div className="space-y-4">
          {filteredAppointments.map((appointment) => (
            <div key={appointment.id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition duration-300 border border-gray-100 overflow-hidden">
              <div className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
                  <div className="flex items-center space-x-4">
                    <div className={`w-16 h-16 bg-gradient-to-r ${getStatusColor(appointment.status)} rounded-xl flex items-center justify-center shadow-lg`}>
                      <span className="text-white text-2xl">
                        {getStatusIcon(appointment.status)}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {appointment.patient?.name} → {appointment.doctor?.name}
                      </h3>
                      <p className="text-sm text-gray-600">{appointment.doctor?.specialization}</p>
                      <div className="flex items-center space-x-4 mt-2">
                        <div className="flex items-center space-x-1 text-sm text-gray-500">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 8a3 3 0 100-6 3 3 0 000 6z" />
                          </svg>
                          <span>{formatDate(appointment.date)}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-sm text-gray-500">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{appointment.time}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className={`px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${getStatusColor(appointment.status)} text-white`}>
                      {appointment.status.toUpperCase()}
                    </div>
                    
                    {appointment.status === 'scheduled' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => updateAppointmentStatus(appointment.id, 'completed')}
                          className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:shadow-lg transform hover:-translate-y-0.5 transition duration-200"
                        >
                          Complete
                        </button>
                        <button
                          onClick={() => updateAppointmentStatus(appointment.id, 'cancelled')}
                          className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:shadow-lg transform hover:-translate-y-0.5 transition duration-200"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                    
                    <Link href={`/appointments/${appointment.id}`}>
                      <button className="bg-gray-100 text-gray-700 p-2 rounded-lg hover:bg-gray-200 transition duration-200">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                    </Link>
                  </div>
                </div>

                {appointment.notes && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Notes:</span> {appointment.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredAppointments.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 8a3 3 0 100-6 3 3 0 000 6z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No appointments found</h3>
            <p className="text-gray-600 mb-6">
              {statusFilter || dateFilter ? 'No appointments match your filters.' : 'Start by booking your first appointment.'}
            </p>
            {['admin', 'receptionist'].includes(session?.user?.role) && (
              <Link href="/appointments/add">
                <button className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition duration-200">
                  Book First Appointment
                </button>
              </Link>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}
