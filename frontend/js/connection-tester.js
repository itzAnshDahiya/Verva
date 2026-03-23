/* =========================================================
   VERVA – Connection Tester | Quick API Diagnostics
   ========================================================= */

console.log('%c🔍 VERVA API Connection Tester', 'font-size:16px;font-weight:bold;color:#1abc9c;');

// Test 1: Backend Reachability
async function testBackendConnection() {
  console.log('\n📡 Test 1: Backend Connection...');
  try {
    const response = await fetch('http://localhost:5000/api/v1/auth/signup', {
      method: 'OPTIONS', // CORS preflight
    });
    console.log('✅ Backend is reachable');
    return true;
  } catch (error) {
    console.error('❌ Backend not reachable:', error.message);
    return false;
  }
}

// Test 2: Test Signup
async function testSignup() {
  console.log('\n📝 Test 2: Signup Endpoint...');
  const testEmail = `test-${Date.now()}@example.com`;
  
  try {
    const response = await fetch('http://localhost:5000/api/v1/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test User',
        email: testEmail,
        password: 'testPass123',
        phone: '9876543210',
      }),
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Signup works!');
      console.log('Response:', data);
      return { success: true, data, email: testEmail };
    } else {
      console.error('❌ Signup failed:', data);
      return { success: false, data, email: testEmail };
    }
  } catch (error) {
    console.error('❌ Signup error:', error.message);
    return { success: false, error };
  }
}

// Test 3: Test Login
async function testLogin(email, password) {
  console.log('\n🔐 Test 3: Login Endpoint...');
  
  try {
    const response = await fetch('http://localhost:5000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Login works!');
      console.log('Response:', data);
      return { success: true, data };
    } else {
      console.error('❌ Login failed:', data);
      return { success: false, data };
    }
  } catch (error) {
    console.error('❌ Login error:', error.message);
    return { success: false, error };
  }
}

// Test 4: Check localStorage
function testLocalStorage() {
  console.log('\n💾 Test 4: LocalStorage State...');
  const token = localStorage.getItem('VERVA-token');
  const refreshToken = localStorage.getItem('VERVA-refresh-token');
  const user = localStorage.getItem('VERVA-user');
  
  console.log('Access Token:', token ? '✅ Present' : '❌ Missing');
  console.log('Refresh Token:', refreshToken ? '✅ Present' : '❌ Missing');
  console.log('User Object:', user ? '✅ Present' : '❌ Missing');
  
  if (user) {
    console.log('User Data:', JSON.parse(user));
  }
}

// Main test runner
window.runFullTest = async function() {
  console.clear();
  console.log('%c🔍 VERVA Full API Test Suite', 'font-size:16px;font-weight:bold;color:#1abc9c;');
  
  const backendOk = await testBackendConnection();
  
  if (!backendOk) {
    console.error('\n⚠️  Backend not running. Start it with: cd backend && npm run dev');
    return;
  }
  
  const signupResult = await testSignup();
  testLocalStorage();
  
  if (signupResult.success) {
    const loginResult = await testLogin(signupResult.email, 'testPass123');
    
    if (loginResult.success) {
      console.log('\n✅ ✅ ✅ All tests passed! Authentication working!');
    }
  } else {
    console.log('\n⚠️  Check the errors above to see what failed');
  }
};

// Run on startup
console.log('\n💡 Usage:');
console.log('  runFullTest() - Run all connection tests');
console.log('  testBackendConnection() - Test backend is running');
console.log('  testSignup() - Test signup endpoint');
console.log('  testLogin(email, password) - Test login endpoint');
console.log('  testLocalStorage() - Check token storage\n');

// Auto-run on page load if you want
// testBackendConnection();
