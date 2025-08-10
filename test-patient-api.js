// Test script to verify patient creation API
// This can be run in browser console after logging in as receptionist

const testPatientCreation = async () => {
  const testPatient = {
    name: "Test Patient",
    email: "test@example.com",
    phone: "1234567890",
    address: "123 Test Street, Test City",
    dateOfBirth: "1990-01-01",
    gender: "Male",
    bloodGroup: "O+",
    emergencyContact: "9876543210",
    medicalHistory: "No known allergies"
  };

  try {
    console.log('Testing patient creation API...');
    const response = await fetch('/api/patients', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPatient)
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Patient created successfully:', result);
    } else {
      console.error('❌ Error creating patient:', result);
    }
    
    return { success: response.ok, data: result, status: response.status };
  } catch (error) {
    console.error('❌ Network error:', error);
    return { success: false, error: error.message };
  }
};

// Call the test function
testPatientCreation();
