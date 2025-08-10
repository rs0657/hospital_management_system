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

export default function BillingDetail() {
  const [bill, setBill] = useState(null)
  const [loading, setLoading] = useState(true)
  const { data: session } = useSession()
  const router = useRouter()
  const { id } = router.query

  useEffect(() => {
    if (!session) {
      router.push('/auth/login')
      return
    }
    
    const fetchBill = async () => {
      if (!id) return
      try {
        const response = await fetch(`/api/billing/${id}`)
        if (response.ok) {
          const data = await response.json()
          setBill(data)
        } else {
          router.push('/billing')
        }
      } catch (error) {
        console.error('Error fetching bill:', error)
        router.push('/billing')
      } finally {
        setLoading(false)
      }
    }
    
    fetchBill()
  }, [session, id, router])

  const updateStatus = async (status) => {
    try {
      const response = await fetch(`/api/billing/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus: status })
      })
      if (response.ok) {
        // Refetch the bill data
        const billResponse = await fetch(`/api/billing/${id}`)
        if (billResponse.ok) {
          const data = await billResponse.json()
          setBill(data)
        }
      }
    } catch (error) {
      console.error('Error updating bill:', error)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      'paid': 'from-green-500 to-emerald-500',
      'pending': 'from-yellow-500 to-amber-500',
      'overdue': 'from-red-500 to-pink-500',
    }
    return colors[status] || 'from-gray-500 to-slate-500'
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
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

  if (!bill) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Bill Not Found</h1>
          <Link href="/billing">
            <button className="bg-blue-500 text-white px-6 py-3 rounded-lg">
              Back to Billing
            </button>
          </Link>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Invoice Details</h1>
            <p className="text-gray-600">Invoice #{bill.id}</p>
          </div>
          <Link href="/billing">
            <button className="bg-gray-500 text-white px-4 py-2 rounded-lg">
              Back to List
            </button>
          </Link>
        </div>

        {/* Status Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div className={`px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r ${getStatusColor(bill.paymentStatus)} text-white`}>
              {bill.paymentStatus?.toUpperCase() || 'PENDING'}
            </div>
            
            {bill.paymentStatus === 'pending' && ['admin', 'receptionist'].includes(session?.user?.role) && (
              <div className="flex space-x-2">
                <button
                  onClick={() => updateStatus('paid')}
                  className="bg-green-500 text-white px-4 py-2 rounded-lg"
                >
                  Mark Paid
                </button>
                <button
                  onClick={() => updateStatus('overdue')}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg"
                >
                  Mark Overdue
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Bill Information Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Patient Information */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Patient Information</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Name</label>
                <p className="text-lg text-gray-900">{bill.patient.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Phone</label>
                <p className="text-gray-900">{bill.patient.phone}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p className="text-gray-900">{bill.patient.email || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Address</label>
                <p className="text-gray-900">{bill.patient.address}</p>
              </div>
            </div>
          </div>

          {/* Bill Details */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Bill Details</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Bill Date</label>
                <p className="text-lg text-gray-900">{formatDate(bill.billDate)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Amount</label>
                <p className="text-2xl font-bold text-emerald-600">{formatCurrency(bill.amount)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Payment Status</label>
                <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r ${getStatusColor(bill.paymentStatus)} text-white mt-1`}>
                  {bill.paymentStatus?.toUpperCase() || 'PENDING'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        {bill.description && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Description</h2>
            <p className="text-gray-700 leading-relaxed">{bill.description}</p>
          </div>
        )}

        {/* Billing History/Actions */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Actions</h2>
          <div className="flex space-x-4">
            <button className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition duration-200">
              Print Invoice
            </button>
            <button className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition duration-200">
              Download PDF
            </button>
            <button className="bg-purple-500 text-white px-6 py-3 rounded-lg hover:bg-purple-600 transition duration-200">
              Send Email
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}
