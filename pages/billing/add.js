import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function AddBilling() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState([]);
  const [formData, setFormData] = useState({
    patientId: '',
    description: '',
    amount: '',
    paymentStatus: 'pending',
    billDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchPatients();
  }, []);

  // Redirect if not authenticated
  if (status === 'loading') return <div>Loading...</div>;
  if (!session) {
    router.push('/auth/login');
    return null;
  }

  // Check if user has permission (admin or receptionist)
  if (!['admin', 'receptionist'].includes(session.user.role)) {
    router.push('/');
    return null;
  }

  const fetchPatients = async () => {
    try {
      const response = await fetch('/api/patients');
      if (response.ok) {
        const data = await response.json();
        setPatients(data.patients || []);
      } else {
        console.error('Failed to fetch patients:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const billingData = {
        patientId: parseInt(formData.patientId),
        description: formData.description,
        amount: parseFloat(formData.amount),
        paymentStatus: formData.paymentStatus,
        billDate: new Date(formData.billDate).toISOString()
      };

      const response = await fetch('/api/billing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(billingData),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Billing record created successfully!');
        router.push('/billing');
      } else {
        alert(data.message || 'Error creating billing record');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error creating billing record');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Add Billing - Hospital Management</title>
      </Head>
      
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Create Billing Record
            </h2>
          </div>
          
          <form className="mt-8 space-y-6 bg-white p-6 rounded-lg shadow" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="patientId" className="block text-sm font-medium text-gray-700">
                  Select Patient *
                </label>
                <select
                  id="patientId"
                  name="patientId"
                  required
                  value={formData.patientId}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Choose a patient</option>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.name} - {patient.phone}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Service Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  required
                  rows="3"
                  placeholder="e.g., Consultation fee, Lab tests, Surgery, Medication..."
                  value={formData.description}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                    Amount ($) *
                  </label>
                  <input
                    id="amount"
                    name="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="billDate" className="block text-sm font-medium text-gray-700">
                    Bill Date *
                  </label>
                  <input
                    id="billDate"
                    name="billDate"
                    type="date"
                    required
                    value={formData.billDate}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="paymentStatus" className="block text-sm font-medium text-gray-700">
                  Payment Status *
                </label>
                <select
                  id="paymentStatus"
                  name="paymentStatus"
                  required
                  value={formData.paymentStatus}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="partially_paid">Partially Paid</option>
                  <option value="overdue">Overdue</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="flex space-x-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Billing Record'}
              </button>
              
              <button
                type="button"
                onClick={() => router.push('/billing')}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
