import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/router'
import Link from 'next/link'

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
                  {session.user.name.charAt(0)}
                </span>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">{session.user.name}</p>
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

export default function DoctorDetail() {
  const [doctor, setDoctor] = useState(null)
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const { data: session } = useSession()
  const router = useRouter()
  const { id } = router.query

  useEffect(() => {
    if (!session) {
      router.push('/auth/login')
      return
    }
    
    const fetchDoctorData = async () => {
      if (!id) return
      try {
        // Fetch doctor details
        const doctorResponse = await fetch(`/api/doctors/${id}`)
        if (doctorResponse.ok) {
          const doctorData = await doctorResponse.json()
          setDoctor(doctorData)
        }

        // Fetch doctor appointments
        const appointmentsResponse = await fetch(`/api/appointments?doctorId=${id}`)
        if (appointmentsResponse.ok) {
          const appointmentsData = await appointmentsResponse.json()
          setAppointments(appointmentsData)
        }
      } catch (error) {
        console.error('Error fetching doctor data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchDoctorData()
  }, [session, id, router])

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (!session || loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    )
  }

  if (!doctor) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Doctor Not Found</h1>
          <Link href="/doctors">
            <button className="bg-blue-500 text-white px-6 py-3 rounded-lg">
              Back to Doctors
            </button>
          </Link>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{doctor.name}</h1>
            <p className="text-gray-600">{doctor.specialization}</p>
          </div>
          <Link href="/doctors">
            <button className="bg-gray-500 text-white px-4 py-2 rounded-lg">
              Back to List
            </button>
          </Link>
        </div>

        {/* Doctor Information Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Professional Information */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Professional Information</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Full Name</label>
                <p className="text-lg text-gray-900">{doctor.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Specialization</label>
                <p className="text-gray-900">{doctor.specialization}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Qualification</label>
                <p className="text-gray-900">{doctor.qualification}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Experience</label>
                <p className="text-gray-900">{doctor.experience} years</p>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Information</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Phone Number</label>
                <p className="text-gray-900">{doctor.phone}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Email Address</label>
                <p className="text-gray-900">{doctor.email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Appointments */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Appointments</h2>
          {appointments.length > 0 ? (
            <div className="space-y-3">
              {appointments.slice(0, 10).map((appointment) => (
                <div key={appointment.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{appointment.patient?.name}</p>
                    <p className="text-sm text-gray-600">{appointment.reason || 'General consultation'}</p>
                    <p className="text-sm text-gray-500">{formatDate(appointment.appointmentDate)}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                      appointment.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                      appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {appointment.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No appointments found</p>
          )}
        </div>

        {/* Statistics */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {appointments.length}
            </div>
            <p className="text-gray-600">Total Appointments</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {appointments.filter(apt => apt.status === 'completed').length}
            </div>
            <p className="text-gray-600">Completed</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-yellow-600 mb-2">
              {appointments.filter(apt => apt.status === 'scheduled').length}
            </div>
            <p className="text-gray-600">Scheduled</p>
          </div>
        </div>
      </div>
    </Layout>
  )
}
