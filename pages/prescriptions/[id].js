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

export default function PrescriptionDetail() {
  const [prescription, setPrescription] = useState(null)
  const [loading, setLoading] = useState(true)
  const { data: session } = useSession()
  const router = useRouter()
  const { id } = router.query

  useEffect(() => {
    if (!session) {
      router.push('/auth/login')
      return
    }
    
    const fetchPrescription = async () => {
      if (!id) return
      try {
        const response = await fetch(`/api/prescriptions/${id}`)
        if (response.ok) {
          const data = await response.json()
          setPrescription(data)
        } else {
          router.push('/prescriptions')
        }
      } catch (error) {
        console.error('Error fetching prescription:', error)
        router.push('/prescriptions')
      } finally {
        setLoading(false)
      }
    }
    
    fetchPrescription()
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

  if (!prescription) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Prescription Not Found</h1>
          <Link href="/prescriptions">
            <button className="bg-blue-500 text-white px-6 py-3 rounded-lg">
              Back to Prescriptions
            </button>
          </Link>
        </div>
      </Layout>
    )
  }

  const medications = JSON.parse(prescription.medications || '[]')

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Prescription Details</h1>
            <p className="text-gray-600">Prescription #{prescription.id}</p>
          </div>
          <Link href="/prescriptions">
            <button className="bg-gray-500 text-white px-4 py-2 rounded-lg">
              Back to List
            </button>
          </Link>
        </div>

        {/* Prescription Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Patient Information</h2>
              <div className="space-y-2">
                <p className="text-lg font-medium text-gray-900">{prescription.patient.name}</p>
                <p className="text-sm text-gray-600">Phone: {prescription.patient.phone}</p>
                <p className="text-sm text-gray-600">
                  Age: {new Date().getFullYear() - new Date(prescription.patient.dateOfBirth).getFullYear()} years
                </p>
              </div>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Doctor Information</h2>
              <div className="space-y-2">
                <p className="text-lg font-medium text-gray-900">{prescription.doctor.name}</p>
                <p className="text-sm text-gray-600">{prescription.doctor.specialization}</p>
                <p className="text-sm text-gray-600">Phone: {prescription.doctor.phone}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Diagnosis */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Diagnosis</h2>
          <p className="text-gray-700 text-lg">{prescription.diagnosis}</p>
        </div>

        {/* Medications */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Prescribed Medications</h2>
          {medications.length > 0 ? (
            <div className="space-y-4">
              {medications.map((medication, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Medicine Name</label>
                      <p className="text-gray-900 font-medium">{medication.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Dosage</label>
                      <p className="text-gray-900">{medication.dosage}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Frequency</label>
                      <p className="text-gray-900">{medication.frequency}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Duration</label>
                      <p className="text-gray-900">{medication.duration}</p>
                    </div>
                    {medication.instructions && (
                      <div className="md:col-span-2 lg:col-span-4">
                        <label className="text-sm font-medium text-gray-500">Instructions</label>
                        <p className="text-gray-700">{medication.instructions}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No medications prescribed</p>
          )}
        </div>

        {/* Additional Information */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Frequency</h2>
            <p className="text-gray-700">{prescription.frequency}</p>
          </div>
          
          {prescription.notes && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Notes</h2>
              <p className="text-gray-700">{prescription.notes}</p>
            </div>
          )}
        </div>

        {/* Prescription Date */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Prescription Date</h2>
          <p className="text-gray-700">{formatDate(prescription.createdAt)}</p>
        </div>
      </div>
    </Layout>
  )
}
