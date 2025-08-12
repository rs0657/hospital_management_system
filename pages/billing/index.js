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

export default function Billing() {
  const [bills, setBills] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [stats, setStats] = useState({
    total: 0,
    paid: 0,
    pending: 0,
    overdue: 0
  })
  const { data: session } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (!session) {
      router.push('/auth/login')
      return
    }
    fetchBills()
  }, [session, router])

  const fetchBills = async () => {
    try {
      const response = await fetch('/api/billing')
      const data = await response.json()
      const billsData = data.billing || []
      setBills(billsData)
      
      // Calculate stats
      const total = billsData.reduce((sum, bill) => sum + bill.amount, 0)
      const paid = billsData.filter(bill => bill.paymentStatus === 'paid').reduce((sum, bill) => sum + bill.amount, 0)
      const pending = billsData.filter(bill => bill.paymentStatus === 'pending').reduce((sum, bill) => sum + bill.amount, 0)
      const overdue = billsData.filter(bill => bill.paymentStatus === 'overdue').reduce((sum, bill) => sum + bill.amount, 0)
      
      setStats({ total, paid, pending, overdue })
    } catch (error) {
      console.error('Error fetching bills:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredBills = bills.filter(bill => {
    const matchesSearch = bill.patient?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bill.id.toString().includes(searchTerm.toLowerCase())
    const matchesStatus = !statusFilter || bill.paymentStatus === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status) => {
    const colors = {
      'paid': 'from-green-500 to-emerald-500',
      'pending': 'from-yellow-500 to-amber-500',
      'overdue': 'from-red-500 to-pink-500',
    }
    return colors[status] || 'from-gray-500 to-slate-500'
  }

  const getStatusIcon = (status) => {
    const icons = {
      'paid': '✅',
      'pending': '⏳',
      'overdue': '⚠️',
    }
    return icons[status] || '💰'
  }

  const updateBillStatus = async (id, paymentStatus) => {
    try {
      const response = await fetch(`/api/billing/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus })
      })
      if (response.ok) {
        fetchBills()
      }
    } catch (error) {
      console.error('Error updating bill:', error)
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }

  if (!session) return <Loading />
  if (loading) return <Loading />

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
              Billing Management
            </h1>
            <p className="text-gray-600 mt-2">Manage invoices and payments</p>
          </div>
          {['admin', 'receptionist'].includes(session?.user?.role) && (
            <Link href="/billing/add">
              <button className="bg-gradient-to-r from-emerald-500 to-green-500 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition duration-200 flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Create Invoice</span>
              </button>
            </Link>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl">💰</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Total Revenue</h3>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(stats.total)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl">✅</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Paid</h3>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.paid)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl">⏳</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Pending</h3>
                <p className="text-2xl font-bold text-yellow-600">{formatCurrency(stats.pending)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl">⚠️</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Overdue</h3>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(stats.overdue)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                className="w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition duration-200 bg-gray-50/50"
                placeholder="Search by patient name or invoice number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex space-x-2">
              <select
                className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-gray-50/50"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="overdue">Overdue</option>
              </select>
              <button className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition duration-200 flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bills List */}
        <div className="space-y-4">
          {filteredBills.map((bill) => (
            <div key={bill.id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition duration-300 border border-gray-100 overflow-hidden">
              <div className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
                  <div className="flex items-center space-x-4">
                    <div className={`w-16 h-16 bg-gradient-to-r ${getStatusColor(bill.paymentStatus)} rounded-xl flex items-center justify-center shadow-lg`}>
                      <span className="text-white text-2xl">
                        {getStatusIcon(bill.paymentStatus)}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {bill.patient?.name}
                      </h3>
                      <p className="text-sm text-gray-600">Bill ID: #{bill.id}</p>
                      <div className="flex items-center space-x-4 mt-2">
                        <div className="flex items-center space-x-1 text-sm text-gray-500">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 8a3 3 0 100-6 3 3 0 000 6z" />
                          </svg>
                          <span>{formatDate(bill.billDate)}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-sm text-gray-500">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                          </svg>
                          <span className="font-semibold">{formatCurrency(bill.amount)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className={`px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${getStatusColor(bill.paymentStatus)} text-white`}>
                      {bill.paymentStatus?.toUpperCase() || 'PENDING'}
                    </div>
                    
                    {bill.paymentStatus === 'pending' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => updateBillStatus(bill.id, 'paid')}
                          className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:shadow-lg transform hover:-translate-y-0.5 transition duration-200"
                        >
                          Mark Paid
                        </button>
                        <button
                          onClick={() => updateBillStatus(bill.id, 'overdue')}
                          className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:shadow-lg transform hover:-translate-y-0.5 transition duration-200"
                        >
                          Mark Overdue
                        </button>
                      </div>
                    )}
                    
                    <Link href={`/billing/${bill.id}`}>
                      <button className="bg-gray-100 text-gray-700 p-2 rounded-lg hover:bg-gray-200 transition duration-200">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                    </Link>
                  </div>
                </div>

                {/* Description */}
                {bill.description && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <span className="text-sm font-medium text-gray-700">Description:</span>
                      <p className="text-sm text-gray-600 mt-1">{bill.description}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredBills.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No bills found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || statusFilter ? 'No bills match your search criteria.' : 'Start by creating your first invoice.'}
            </p>
            {['admin', 'receptionist'].includes(session?.user?.role) && (
              <Link href="/billing/add">
                <button className="bg-gradient-to-r from-emerald-500 to-green-500 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition duration-200">
                  Create First Invoice
                </button>
              </Link>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}
